import {createServer,loadEnv} from 'vite';
import {aiPlugin,configuration} from '../server/ai.js';
import {execFileSync} from 'node:child_process';
import {realpathSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const root=realpathSync(fileURLToPath(new URL('..',import.meta.url)));
const address='http://localhost:5173';
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function inspect(){
 try{
  const response=await fetch('http://127.0.0.1:5173/',{signal:AbortSignal.timeout(1500)});
  const html=await response.text();
  if(!response.ok||!html.includes('/@vite/client')||!html.includes('<title>PolyPlan'))return {occupied:true,polyplan:false};
  let owner;
  try{const r=await fetch('http://127.0.0.1:5173/__polyplan_dev_status__',{signal:AbortSignal.timeout(1000)});if(r.headers.get('content-type')?.includes('application/json'))owner=await r.json()}catch{}
  return {occupied:true,polyplan:true,owner};
 }catch(error){return {occupied:error.cause?.code!=='ECONNREFUSED',polyplan:false}}
}
function legacyPid(){
 // macOS ships lsof. Check the live process cwd and command before stopping it.
 try{
  const ids=[...new Set(execFileSync('lsof',['-nP','-t','-iTCP:5173','-sTCP:LISTEN'],{encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim().split(/\s+/).filter(Boolean))];
  for(const id of ids){
   if(!/^\d+$/.test(id))continue;
   const cwd=execFileSync('lsof',['-a','-p',id,'-d','cwd','-Fn'],{encoding:'utf8',stdio:['ignore','pipe','ignore']}).split('\n').find(line=>line.startsWith('n'))?.slice(1);
   const command=execFileSync('ps',['-p',id,'-o','args='],{encoding:'utf8'});
   if(cwd&&realpathSync(cwd)===root&&/\bnode\b/.test(command)&&(/\bvite\b/.test(command)||command.includes('scripts/dev.js')))return Number(id);
  }
 }catch{}
}
function occupiedMessage(){console.error('\nPort 5173 belongs to a server this launcher could not safely identify.\nOpen http://localhost:5173 to see what is running. Stop that server in its original terminal with Control+C, then run npm run dev again.\nNo process was stopped and your browser data was not changed.\n')}
async function main(){
 let existing=await inspect();
 if(existing.occupied){
  if(!existing.polyplan){occupiedMessage();process.exitCode=1;return}
  if(!process.argv.includes('--restart')){console.log(`\nPolyPlan is already running. Open this link:\n\n  ${address}\n\nTo restart this project's server: npm run dev:restart\n`);return}
  const pid=existing.owner?.root===root&&Number.isInteger(existing.owner.pid)?existing.owner.pid:legacyPid();
  if(!pid||pid===process.pid){console.error(`\nPolyPlan is running at ${address}, but its process could not be verified as this checkout.\nUse that link, or stop the old server in its terminal with Control+C. No process was stopped.`);process.exitCode=1;return}
  process.kill(pid,'SIGTERM');
  for(let attempt=0;attempt<40;attempt++){await delay(100);existing=await inspect();if(!existing.occupied)break}
  if(existing.occupied){console.error('The old server has not released port 5173. Stop it in its terminal, then retry.');process.exitCode=1;return}
 }
 const server=await createServer({root,server:{host:'0.0.0.0',port:5173,strictPort:true},plugins:[aiPlugin(configuration({...loadEnv('development',root,''),...process.env})),{name:'polyplan-dev-status',configureServer(vite){vite.middlewares.use('/__polyplan_dev_status__',(req,res)=>{if(!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress)){res.statusCode=403;res.end();return}res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify({root,pid:process.pid}))})}}]});
 try{await server.listen()}catch(error){await server.close();if(error.message.includes('already in use')){const current=await inspect();if(current.polyplan){console.log(`PolyPlan is already running: ${address}`);return}occupiedMessage();process.exitCode=1;return}throw error}
 console.log(`\nPolyPlan is ready. Open:\n\n  ${address}\n\nKeep this terminal open. Press Control+C to stop.\n`);
 for(const signal of ['SIGINT','SIGTERM'])process.once(signal,async()=>{await server.close();process.exit(0)});
}
main().catch(error=>{console.error('Could not start PolyPlan:',error.message);process.exitCode=1});
