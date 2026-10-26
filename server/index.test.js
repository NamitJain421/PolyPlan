import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

test('authenticated scheduler sync, cancellation, and restart persistence without sending messages',async()=>{
 const cwd=await mkdtemp(join(tmpdir(),'polyplan-api-')),token='test-only-connection-key-0000000000000000';
 let child;
 async function start(){
  child=spawn(process.execPath,[fileURLToPath(new URL('./index.js',import.meta.url))],{cwd,env:{PATH:process.env.PATH,PORT:'0',POLYPLAN_ACCESS_TOKEN:token,APP_ORIGIN:'http://localhost:5173',TWILIO_ACCOUNT_SID:'AC'+'0'.repeat(32),TWILIO_AUTH_TOKEN:'test-not-a-real-token',TWILIO_FROM_NUMBER:'+15555550100',SMS_TO_NUMBER:'+15555550101'},stdio:['ignore','pipe','pipe']});
  return await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(Error('Server startup timed out')),5000);child.once('error',reject);child.stdout.on('data',data=>{const match=data.toString().match(/port (\d+)/);if(match){clearTimeout(timeout);resolve(`http://127.0.0.1:${match[1]}`)}})});
 }
 async function stop(){await new Promise(resolve=>{child.once('exit',resolve);child.kill('SIGTERM')})}
 try{
  let base=await start();
  const request=(path,body,headers={})=>fetch(base+'/api/sms/'+path,{method:body?'POST':'GET',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json',...headers},body:body?JSON.stringify(body):undefined});
  assert.equal((await fetch(base+'/api/sms/status')).status,401);
  assert.equal((await request('status',undefined,{Origin:'https://evil.example'})).status,403);
  assert.equal((await request('sync',{consent:false,reminders:[]})).status,400);
  const item={id:'task1',title:'Future reminder',at:Date.now()+86400000};
  assert.equal((await request('sync',{consent:true,reminders:[item]})).status,200);
  await request('sync',{consent:true,reminders:[item]});
  let status=await (await request('status')).json();assert.equal(status.pending,1);assert.equal(status.enabled,true);
  await stop();base=await start();status=await (await request('status')).json();assert.equal(status.pending,1);
  await request('sync',{consent:true,reminders:[]});status=await (await request('status')).json();assert.equal(status.pending,0);
  await request('sync',{consent:true,reminders:[{...item,id:'past',at:Date.now()-1000}]});status=await (await request('status')).json();assert.equal(status.pending,0);assert.equal(status.accepted,0);
  await request('disable',{});status=await (await request('status')).json();assert.equal(status.enabled,false);
 }finally{if(child&&child.exitCode===null)await stop();await rm(cwd,{recursive:true,force:true})}
});
