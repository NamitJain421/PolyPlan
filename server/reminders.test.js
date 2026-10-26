import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateReminders,sendTwilio} from './reminders.js';
test('validates schedules and gives changed dates distinct deduplication keys',()=>{
 const first=validateReminders([{id:'a',title:' Lab ',at:2000}],1000)[0];
 assert.equal(first.title,'Lab');assert.equal(first.key,'a:2000');
 assert.notEqual(validateReminders([{id:'a',title:'Lab',at:3000}],1000)[0].key,first.key);
 for(const input of [null,[{id:'a',title:'',at:2000}],[{id:'a',title:'Lab',at:NaN}],[{id:'a',title:'Lab',at:2000},{id:'a',title:'Other',at:3000}]])assert.throws(()=>validateReminders(input,1000));
});
test('provider receives fixed server recipient and errors do not leak response details',async()=>{
 const original=global.fetch;
 try{
  let captured;global.fetch=async(url,options)=>{captured={url,options};return {ok:true,json:async()=>({sid:'SMtest'})}};
  const config={account:'ACtest',token:'private-token',from:'+15555550100',to:'+15555550101'};
  assert.equal(await sendTwilio(config,'Test reminder'),'SMtest');
  assert.equal(captured.options.body.get('To'),config.to);
  assert.equal(captured.options.body.get('Body'),'Test reminder');
  assert.equal(captured.options.headers.Authorization,`Basic ${Buffer.from('ACtest:private-token').toString('base64')}`);
  global.fetch=async()=>({ok:false,status:401});
  await assert.rejects(sendTwilio(config,'Test'),/rejected request \(401\)/);
  global.fetch=async()=>({ok:true,json:async()=>({})});
  await assert.rejects(sendTwilio(config,'Test'),/did not confirm/);
 }finally{global.fetch=original}
});
