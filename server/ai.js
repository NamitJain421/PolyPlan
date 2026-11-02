export function configuration(env=process.env){const provider=env.POLYPLAN_AI_PROVIDER||'ollama';return {provider,model:env.POLYPLAN_AI_MODEL||(provider==='openai'?'gpt-4.1-mini':'qwen2.5:3b'),key:env.OPENAI_API_KEY||env.POLYPLAN_AI_KEY||''}}
export async function parseAssistant(message,config=configuration(),fetcher=fetch){
 if(typeof message!=='string'||!message.trim()||message.length>5000)throw Error('Invalid message');
 const format={type:'object',properties:{company:{type:'string'},notes:{type:'string'},url:{type:'string'},deadline:{type:'string'}},required:['company','notes','url','deadline'],additionalProperties:false};
 const messages=[{role:'system',content:'Extract an online assessment record from the user message. Return JSON. Only use facts explicitly given. Company must be an exact excerpt. Copy the user message into notes. URL must be copied exactly if present. Deadline must be copied only if the user explicitly wrote an ISO YYYY-MM-DD date; otherwise empty. Do not infer dates or company. If no company is given leave company empty.'},{role:'user',content:message}];
 let response;if(config.provider==='ollama')response=await fetcher('http://127.0.0.1:11434/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:config.model,messages,stream:false,format,options:{temperature:0}}),signal:AbortSignal.timeout(120000)});
 else if(config.provider==='openai'){if(!config.key)throw Error('OpenAI is selected but its API key is missing from the server .env file.');response=await fetcher('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${config.key}`},body:JSON.stringify({model:config.model,messages,temperature:0,response_format:{type:'json_schema',json_schema:{name:'assessment',strict:true,schema:format}}}),signal:AbortSignal.timeout(60000)})}else throw Error('Select ollama or openai as the AI provider.');
 if(!response.ok)throw Error(`AI provider returned HTTP ${response.status}. Check your model.`);
 const payload=await response.json();let result;try{result=JSON.parse(config.provider==='ollama'?payload.message?.content:payload.choices?.[0]?.message?.content)}catch{throw Error('The model returned invalid JSON.')}
 const company=typeof result.company==='string'&&result.company.trim()&&message.toLowerCase().includes(result.company.trim().toLowerCase())?result.company.trim():'';
 let url=typeof result.url==='string'&&message.includes(result.url)?result.url:'';try{if(url&&!['http:','https:'].includes(new URL(url).protocol))url=''}catch{url=''}
 const deadline=typeof result.deadline==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(result.deadline)&&message.includes(result.deadline)?result.deadline:'';
 return {company,notes:message,url,deadline,status:'Not started'};
}
export function aiPlugin(config=configuration()){
 let busy=false;
 return {name:'polyplan-ai',configureServer(server){server.middlewares.use('/api/ai',async(req,res,next)=>{
  const reply=(code,value)=>{res.statusCode=code;res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify(value))};
  const origin=req.headers.origin||'';
  if(!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress)||!['localhost:5173','127.0.0.1:5173'].includes(req.headers.host)||origin&&!['http://localhost:5173','http://127.0.0.1:5173'].includes(origin))return reply(403,{error:'AI access is restricted to the local PolyPlan app.'});
  if(req.url==='/status'&&req.method==='GET'){
   let ready=false;let message;
   if(config.provider==='ollama'){try{const r=await fetch('http://127.0.0.1:11434/api/tags',{signal:AbortSignal.timeout(2500)});const body=await r.json();ready=Boolean(r.ok&&body.models?.some(m=>m.name===config.model));message=ready?'Local model ready. Your information stays on this Mac.':`Install the model with: ollama pull ${config.model}`}catch{message='Ollama is not running. Install and open Ollama, then pull the model.'}}
   else{ready=Boolean(config.key);message=ready?'OpenAI key is configured. Requests send saved facts and question text to OpenAI; usage charges may apply.':'Set your OpenAI API key privately in .env, then restart PolyPlan.'}
   return reply(200,{provider:config.provider,model:config.model,ready,message});
  }
  if(req.url!=='/assistant'||req.method!=='POST')return reply(404,{error:'Not found'});
  if(!req.headers['content-type']?.startsWith('application/json'))return reply(415,{error:'Use JSON requests.'});
  if(busy)return reply(429,{error:'A model request is already running. Wait for it to finish.'});
  let acquired=false;try{let body='';for await(const chunk of req){body+=chunk;if(body.length>1500000)return reply(413,{error:'Matching request is too large.'})}const input=JSON.parse(body);if(input.consent!==true)return reply(400,{error:'Confirm AI processing before sending.'});if(busy)return reply(429,{error:'A model request is already running.'});busy=true;acquired=true;const result=await parseAssistant(input.message,config);reply(200,result)}
  catch(error){const known=/OpenAI is|AI provider|model returned|Select ollama|Invalid/.test(error.message);reply(503,{error:known?error.message:'AI is unavailable. Check the model status; no fields were filled.'})}finally{if(acquired)busy=false}
 })}};
}
