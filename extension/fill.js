// Runs in the extension's isolated world only after an explicit user action.
(() => {
  const normalize = value => String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/([a-z])([A-Z])/g,'$1 $2').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
  const aliases = {
    firstName:['first name','given name','first'],lastName:['last name','family name','surname','last'],
    fullName:['full name','name'],email:['email','email address','e mail'],phone:['phone','phone number','telephone','mobile phone','mobile phone number'],
    address:['street address','address line 1','address line one','address'],city:['city'],state:['state','state province','province'],postalCode:['zip','zip code','postal code','zip postal code'],country:['country'],
    linkedin:['linkedin','linkedin profile','linkedin url','linkedin profile url'],github:['github','github url','github profile'],website:['website','portfolio','personal website','portfolio url'],
    school:['school','university','school name','college university','university name'],major:['major','field of study'],degree:['degree','degree type'],graduationMonth:['graduation month'],graduationYear:['graduation year','expected graduation year'],gpa:['gpa','cumulative gpa']
  };
  const auto={ 'given-name':'firstName','family-name':'lastName',name:'fullName',email:'email',tel:'phone','street-address':'address','address-line1':'address','address-level2':'city','address-level1':'state','postal-code':'postalCode','country-name':'country'};
  const protectedField=label=>/password|captcha|signature|attest|certify|agree|consent|race|ethnic|gender|veteran|disab|social security|ssn|date of birth/.test(label);
  let plan=[],aiFields=[],manualCount=0;
  function scan(profile,answers,resume){
    plan=[];aiFields=[];let manual=0;
    const fields=[...document.querySelectorAll('input,textarea,select')];
    for(const element of fields){
      if(!element.getClientRects().length||element.disabled||element.readOnly||['hidden','submit','button','reset','password','checkbox','radio','date'].includes(element.type))continue;
      const visibleLabels=[...(element.labels||[])].map(x=>x.innerText.replace(/\*/g,'').trim());
      const referenced=(element.getAttribute('aria-labelledby')||'').split(/\s+/).map(id=>document.getElementById(id)?.innerText||'').join(' ');
      const raw=[...visibleLabels,element.getAttribute('aria-label'),referenced,element.name,element.id].filter(Boolean);
      const labels=raw.map(normalize).map(s=>s.replace(/\b(required|optional)\b/g,'').trim());
      const label=visibleLabels[0]||element.getAttribute('aria-label')||referenced||element.name||element.id||'Unlabeled field';
      if(raw.some(s=>protectedField(normalize(s))))continue;
      if(element.type==='file'){
        if(element.files?.length)continue;
        if(!resume||!labels.some(s=>/\b(resume|cv)\b/.test(s))){manual++;continue}
        const accepted=(element.accept||'').toLowerCase().split(',').map(x=>x.trim()).filter(Boolean);
        if(accepted.length&&!accepted.some(s=>s===resume.type||s===('.'+resume.name.split('.').pop().toLowerCase())||s==='application/*')){manual++;continue}
        plan.push({element,label,value:resume.name,file:resume,kind:'profile',source:'Your selected résumé',reason:'Labeled résumé upload',selected:true});continue;
      }
      if(String(element.value||'').trim()&&(element.tagName!=='SELECT'||element.value!==''))continue;
      aiFields.push({id:`field:${aiFields.length}`,element,label,options:element.tagName==='SELECT'?[...element.options].filter(o=>!o.disabled&&o.value!=='').map(o=>o.textContent.trim()):[]});
      let key=Object.entries(aliases).find(([,names])=>labels.some(label=>names.includes(label)))?.[0];
      const autocomplete=(element.autocomplete||'').split(' ').at(-1);
      if(!key&&auto[autocomplete])key=auto[autocomplete];
      let explanation={kind:'profile',source:key?`My profile → ${key}`:'',reason:'Saved profile field'};
      let value=key==='fullName'?[profile.firstName,profile.lastName].filter(Boolean).join(' '):profile[key];
      if(!value){const result=globalThis.PolyPlanQuestionMatcher?.match(label,answers,profile);if(result){value=result.value;explanation={kind:result.kind,source:result.source,reason:result.reason}}}
      if(!value||globalThis.PolyPlanQuestionMatcher?.isInstruction(value)){manual++;continue}
      if(element.tagName==='SELECT'){
        const option=[...element.options].find(o=>!o.disabled&&(normalize(o.textContent)===normalize(value)||normalize(o.value)===normalize(value)));
        if(!option){manual++;continue}value=option.value;
      }
      if(element.maxLength>0&&value.length>element.maxLength){manual++;continue}
      if(element.type==='number'&&(!Number.isFinite(Number(value))||(element.min!==''&&Number(value)<Number(element.min))||(element.max!==''&&Number(value)>Number(element.max)))){manual++;continue}
      plan.push({element,label,value:String(value),...explanation,selected:explanation.kind!=='similar'});
    }
    manualCount=manual;return summary();
  }
  function summary(){return {matches:plan.map((p,index)=>({index,label:p.label,value:p.file?`Attach ${p.value}`:p.value,kind:p.kind,source:p.source,reason:p.reason,selected:p.selected,evidence:p.evidence})),manual:manualCount,embedded:document.querySelectorAll('iframe').length,aiCount:getAIQuestions().length}}
  function getAIQuestions(){return aiFields.filter(f=>!plan.some(p=>p.element===f.element&&['profile','exact','ai'].includes(p.kind))).slice(0,30).map(({id,label,options})=>({id,label,options}))}
  function addAI(suggestions){for(const suggestion of suggestions){const field=aiFields.find(f=>f.id===suggestion.fieldId);if(!field||typeof suggestion.value!=='string'||!field.element.isConnected||field.element.value)continue;let value=suggestion.value;
   if(field.element.tagName==='SELECT'){const option=[...field.element.options].find(o=>!o.disabled&&o.textContent.trim()===value);if(!option)continue;value=option.value}
   if(field.element.maxLength>0&&value.length>field.element.maxLength)continue;
   if(field.element.type==='number'&&(!Number.isFinite(Number(value))||(field.element.min!==''&&Number(value)<Number(field.element.min))||(field.element.max!==''&&Number(value)>Number(field.element.max))))continue;
   const entry={element:field.element,label:field.label,value,kind:'ai',source:suggestion.source,reason:'AI suggestion: '+suggestion.reason,evidence:suggestion.evidence,selected:false};const index=plan.findIndex(p=>p.element===field.element);if(index>=0)plan[index]=entry;else{plan.push(entry);manualCount=Math.max(0,manualCount-1)}
  }return summary()}
  function fill(indices){let filled=0,skipped=0;
    for(const index of indices){const item=plan[index];if(!item){skipped++;continue}const {element}=item;
      if(!element.isConnected||element.disabled||element.readOnly||!element.getClientRects().length||((element.type==='file'?element.files?.length:String(element.value||'').trim()))){skipped++;continue}
      try{
        if(item.file){const bytes=Uint8Array.from(atob(item.file.data),c=>c.charCodeAt(0));const transfer=new DataTransfer();transfer.items.add(new File([bytes],item.file.name,{type:item.file.type}));element.files=transfer.files}
        else{const prototype=element.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:element.tagName==='SELECT'?HTMLSelectElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(prototype,'value').set.call(element,item.value)}
        element.dispatchEvent(new Event('input',{bubbles:true}));element.dispatchEvent(new Event('change',{bubbles:true}));filled++;
      }catch{skipped++}
    }
    plan=[];return {filled,skipped};
  }
  globalThis.polyplanApplicationHelper={scan,fill,getAIQuestions,addAI};
})();
