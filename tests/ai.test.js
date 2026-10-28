import {test} from 'node:test';
import assert from 'node:assert/strict';
import {prepare,validateResult,matchWithAI,configuration} from '../server/ai.js';
const input={questions:[{id:'language',label:'What languages do you have?',options:[]},{id:'source',label:'How did you discover this opening?',options:['Instagram','Other']}],answers:[{question:'Languages',answer:'English. I am fluent and can speak, read, write, and listen.'},{question:'How I heard about the company',answer:'Always say LinkedIn. If that is not available, say Instagram. If that is not available, say Other.'}],profile:{}};
const suggestion=(overrides={})=>({fieldId:'language',sourceId:'answer:0',quote:'English',choice:'',reason:'Asks about spoken languages.',confidence:'high',...overrides});
test('model suggestions must cite saved text and valid supplied options',()=>{
 const prepared=prepare(input);
 const valid=validateResult({suggestions:[suggestion(),suggestion({fieldId:'source',sourceId:'answer:1',quote:'Instagram',choice:'Instagram',reason:'LinkedIn is absent; the saved fallback is Instagram.'})]},prepared);
 assert.equal(valid.length,2);assert.equal(valid[0].value,'English');assert.equal(valid[1].value,'Instagram');assert(valid.every(s=>s.selected===false));
 for(const bad of [suggestion({quote:'Spanish'}),suggestion({sourceId:'made-up'}),suggestion({confidence:'uncertain'}),suggestion({fieldId:'source',sourceId:'answer:1',quote:'Instagram',choice:'LinkedIn'}),suggestion({fieldId:'source',sourceId:'answer:1',quote:'Instagram',choice:'Other'}),suggestion({fieldId:'source',sourceId:'answer:1',quote:input.answers[1].answer,choice:'Instagram'})])assert.equal(validateResult({suggestions:[bad]},prepared).length,0);
});
test('model confidence cannot bypass exact-only eligibility checks or duplicate-source conflicts',()=>{
 const data=prepare({questions:[{id:'visa',label:'Will you need visa sponsorship?',options:[]}],answers:[{question:'Do you need sponsorship?',answer:'No'}],profile:{}});
 assert.equal(validateResult({suggestions:[suggestion({fieldId:'visa',quote:'No'})]},data).length,0);
 const conflict=structuredClone(input);conflict.answers.push({question:'Languages',answer:'Spanish'});assert.equal(validateResult({suggestions:[suggestion()]},prepare(conflict)).length,0);
});
test('Ollama adapter calls a real structured-output API shape without a key',async()=>{
 let captured;const mock=async(url,options)=>{captured={url,body:JSON.parse(options.body)};return {ok:true,json:async()=>({message:{content:JSON.stringify({suggestions:[suggestion()]})}})}};
 const result=await matchWithAI(input,{provider:'ollama',model:'qwen2.5:3b'},mock);assert.equal(captured.url,'http://127.0.0.1:11434/api/chat');assert.equal(captured.body.stream,false);assert.equal(captured.body.format.type,'object');assert.equal(result.suggestions[0].value,'English');
});
test('OpenAI adapter keeps the key server-side and handles invalid provider output',async()=>{
 let request;const mock=async(url,options)=>{request={url,options};return {ok:true,json:async()=>({choices:[{message:{content:JSON.stringify({suggestions:[suggestion()]})}}]})}};
 const result=await matchWithAI(input,{provider:'openai',model:'gpt-4.1-mini',key:'test-only-not-a-key'},mock);assert.equal(request.options.headers.Authorization,'Bearer test-only-not-a-key');assert.equal(result.suggestions[0].value,'English');assert(!JSON.stringify(result).includes('test-only-not-a-key'));
 await assert.rejects(matchWithAI(input,{provider:'openai',model:'gpt-4.1-mini',key:''},mock),/key is missing/);
 await assert.rejects(matchWithAI(input,{provider:'ollama',model:'test'},async()=>({ok:true,json:async()=>({message:{content:'not json'}})})),/invalid JSON/);
 assert.equal(configuration({}).provider,'ollama');
});

test('dropdown grounding preserves meaningful punctuation such as C++ versus C#',()=>{
 const data=prepare({questions:[{id:'language',label:'Which programming language?',options:['C++','C#']}],answers:[{question:'Programming languages',answer:'C++'}],profile:{}});
 assert.equal(validateResult({suggestions:[suggestion({quote:'C++',choice:'C#'})]},data).length,0);
 assert.equal(validateResult({suggestions:[suggestion({quote:'C++',choice:'C++'})]},data).length,1);
});
