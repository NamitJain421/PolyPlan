// Local intent matching. No external service, generated answers, or semantic guesses for eligibility.
(() => {
 const normalize=value=>String(value||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/([a-z])([A-Z])/g,'$1 $2').toLowerCase().replace(/[^a-z0-9]+/g,' ').replace(/\b(required|optional)\b/g,' ').replace(/\s+/g,' ').trim();
 const exactOnly=/\b(sponsor|sponsorship|visa|citizen|citizenship|authoriz\w*|permit|eligible|eligibility|legally|legal|criminal|convict\w*|felon\w*|salary|compensation|pay|wage|age|over 18|under 18|relocat\w*|remote|hybrid|disab\w*|veteran|gender|race|ethnic\w*|consent|agree|certif\w*|attest\w*|signature)\b/;
 const rules=[
  ['referrer','Referrer’s name',q=>/\b(who|name|person|employee)\b/.test(q)&&/\b(referr\w*|recommend\w*)\b/.test(q)],
  ['source','How you found the opportunity',q=>! /\b(who|name|person|employee)\b/.test(q)&&(/\b(hear|heard|learn|learned|find|found|discover|discovered)\b/.test(q)&&/\b(us|company|organization|opportunity|position|role|job|opening|internship)\b/.test(q)||/\b(application source|source of (your |this |the )?application|job source)\b/.test(q))],
  ['whyCompany','Why this company',q=>/\b(why|interest\w*|motivat\w*|attract\w*)\b/.test(q)&&/\b(company|organization|employer|us)\b/.test(q)&&! /\b(role|position|job|qualified|fit|skills)\b/.test(q)],
  ['whyRole','Why this role',q=>/\b(why|interest\w*|motivat\w*|attract\w*)\b/.test(q)&&/\b(role|position|job|internship)\b/.test(q)&&! /\b(company|organization|employer|qualified|fit|skills)\b/.test(q)],
  ['startDate','Available start date',q=>/\b(start|begin|starting|commence|earliest)\b/.test(q)&&/\b(date|when|available|availability|begin|start)\b/.test(q)&&! /\b(end|finish|hours|duration|week)\b/.test(q)],
  ['endDate','Available end date',q=>/\b(end|finish|ending)\b/.test(q)&&/\b(date|when|available|availability)\b/.test(q)&&! /\b(start|begin|hours|duration)\b/.test(q)],
  ['introduction','About you',q=>/^(tell (us|me) (a (little|bit) )?about yourself|about me|about yourself|introduce yourself|personal introduction|briefly introduce yourself)$/.test(q)],
  ['languages','Programming languages',q=>/\b(programming|coding) languages\b/.test(q)&&! /\b(years|year|experience|project|favorite|favourite|why|best|preferred|expert)\b/.test(q)],
  ['school','School',q=>/^(what |which |your |name of (the |your )?)?(school|university|college)( name| do you attend| are you attending| you attend| currently attending)?$/.test(q)],
  ['major','Major / field of study',q=>/^(what is |what s |name of )?(your )?(major|field of study|area of study|course of study)( is| at (university|college))?$/.test(q)||q==='what are you studying'],
  ['degree','Degree',q=>/^(what |which |your )?(degree|degree type)( are you pursuing| are you working toward| you are pursuing| being pursued)?$/.test(q)],
  ['graduationYear','Graduation year',q=>/\b(graduat\w*)\b/.test(q)&&/\byear\b/.test(q)&&! /\b(month|date)\b/.test(q)],
  ['graduationMonth','Graduation month',q=>/\b(graduat\w*)\b/.test(q)&&/\bmonth\b/.test(q)&&! /\b(year|date)\b/.test(q)],
  ['linkedin','LinkedIn profile',q=>/\blinked ?in\b/.test(q)&&! /\b(hear|heard|found|find|source|why|experience)\b/.test(q)],
  ['github','GitHub profile',q=>/\bgithub\b/.test(q)&&! /\b(experience|project|describe|why|familiar)\b/.test(q)],
  ['website','Portfolio website',q=>/\b(portfolio|personal website)\b/.test(q)&&! /\b(describe|project|why|experience)\b/.test(q)],
  ['email','Email address',q=>/^(what is |your |please (enter|provide) (your )?)?(e mail|email)( address)?$/.test(q)],
  ['phone','Phone number',q=>/^(what is |your |please (enter|provide) (your )?)?(phone|telephone|mobile|contact)( phone)?( number)?$/.test(q)]
 ];
 function intent(question){const q=normalize(question);if(!q||exactOnly.test(q)||/\b(not|never|cannot|unable|unavailable|previous|former|last|other|and)\b|\b(can t|if so|if yes|if applicable)\b/.test(q)||q.length>260)return null;const found=rules.filter(([, ,test])=>test(q));return found.length===1?{id:found[0][0],label:found[0][1]}:null}
 function match(question,answers=[],profile={}){
  const q=normalize(question);if(!q)return null;
  const saved=answers.filter(a=>a&&typeof a.question==='string'&&typeof a.answer==='string'&&a.answer.trim());
  const exact=saved.filter(a=>normalize(a.question)===q);
  if(exact.length){if(new Set(exact.map(a=>a.answer.trim())).size!==1)return null;return {value:exact[0].answer,source:exact[0].question,reason:'Exact saved question',kind:'exact'}}
  const target=intent(question);if(!target)return null;
  const candidates=saved.filter(a=>intent(a.question)?.id===target.id);
  if(candidates.length){if(new Set(candidates.map(a=>a.answer.trim())).size!==1)return null;return {value:candidates[0].answer,source:candidates[0].question,reason:`Similar meaning: ${target.label}`,kind:'similar'}}
  const fact=profile[target.id];if(typeof fact==='string'&&fact.trim())return {value:fact,source:`My profile → ${target.label}`,reason:`Recognized field: ${target.label}`,kind:'similar'};
  return null;
 }
 globalThis.PolyPlanQuestionMatcher={normalize,intent,match};
})();
