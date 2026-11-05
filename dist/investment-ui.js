import {ADVANCED_STATIONS,RECIPES,unlocked,advancedRefitPlan,advancedRefitBlocker,recipeDuration,recipeOutput} from './engine.js?v=0.21.0';

export function advancedRefitView(s,station,{costs}){
 const owned=s.advancedRefits[station];
 return `<details class="refit-card"><summary>${ADVANCED_STATIONS[station]} · advanced profiles${owned?' · tier '+owned.tier+' '+owned.mode:''}</summary><p>Choose faster batches or more output. Existing workshop improvements stay installed. Finish queued work before changing profiles.</p>${[2,3].filter(t=>t>=(owned?.tier||2)).map(tier=>`<h4>Tier ${tier}</h4>${['speed','yield',...(owned?.tier===tier?['original']:[])].map(mode=>{
  const p=advancedRefitPlan(s,station,tier,mode),reason=advancedRefitBlocker(s,station,tier,mode),preview=structuredClone(s);preview.advancedRefits[station]={tier,mode,epoch:p.epoch};
  const result=Object.entries(RECIPES).filter(([key,r])=>r.station===station&&unlocked(s,key)).map(([key,r])=>`${r.name}: ${recipeDuration(preview,key)}s · next batch ${costs(recipeOutput(preview,key))}`).join('<br>');
  return `<section class="refit-choice"><h4>${mode==='original'?'Restore original setup':mode==='speed'?'Faster batches':'More output'}</h4><div class="cost">${costs(p.cost)||'No charge'}</div><button class="button" data-action="advanced-refit" data-key="${station}" data-tier="${tier}" data-mode="${mode}" data-epoch="${p.epoch}" ${reason?'disabled':''}>${mode==='original'?'Restore':'Install profile'}</button><p>${result}</p><p class="hint">${reason||'Inputs unchanged. Yield fractions carry into later batches; no output is lost.'}</p></section>`;
 }).join('')}`).join('')}</details>`;
}
