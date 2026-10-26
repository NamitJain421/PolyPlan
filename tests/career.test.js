import {test} from 'node:test';
import assert from 'node:assert/strict';
import {emptyCareer,validateCareer,safeURL,jobSource,readJob} from '../src/career-data.js';
test('validates backups without accepting unsafe links, duplicate rows, or malformed answers',()=>{
 const data=emptyCareer();assert.equal(validateCareer(data),data);
 data.Applications.push({id:'a',company:'Example',role:'Intern',status:'Saved for later',url:'https://example.com/job'});assert.equal(validateCareer(data),data);
 for(const change of [v=>v.Applications.push({...v.Applications[0]}),v=>v.Applications[0].url='javascript:alert(1)',v=>v.Applications[0].status='Made up',v=>v.profile.email={},v=>v.answers.push({question:'',answer:'Something'})]){const copy=structuredClone(data);change(copy);assert.throws(()=>validateCareer(copy))}
 assert.equal(safeURL('javascript:alert(1)'),'');assert.equal(safeURL('https://user:password@example.com'),'');assert.equal(safeURL('https://example.com/'),'https://example.com/');
});
test('only builds metadata API destinations for supported boards',()=>{
 assert.equal(jobSource('https://job-boards.greenhouse.io/example/jobs/123').endpoint,'https://boards-api.greenhouse.io/v1/boards/example/jobs/123');
 assert.equal(jobSource('https://jobs.lever.co/example/uuid').endpoint,'https://api.lever.co/v0/postings/example/uuid');
 for(const link of ['https://job-boards.greenhouse.io.evil.com/a/jobs/123','http://127.0.0.1/private','javascript:foo','https://example.com/apply'])assert.throws(()=>jobSource(link));
});
test('normalizes listing metadata and reports unavailable jobs',async()=>{
 const original=global.fetch;try{global.fetch=async()=>({ok:true,json:async()=>({title:'Software Intern',company_name:'Example Co',location:{name:'Remote'}})});assert.deepEqual(await readJob('https://boards.greenhouse.io/example/jobs/123'),{company:'Example Co',role:'Software Intern',notes:'Remote'});global.fetch=async()=>({ok:false});await assert.rejects(readJob('https://jobs.lever.co/example/job'),/could not be read/)}finally{global.fetch=original}
});
