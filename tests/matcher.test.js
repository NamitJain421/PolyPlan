import {test} from 'node:test';
import assert from 'node:assert/strict';
import '../extension/matcher.js';
const {match}=globalThis.PolyPlanQuestionMatcher;
const source=[{question:'how I heard about this company',answer:'LinkedIn'}];
test('recognizes common source-question paraphrases without generating an answer',()=>{
 for(const q of ['How Did You Hear About Us?','Where did you find this job?','How did you learn about this opportunity?','Application source','How did you discover the role?']){const result=match(q,source);assert.equal(result.value,'LinkedIn');assert.equal(result.kind,'similar');assert.equal(result.source,source[0].question)}
 assert.equal(match('How did you hear about us?',[]),null);
});
test('separates related but different intents and ambiguous answers',()=>{
 assert.equal(match('Who referred you?',source),null);
 assert.equal(match('How did you hear about us and who referred you?',[...source,{question:'Who referred you?',answer:'Someone'}]),null);
 assert.equal(match('Why are you interested in this company?',source),null);
 assert.equal(match('Why are you interested in this role?',[{question:'Why this company?',answer:'Company answer'}]),null);
 assert.equal(match('How did you hear about us?',[...source,{question:'Where did you find this job?',answer:'Referral'}]),null);
 assert.equal(match('How did you hear about your previous company?',source),null);
});
test('dates preserve start/end distinction and reject negation',()=>{
 const answers=[{question:'My earliest start date',answer:'June 15, 2027'}];
 assert.equal(match('When are you available to start?',answers).value,'June 15, 2027');
 assert.equal(match('What is your available end date?',answers),null);
 assert.equal(match('When can you not start?',answers),null);
});
test('authorization, sponsorship, and compensation need an exact saved question',()=>{
 const answers=[{question:'Do you need sponsorship?',answer:'Yes'},{question:'Are you authorized to work in the US?',answer:'Yes'}];
 assert.equal(match('Will you require visa sponsorship?',answers),null);
 assert.equal(match('Are you not authorized to work in the US?',answers),null);
 assert.equal(match('Do you need sponsorship?',answers).kind,'exact');
 assert.equal(match('Expected annual salary',[{question:'Expected hourly pay',answer:'30'}]),null);
});
test('known profile facts support longer labels and native-option value remains separately resolved',()=>{
 assert.equal(match('Which university do you attend?',[],{school:'Cal Poly'}).value,'Cal Poly');
 assert.equal(match('What is your major?',[],{major:'Computer Science'}).value,'Computer Science');
 assert.equal(match('Expected graduation year',[],{graduationYear:'2027'}).value,'2027');
 assert.equal(match('Expected graduation date',[],{graduationYear:'2027'}),null);
});
