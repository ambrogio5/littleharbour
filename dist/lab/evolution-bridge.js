
import {createEvolution,restoreEvolution,serializeEvolution,applyChoice,advanceSeason,currentEvent,resolveEvent,deriveWorldStyle} from './evolution.js';

const escapeHtml = s => String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
function worldOrnaments(model){
 const v=deriveWorldStyle(model);
 let art='<g pointer-events="none">';
 for(let i=0;i<Math.max(0,Math.min(16,v.oliveDensity-14));i++){
  const x=195+(i%6)*139,y=280+Math.floor(i/6)*122;
  art+='<g transform="translate('+x+' '+y+')"><ellipse cx="7" cy="13" rx="20" ry="7" fill="#213b2c" opacity=".25"/><path d="M0 11v-25" stroke="#6c5c45" stroke-width="5"/><circle cy="-29" r="20" fill="#647c55"/><circle cx="-9" cy="-32" r="13" fill="#94a078"/><circle cx="12" cy="-32" r="13" fill="#5c774e"/></g>';
 }
 for(let i=0;i<Math.min(7,v.marketStalls);i++){
  const x=1010+i%3*147,y=1140+Math.floor(i/3)*102;
  art+='<g transform="translate('+x+' '+y+')"><path d="M-23 7v22m47-22v23" stroke="#8f7351" stroke-width="5"/><path d="M-33 5L-22 -18H23L35 5Z" fill="'+(i%2?'#c27d54':'#e3b16f')+'" stroke="#f9ead1" stroke-width="3"/><path d="M-16 -14l-9 18m28-18L-5 4m26-18L11 4" stroke="#f5e5c9" stroke-width="6"/></g>';
 }
 for(let i=0;i<Math.min(7,v.lanterns);i++){
  const x=260+i%4*159,y=1430+Math.floor(i/4)*138;
  art+='<g transform="translate('+x+' '+y+')"><path d="M0 10v-37" stroke="#7b6049" stroke-width="5"/><path d="M-10 -24h20v19h-20Z" fill="#ecc98b" stroke="#755d49" stroke-width="3"/></g>';
 }
 for(let i=0;i<Math.min(4,v.tradeTraffic-1);i++){
  const x=1210+(i%2)*95,y=1970+i*125;
  art+='<g transform="translate('+x+' '+y+')"><path d="M-37 15Q0 35 37 15L28 27Q0 41 -28 27Z" fill="#8e6647" stroke="#efdbb5" stroke-width="3"/><path d="M0 -43v57" stroke="#705b43" stroke-width="5"/><path d="M0 -35L26 8H0Z" fill="#f1e3c7"/><path d="M-8 -31L-27 8H-8Z" fill="#e9d1a7"/></g>';
 }
 for(let i=0;i<Math.min(5,v.repairedFacades);i++){
  const x=375+(i%3)*144,y=1065+Math.floor(i/3)*165;
  art+='<g transform="translate('+x+' '+y+')"><path d="M-23 11L0 -7 23 11v25L0 51 -23 36Z" fill="none" stroke="#e8d7b2" stroke-width="6"/><path d="M-11 12h22m-22 13h22" stroke="#e8d7b2" stroke-width="3"/></g>';
 }
 return art+'</g>';
}
export function createLivingHarbour(slot){
 const key=slot+'-living-v1';
 const initial=()=>createEvolution(6187);
 let model=initial(),blocked=false,error='';
 try{
  const raw=localStorage.getItem(key);
  if(raw!==null)model=restoreEvolution(raw);
 }catch(e){blocked=true;error='Evolution data protected: '+(e.message||'Storage unavailable');}
 function save(){
  if(blocked)return false;
  try{localStorage.setItem(key,serializeEvolution(model));return true;}
  catch(e){blocked=true;error='Evolution data protected: '+(e.message||'Storage unavailable');return false;}
 }
 function render(){
  const el=document.getElementById('livingHarbourStatus');
  const v=deriveWorldStyle(model),event=currentEvent(model);
  if(el){
   const traits=Object.entries(model.axes).map(([k,n])=>'<div class="living-trait"><span>'+escapeHtml(k)+'</span><meter min="0" max="100" value="'+n+'"></meter><b>'+n+'</b></div>').join('');
   const options=event?'<div class="living-event"><strong>'+escapeHtml(event.title)+'</strong><p>'+escapeHtml(event.description)+'</p><div class="living-options">'+event.options.map(o=>'<button type="button" data-evolution-event="'+escapeHtml(o.id)+'">'+escapeHtml(o.label)+'</button>').join('')+'</div></div>':'';
   el.innerHTML='<details '+(event?'open':'')+'><summary><span>Living Harbour · '+escapeHtml(v.identity)+'</span><small>Season '+model.season+' · '+model.choiceCount+' decisions</small></summary>'+(blocked?'<p class="living-warning">'+escapeHtml(error)+' — data were not overwritten.</p>':'')+'<div class="living-traits">'+traits+'</div>'+options+'<p class="living-note">The town responds to actual trade, construction and civic decisions. Its evolution does not create goods or currency.</p></details>';
  }
  const layer=document.getElementById('livingWorldLayer');
  if(layer)layer.innerHTML=worldOrnaments(model);
 }
 function advanceIfNeeded(){
  if(!model.pendingEvent&&model.choiceCount>0&&model.choiceCount>=6*(model.season+1))model=advanceSeason(model);
 }
 function record(action){
  if(blocked)return false;
  model=applyChoice(model,action);
  advanceIfNeeded();save();render();return true;
 }
 function resolve(option){
  if(blocked||!model.pendingEvent)return false;
  model=resolveEvent(model,option);
  advanceIfNeeded();save();render();return true;
 }
 function reset(){
  if(blocked)return false;
  model=initial();save();render();return true;
 }
 return {record,resolve,reset,render,snapshot:()=>structuredClone(model),blocked:()=>blocked};
}
