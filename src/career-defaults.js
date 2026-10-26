// Transcribed from the user's spreadsheet screenshots. Example/template rows are excluded.
export const spreadsheetRows={
 Technical:[
 {id:'excel-tech-google-1',company:'Google - BS/MS 2027',round:'Round 1',questions:'DP problem; similar to coin change',solution:'Check Interview Resources for picture',outcome:'Rejected',notes:'He was looking for recursion.'},
 {id:'excel-tech-google-2',company:'Google - BS/MS 2027',round:'Round 2',questions:'In-depth explanation of problem: Given a list of queues as input, find the length of the shortest queue. Using the pop function is very expensive, so I have to limit its use.',solution:'I checked each element in the queue, found the length, and then took the shortest queue length. I had to use pop multiple times. During the interview, I got confused because I could not get the length of a queue. The optimal approach I figured out in pseudocode: for queues such as [1,2,3] and [4,5,6,7], pop the first element in all queues and check whether any queue is empty. If it is empty, it is the shortest queue.',outcome:'Rejected',notes:'Asked about time complexity. The biggest thing in the second interview was how well you can optimize your code. The problem was much easier, but optimizing mattered.'},
 {id:'excel-tech-amazon-1',company:'Amazon JR SDE 2027',round:'Round 1',questions:'Given a string, return the non-repeating character that comes first in the string.',solution:'https://leetcode.com/discuss/post/125015/first-non-repeating-character-in-a-string-f2xw/',outcome:'Rejected First Round',notes:'Did this problem quickly in 10 minutes. Follow-up: what if there are uppercase and lowercase letters? My solution was to use lowercase. Second follow-up: return a capital letter. I created a new string with everything lowercase and used the index in the original word. Last follow-up was without using lower/uppercase. I did not get this; the answer was using ASCII values. Also asked for time and space complexity.'}
 ],
 Behavioral:[
 {id:'excel-behavior-amazon-1',company:'Amazon JR SDE 2027',round:'Round 1',questions:'Behavioral Amazon questions. Forgot the exact questions, but one was about AI and how I have used it to optimize my daily life.',solution:'Use all the resources provided by Didi. Check the email from Vidhi Jain regarding AI, Didi’s messages/picture about the Amazon rubric and what they ask, and the Amazon behavioral document.',outcome:'Rejected',notes:'For next time, really focus on behavioral and make sure not to stutter. Should have a clear response for everything.'},
 {id:'excel-behavior-ge-1',company:'GE Vernova',round:'Round 1',questions:'Questions about my résumé, projects, the overall project, my interest in GE, and my interest in my major.',solution:'None',outcome:'Waiting',notes:'Second interview is a 30-minute Teams meeting and is a technical interview. Questions can be about how I would use technology and actual technical questions. There will be no coding questions. Technical questions can be about my résumé, tools I have used, and tools I can use for the project I am doing.'}
 ],
 OA:[
 {id:'excel-oa-google',company:'Google - BS/MS 2027',notes:'Very easy problem. Not even LeetCode. Just an if/else solution.'},
 {id:'excel-oa-roblox',company:'Roblox',notes:'Hard games to solve. Must use problem solving. Original note: “Can AI everything cuz no proctor next time.”'},
 {id:'excel-oa-ramp',company:'RAMP',notes:'Insanely difficult. Opened it and then closed it.'},
 {id:'excel-oa-stripe',company:'Stripe',notes:'Insanely difficult. Opened it and then closed it.'},
 {id:'excel-oa-tiktok',company:'TikTok',notes:'Live proctoring. First 2 problems can be solved, but last 2 are very hard. Original note: “Must use AI next for last 2 carefully cuz AI proctoring.”'}
 ]
};
export function addSpreadsheetDefaults(data){
 if(data.spreadsheetDefaultsVersion===1)return {data,changed:false};
 const next=structuredClone(data);
 for(const tab of Object.keys(spreadsheetRows))for(const row of spreadsheetRows[tab]){
  if(!next[tab].some(existing=>existing.id===row.id||(String(existing.company||'').trim().toLowerCase()===row.company.toLowerCase()&&(existing.round||'')===(row.round||''))))next[tab].push({...row});
 }
 next.spreadsheetDefaultsVersion=1;return {data:next,changed:true};
}
