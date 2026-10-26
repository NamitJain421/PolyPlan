export const careerKey = 'polyplan.career.v1';
export const statuses = ['Saved for later', 'Preparing', 'Applied', 'Interviewing', 'Offer', 'Rejected', 'Withdrawn'];
export const schemas = {
  Applications: [['company','Company'],['role','Role'],['url','Application link','url'],['status','Status','status'],['reason','Why later / next action'],['deadline','Deadline','date'],['appliedDate','Applied on','date'],['notes','Notes']],
  Technical: [['company','Company'],['round','Interview round'],['questions','Questions asked'],['solution','Links / solution'],['outcome','How far I made it'],['notes','Additional notes']],
  Behavioral: [['company','Company'],['round','Interview round'],['questions','Questions asked'],['solution','Links / resources'],['outcome','How far I made it'],['notes','Additional notes']],
  OA: [['company','Company'],['notes','Notes — what the OA was about'],['url','Link','url'],['deadline','Due date','date'],['status','Status','assessmentStatus']]
};
export const profileFields = [['firstName','First name'],['lastName','Last name'],['email','Email','email'],['phone','Phone','tel'],['address','Street address'],['city','City'],['state','State / province'],['postalCode','Postal code'],['country','Country'],['linkedin','LinkedIn URL','url'],['github','GitHub URL','url'],['website','Portfolio URL','url'],['school','School'],['major','Major'],['degree','Degree'],['graduationMonth','Graduation month'],['graduationYear','Graduation year'],['gpa','GPA (optional)']];
export function emptyCareer(){return {version:1,Applications:[],Technical:[],Behavioral:[],OA:[],profile:{},answers:[]}}
export function safeURL(value){try{const url=new URL(value);return ['http:','https:'].includes(url.protocol)&&!url.username&&!url.password?url.href:''}catch{return ''}}
export function validateCareer(value){
 if(!value||value.version!==1)throw Error('Unsupported backup');
 for(const [tab,columns] of Object.entries(schemas)){
  if(!Array.isArray(value[tab])||value[tab].length>10000)throw Error('Invalid table');
  const ids=new Set();
  for(const row of value[tab]){if(!row||typeof row.id!=='string'||!row.id||ids.has(row.id))throw Error('Invalid row');ids.add(row.id);for(const [field] of columns)if(row[field]!==undefined&&(typeof row[field]!=='string'||row[field].length>50000))throw Error('Invalid cell');if(row.url&&!safeURL(row.url))throw Error('Invalid URL');if(tab==='Applications'&&!statuses.includes(row.status))throw Error('Invalid status')}
 }
 if(!value.profile||typeof value.profile!=='object'||Array.isArray(value.profile))throw Error('Invalid profile');
 for(const [key] of profileFields)if(value.profile[key]!==undefined&&(typeof value.profile[key]!=='string'||value.profile[key].length>1000))throw Error('Invalid profile');
 if(!Array.isArray(value.answers)||value.answers.length>100||value.answers.some(a=>!a||typeof a.question!=='string'||typeof a.answer!=='string'||!a.question.trim()||a.question.length>1000||a.answer.length>10000))throw Error('Invalid answers');
 return value;
}
// Public job metadata only; no account access, arbitrary server fetch, or application submission.
export function jobSource(link){const url=new URL(link);if(!safeURL(link))throw Error('Use an HTTPS or HTTP link.');
 const parts=url.pathname.split('/').filter(Boolean);
 if(['boards.greenhouse.io','job-boards.greenhouse.io'].includes(url.hostname)&&parts.length>=3&&parts[1]==='jobs'&&/^\d+$/.test(parts[2]))return {provider:'greenhouse',company:parts[0],endpoint:`https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(parts[0])}/jobs/${parts[2]}`};
 if(url.hostname==='jobs.lever.co'&&parts.length>=2)return {provider:'lever',company:parts[0],endpoint:`https://api.lever.co/v0/postings/${encodeURIComponent(parts[0])}/${encodeURIComponent(parts[1])}`};
 throw Error('Automatic details currently support Greenhouse and Lever job links. You can save any other link and enter company and role below.');
}
export async function readJob(link){const source=jobSource(link);const response=await fetch(source.endpoint,{signal:AbortSignal.timeout(12000)});if(!response.ok)throw Error('This listing could not be read. Enter company and role manually.');const job=await response.json();return {company:source.provider==='greenhouse'?(job.company_name||source.company):source.company,role:source.provider==='greenhouse'?job.title:job.text,notes:source.provider==='greenhouse'?(job.location?.name||''):(job.categories?.location||'')};}
