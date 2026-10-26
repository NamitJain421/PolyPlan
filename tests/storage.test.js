import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createStore} from '../src/storage.js';
import {addSpreadsheetDefaults} from '../src/career-defaults.js';
import {emptyCareer} from '../src/career-data.js';
const memory=()=>{const map=new Map();return {getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)}};
test('a stale tab cannot undo completion or resurrect a deleted task when saving another task',()=>{
 const disk=memory(),defaults={tasks:[{id:'a',done:false,title:'A'},{id:'b',done:false,title:'B'}]};
 const first=createStore('tasks',defaults,v=>v,disk),second=createStore('tasks',defaults,v=>v,disk);
 const a=first.load(),b=second.load();a.tasks[0].done=true;first.save(a);b.tasks[1].title='Edited';second.save(b);
 assert.equal(first.load().tasks[0].done,true);const next=first.load();next.tasks=next.tasks.filter(t=>t.id!=='a');first.save(next);b.tasks[1].done=true;second.save(b);assert.equal(first.load().tasks.some(t=>t.id==='a'),false);
});
test('profile fields merge and explicit restores replace',()=>{
 const disk=memory(),defaults={profile:{firstName:'',email:''}},a=createStore('p',defaults,v=>v,disk),b=createStore('p',defaults,v=>v,disk);const x=a.load(),y=b.load();x.profile.firstName='Test';a.save(x);y.profile.email='test@example.com';b.save(y);assert.deepEqual(a.load().profile,{firstName:'Test',email:'test@example.com'});a.save(defaults,{replace:true});assert.deepEqual(b.load(),defaults);
});
test('unreadable existing data is preserved instead of overwritten with defaults',()=>{
 const disk=memory();disk.setItem('p','bad json');const store=createStore('p',{tasks:[]},v=>v,disk);store.load();assert.equal(store.status.error,true);assert.throws(()=>store.save({tasks:[]}));assert.equal(disk.getItem('p'),'bad json');
});
test('spreadsheet defaults apply once, preserve custom rows/profile, and do not return after deletion',()=>{
 const old=emptyCareer();old.profile.firstName='Me';old.Technical.push({id:'custom',company:'Google - BS/MS 2027',round:'Round 1',notes:'My edited note'});const seeded=addSpreadsheetDefaults(old);assert.equal(seeded.data.Technical.length,3);assert.equal(seeded.data.Behavioral.length,2);assert.equal(seeded.data.OA.length,5);assert.equal(seeded.data.Technical[0].notes,'My edited note');assert.equal(seeded.data.profile.firstName,'Me');seeded.data.OA=[];assert.equal(addSpreadsheetDefaults(seeded.data).changed,false);assert.equal(addSpreadsheetDefaults(seeded.data).data.OA.length,0);
});
