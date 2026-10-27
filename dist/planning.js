import {RECIPES,ITEMS,available,reserved,incoming,unlocked,capacity,setTarget} from './engine.js';

// Pure explanations use the same stock and queue rules as production.
export function productionStatus(s,key){
 const r=RECIPES[key];
 if(!r||!unlocked(s,key))return {code:'locked',text:'Build this workshop first.'};
 const jobs=s.jobs.filter(j=>RECIPES[j.key].station===r.station),item=Object.keys(r.output)[0],target=s.targets[key]||0;
 if(!s.speed)return {code:'paused',text:'Town paused. Select a speed to resume.'};
 if(key==='field'&&s.ripe)return {code:'harvest',text:target?(s.stock.wheat>=target?'Wheat is ripe. Farmhand waits until stock falls below target.':'Farmhand will collect the ripe crop.'):'Wheat is ripe. Harvest to free the field.'};
 if(jobs.length>=capacity(s,r.station))return {code:'queue',text:'Queue full. Waiting batches can be reordered or cancelled.'};
 if(target&&s.stock[item]+incoming(s,item)>=target)return {code:'target',text:`Target covered: ${target} ${ITEMS[item].toLowerCase()} in storage or production.`};
 const missing=Object.entries(r.cost).filter(([k,n])=>available(s,k)<n);
 if(missing.length)return {code:'shortage',text:missing.map(([k,n])=>`${n-available(s,k)} more ${ITEMS[k].toLowerCase()} needed${reserved(s,k)?` (${reserved(s,k)} reserved for orders)`:''}${incoming(s,k)?` · ${incoming(s,k)} in production`:''}`).join('; '),item:missing[0][0]};
 if(jobs.length)return {code:'working',text:`${jobs.length} batch${jobs.length===1?'':'es'} working or queued. ${target?'Automatic target enabled.':'More can be queued.'}`};
 return {code:'ready',text:target?`Ready to maintain ${target} ${ITEMS[item].toLowerCase()}.`:'Ready. Start a batch or set a stock target.'};
}
export function captureTargets(s){return Object.fromEntries(Object.keys(RECIPES).filter(k=>unlocked(s,k)).map(k=>[k,s.targets[k]||0]));}
export function parseTargetPresets(raw){
 try{const x=JSON.parse(raw);if(!Array.isArray(x)||x.length!==3)return [null,null,null];return x.map(p=>{if(p===null)return null;if(!p||typeof p!=='object'||Array.isArray(p)||Object.entries(p).some(([k,v])=>!Object.hasOwn(RECIPES,k)||![0,6,12].includes(v)))return null;return {...p};});}catch{return [null,null,null];}
}
export function applyTargetPreset(s,preset){
 if(!s.pier||!preset||typeof preset!=='object'||Array.isArray(preset)||Object.entries(preset).some(([k,v])=>!Object.hasOwn(RECIPES,k)||![0,6,12].includes(v)))return false;
 // Replaces targets on currently unlocked workshops; never cancels paid batches.
 for(const key of Object.keys(RECIPES))if(unlocked(s,key)&&(s.targets[key]||0)!==(preset[key]||0))setTarget(s,key,preset[key]||0);
 return true;
}
