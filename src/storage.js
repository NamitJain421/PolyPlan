// Merge only this tab's changes into the most recently stored workspace.
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const object=v=>v&&typeof v==='object'&&!Array.isArray(v);
export function mergeChanges(base,next,latest){
 if(same(base,next))return structuredClone(latest);
 if(Array.isArray(base)&&Array.isArray(next)&&Array.isArray(latest)&&[...base,...next,...latest].every(x=>object(x)&&typeof x.id==='string')){
  const old=new Map(base.map(x=>[x.id,x])),incoming=new Map(next.map(x=>[x.id,x])),result=new Map(latest.map(x=>[x.id,structuredClone(x)]));
  for(const id of old.keys())if(!incoming.has(id))result.delete(id);
  for(const [id,row] of incoming){if(!old.has(id))result.set(id,structuredClone(row));else if(result.has(id))result.set(id,mergeChanges(old.get(id),row,result.get(id)));}
  return [...result.values()];
 }
 if(object(base)&&object(next)&&object(latest)){
  const result=structuredClone(latest);
  for(const key of Object.keys(base))if(!Object.hasOwn(next,key))delete result[key];
  for(const key of Object.keys(next))if(!same(base[key],next[key]))result[key]=Object.hasOwn(base,key)&&Object.hasOwn(latest,key)?mergeChanges(base[key],next[key],latest[key]):structuredClone(next[key]);
  return result;
 }
 return structuredClone(next);
}
export function createStore(key,defaults,validate=v=>v,storage=globalThis.localStorage){
 let baseline,blocked=false,status={message:'Saved on this browser',error:false};
 const read=()=>{const raw=storage.getItem(key);return raw===null?structuredClone(defaults):validate(JSON.parse(raw))};
 const notify=(message,error=false)=>{status={message,error};if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent('polyplan-save',{detail:{message,error}}))};
 const load=()=>{try{baseline=read();blocked=false;return structuredClone(baseline)}catch{blocked=true;notify('Saved data could not be read. Export/recover it before editing.',true);return structuredClone(defaults)}};
 return {
  load,
  get status(){return status;},
  save(next,{replace=false}={}){
   try{if(blocked)throw Error('Saved data is unreadable; it has been preserved.');const latest=read();const merged=validate(replace?structuredClone(next):mergeChanges(baseline,next,latest));storage.setItem(key,JSON.stringify(merged));baseline=structuredClone(merged);notify('Saved in this browser · '+new Date().toLocaleTimeString([],{hour:'numeric',minute:'2-digit'}));return structuredClone(merged)}
   catch(error){notify('Not saved — '+error.message,true);throw error}
  }
 };
}
