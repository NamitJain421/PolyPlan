import {test} from 'node:test';
import assert from 'node:assert/strict';
test('assistant extracts only supplied company, links and explicit ISO dates',async()=>{
 const {parseAssistant}=await import('../server/ai.js');
 const response=values=>async()=>({ok:true,json:async()=>({message:{content:JSON.stringify(values)}})});
 const result=await parseAssistant('Add Nvidia OA, due next Saturday', {provider:'ollama',model:'test'},response({company:'Nvidia',notes:'invented',url:'https://invented.test',deadline:'2027-01-15'}));
 assert.equal(result.company,'Nvidia');assert.equal(result.notes,'Add Nvidia OA, due next Saturday');assert.equal(result.deadline,'');assert.equal(result.url,'');
 const unknown=await parseAssistant('Add an assessment tomorrow',{provider:'ollama',model:'test'},response({company:'Google',notes:'',url:'',deadline:''}));assert.equal(unknown.company,'');
});
