import {ITEMS,RECIPES,goalCost,goalTitle,available,unlocked,recipeDuration,capacity,maxBatches,start} from './engine.js?v=0.20.1';

const itemName=item=>item==='coins'?'Coins':ITEMS[item]||item;
const queuedStock=s=>s.jobs.reduce((pool,j)=>{for(const [item,n]of Object.entries(RECIPES[j.key].output))pool[item]=(pool[item]||0)+n;return pool;},{});

// Planning never changes town state. Allocate all final requirements before any
// upstream input so, for example, cloth promised to a home cannot also feed sails.
function analyseProject(s,goal){
 const cost=goalCost(s,goal),empty={goal,title:'Unavailable project',valid:false,ready:false,requirements:[],recipes:[],blockers:[],bottlenecks:[],queueable:0};
 if(!cost)return {plan:empty,spendable:{}};
 const incoming=queuedStock(s),pool={},spendable={},requirements=[],recipes=[],recipeIndex=new Map(),blockers=[];
 for(const item of ['coins',...Object.keys(s.stock)]){spendable[item]=Math.max(0,available(s,item));pool[item]=spendable[item]+(incoming[item]||0);}
 const rootMissing=[];
 for(const [item,required]of Object.entries(cost)){
  const own=s.reservations?.[goal]?.[item]||0,stock=Math.max(0,available(s,item,goal)),held=Math.min(required,own),free=Math.min(required-held,spendable[item]||0),inFlight=Math.min(Math.max(0,required-held-free),incoming[item]||0);
  spendable[item]-=free;pool[item]-=free+inFlight;
  const missing=Math.max(0,required-held-free-inFlight);
  requirements.push({item,required,available:stock,incoming:inFlight,missing});rootMissing.push([item,missing]);
 }
 function need(item,amount,path=[]){
  if(amount<=0)return;const have=Math.min(amount,pool[item]||0);pool[item]=(pool[item]||0)-have;amount-=have;if(!amount)return;
  const candidates=Object.entries(RECIPES).filter(([,r])=>r.output[item]);
  if(!candidates.length){blockers.push({item,kind:'trade',missing:amount,message:`Trade for ${amount} ${itemName(item).toLowerCase()}.`});return;}
  const choices=candidates.filter(([key])=>unlocked(s,key));
  if(!choices.length){blockers.push({item,kind:'locked',missing:amount,message:`Open a workshop that produces ${itemName(item).toLowerCase()}.`});return;}
  // Prefer a recipe whose inputs are already present; otherwise keep catalog order.
  const [key,r]=choices.find(([,r])=>Object.entries(r.cost).every(([k,n])=>(pool[k]||0)>=n))||choices[0];
  if(path.includes(item)){blockers.push({item,kind:'cycle',missing:amount,message:`Resolve the production dependency for ${itemName(item).toLowerCase()}.`});return;}
  if(key==='field'&&s.ripe){blockers.push({item,kind:'harvest',missing:amount,message:'Harvest the ripe wheat field first.'});return;}
  const batches=Math.ceil(amount/r.output[item]);
  for(const [input,n]of Object.entries(r.cost))need(input,n*batches,[...path,item]);
  for(const [output,n]of Object.entries(r.output))pool[output]=(pool[output]||0)+n*batches;
  pool[item]-=amount;
  if(recipeIndex.has(key))recipeIndex.get(key).batches+=batches;
  else {const entry={key,station:r.station,batches,output:{...r.output},seconds:0,queueable:0};recipeIndex.set(key,entry);recipes.push(entry);}
 }
 // Root stock was already allocated above. Do not allocate it a second time.
 for(const [item,n]of rootMissing)need(item,n);
 const simulation={...spendable},slots={};
 for(const r of recipes){
  r.seconds=r.batches*recipeDuration(s,r.key);const d=RECIPES[r.key];
  slots[r.station]??=Math.max(0,capacity(s,r.station)-s.jobs.filter(j=>RECIPES[j.key].station===r.station).length);
  r.queueable=Math.max(0,Math.min(r.batches,slots[r.station],...Object.entries(d.cost).map(([k,n])=>Math.floor((simulation[k]||0)/n))));
  if(r.key==='field'&&s.ripe)r.queueable=0;
  slots[r.station]-=r.queueable;for(const [k,n]of Object.entries(d.cost))simulation[k]-=n*r.queueable;
 }
 const stations={};for(const r of recipes){stations[r.station]??={station:r.station,seconds:0,batches:0};stations[r.station].seconds+=r.seconds;stations[r.station].batches+=r.batches;}
 const plan={goal,title:goalTitle(s,goal),valid:true,ready:requirements.every(r=>r.available>=r.required),requirements,recipes,blockers,bottlenecks:Object.values(stations).sort((a,b)=>b.seconds-a.seconds),queueable:recipes.reduce((n,r)=>n+r.queueable,0)};
 return {plan,spendable};
}
export function projectPlan(s,goal){return analyseProject(s,goal).plan;}

// One pass only: finished inputs are usable now; promised output is never spent.
// Final goods remain physically untouched without silently reserving anything.
export function queueProject(s,goal){
 const {plan}=analyseProject(s,goal),batches=[];
 if(!plan.valid)return {queued:0,batches,reasons:['That project is no longer available.'],plan};
 for(const recipe of plan.recipes){let count=0;const limit=Math.min(recipe.queueable,maxBatches(s,recipe.key));for(let i=0;i<limit;i++){if(!start(s,recipe.key,true))break;count++;}if(count)batches.push({key:recipe.key,count});}
 const queued=batches.reduce((n,b)=>n+b.count,0),after=projectPlan(s,goal),reasons=after.blockers.map(b=>b.message);
 if(!queued&&!reasons.length&&!after.ready)reasons.push(after.recipes.length?'Wait for ingredients or free workshop queue space.':'The remaining supplies are already in production.');
 if(after.ready&&!queued)reasons.push('All project supplies are ready.');
 return {queued,batches,reasons,plan:after};
}
