import http from 'node:http';
import {timingSafeEqual} from 'node:crypto';
import {mkdirSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {validateReminders, sendTwilio} from './reminders.js';
const port=Number(process.env.PORT||3001), accessToken=process.env.POLYPLAN_ACCESS_TOKEN||'';
const origin=process.env.APP_ORIGIN||'http://localhost:5173';
const config={account:process.env.TWILIO_ACCOUNT_SID,token:process.env.TWILIO_AUTH_TOKEN,from:process.env.TWILIO_FROM_NUMBER,to:process.env.SMS_TO_NUMBER};
const configured=Boolean(/^AC[a-fA-F0-9]{32}$/.test(config.account||'')&&config.token&&/^\+[1-9]\d{7,14}$/.test(config.from||'')&&/^\+[1-9]\d{7,14}$/.test(config.to||'')&&accessToken.length>=32);
mkdirSync('server-data',{recursive:true,mode:0o700});
const db=new DatabaseSync('server-data/reminders.sqlite');
db.exec(`PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS reminders (key TEXT PRIMARY KEY,id TEXT,title TEXT,at INTEGER,status TEXT,provider_id TEXT); CREATE TABLE IF NOT EXISTS settings (id INTEGER PRIMARY KEY CHECK(id=1),enabled INTEGER DEFAULT 0,last_sync INTEGER); INSERT OR IGNORE INTO settings(id,enabled) VALUES(1,0);`);
const state=()=>db.prepare('SELECT * FROM settings WHERE id=1').get();
function authorized(req){const provided=Buffer.from((req.headers.authorization||'').replace(/^Bearer /,'')),expected=Buffer.from(accessToken);return accessToken.length>=32&&provided.length===expected.length&&timingSafeEqual(provided,expected)}
function reply(res,code,body){res.writeHead(code,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(body))}
async function read(req){let body='';for await(const chunk of req){body+=chunk;if(body.length>300000)throw new Error('Request too large')}return JSON.parse(body)}
const server=http.createServer(async(req,res)=>{
  if(req.headers.origin&&req.headers.origin!==origin)return reply(res,403,{error:'Unrecognized app origin'});
  if(!authorized(req))return reply(res,401,{error:'A valid private connection key is required.'});
  try{
    if(req.method==='GET'&&req.url==='/api/sms/status')return reply(res,200,{configured,enabled:Boolean(state().enabled),lastSync:state().last_sync,pending:db.prepare("SELECT count(*) AS n FROM reminders WHERE status='pending'").get().n,accepted:db.prepare("SELECT count(*) AS n FROM reminders WHERE status='accepted'").get().n,failed:db.prepare("SELECT count(*) AS n FROM reminders WHERE status IN ('failed','sending')").get().n});
    if(req.method==='POST'&&req.url==='/api/sms/sync'){
      if(!configured)return reply(res,503,{error:'SMS provider and recipient are not configured on the server.'});
      const body=await read(req);if(body.consent!==true)return reply(res,400,{error:'SMS consent is required.'});
      const now=Date.now(),items=validateReminders(body.reminders,now);
      db.exec('BEGIN IMMEDIATE');
      try{
        db.prepare("UPDATE reminders SET status='cancelled' WHERE status='pending'").run();
        for(const item of items){
          const previous=db.prepare('SELECT status FROM reminders WHERE key=?').get(item.key);
          if(previous&&['accepted','failed','sending','skipped'].includes(previous.status))continue;
          const status=item.at>now?'pending':previous?'pending':'skipped';
          db.prepare('INSERT INTO reminders(key,id,title,at,status) VALUES(?,?,?,?,?) ON CONFLICT(key) DO UPDATE SET title=excluded.title,status=excluded.status').run(item.key,item.id,item.title,item.at,status);
        }
        db.prepare('UPDATE settings SET enabled=1,last_sync=? WHERE id=1').run(now);db.exec('COMMIT');
      }catch(error){db.exec('ROLLBACK');throw error}
      return reply(res,200,{ok:true,pending:db.prepare("SELECT count(*) AS n FROM reminders WHERE status='pending'").get().n});
    }
    if(req.method==='POST'&&req.url==='/api/sms/disable'){
      db.prepare('UPDATE settings SET enabled=0 WHERE id=1').run();db.prepare("UPDATE reminders SET status='cancelled' WHERE status='pending'").run();return reply(res,200,{ok:true});
    }
    reply(res,404,{error:'Not found'});
  }catch{reply(res,400,{error:'Unable to process this request. Check your reminder data.'})}
});
let busy=false;
async function tick(){
  if(busy||!configured||!state().enabled)return;busy=true;
  try{
    const now=Date.now();
    // Missed reminders older than an hour are skipped instead of flooding the recipient.
    db.prepare("UPDATE reminders SET status='skipped' WHERE status='pending' AND at<?").run(now-3600000);
    const due=db.prepare("SELECT * FROM reminders WHERE status='pending' AND at<=? ORDER BY at LIMIT 5").all(now);
    for(const task of due){
      if(!state().enabled)break;
      const claimed=db.prepare("UPDATE reminders SET status='sending' WHERE key=? AND status='pending'").run(task.key);if(!claimed.changes)continue;
      try{const sid=await sendTwilio(config,`PolyPlan reminder: ${task.title}. Open PolyPlan for details. Reply STOP to unsubscribe.`);db.prepare("UPDATE reminders SET status='accepted',provider_id=? WHERE key=?").run(sid,task.key)}
      catch{db.prepare("UPDATE reminders SET status='failed' WHERE key=?").run(task.key);console.error('SMS was not confirmed. Check the provider console; no automatic retry will occur.')}
    }
  }finally{busy=false}
}
const timer=setInterval(()=>tick().catch(()=>console.error('Reminder scheduler failed')),15000);
server.listen(port,'127.0.0.1',()=>console.log(`PolyPlan SMS server listening on port ${server.address().port}; provider ${configured?'configured':'not configured'}.`));
process.on('SIGTERM',()=>{clearInterval(timer);server.close(()=>{db.close();process.exit(0)})});
