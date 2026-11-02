// Read-only next-step presentation. Every recommendation references the real action registry.
import * as E from '../dist/engine.js';
const categories={produce:'Production',trade:'Trade',build:'Build',contracts:'Contracts',waterfront:'Waterfront',market:'Market',inland:'Inland',fleet:'Fleet',neighbourhood:'Neighbourhood',residents:'Residents',ferry:'Ferry'};
export function nextStep(s,actions,o){
 if(o.complete)return {title:'Choose your next ambition',body:'Your harbour is established. Develop coastal partnerships, invest in local life or refine an automated workshop chain. Each direction uses your existing town and opens its own next steps.',category:'Ambitions',actionID:null,siteID:null,choices:[],waiting:false,requirements:[]};
 const find=(fn,test=()=>true)=>actions.filter(a=>a.fn===fn&&test(a.args));
 let targets=[],category=categories[o.target]||'Production',waiting=false,explanation=o.description;
 const pick=(fn,test)=>{targets=find(fn,test);};
 if(E.underConstruction(s,'pier')){category='Build';waiting=true;explanation='The crew is extending the quay. Your next choice opens when construction finishes. You can keep exploring while they work.';}else if(!s.pier){
  const g=E.openingGuide(s);
  if(g.action==='harvest-replant')pick('harvestReplant');
  else if(g.action==='batch'||g.action==='start')pick('start',a=>a[0]===g.key);
  else if(g.action==='dispatch')pick('dispatch');
  else if(g.action==='upgrade')pick('upgrade');
  else if(g.tab==='build')pick('build');
  else {category='Production';waiting=true;}
 }else if(o.chapter===2&&o.target!=='waterfront'){
  if(!s.specialisation)pick('specialise');
  else if(!s.specialists.includes(E.PATHS[s.specialisation].station)){
   const path=E.PATHS[s.specialisation];
   if(!s.businesses.includes(path.requires))pick('build',a=>a[0]===path.requires);else if(E.underConstruction(s,path.requires)){category='Build';waiting=true;}else pick('invest');
  }else if(E.underConstruction(s,E.PATHS[s.specialisation].station)||E.underConstruction(s,'charter'))waiting=true;
  else if(s.contractsDone.length>=2)pick('establishCharter');
  else if(s.contract)pick('dispatchContract');
  else pick('acceptContract',a=>!s.contractsDone.includes(a[0]));
 }else if(o.target==='waterfront'){
  if(s.waterfront.left)waiting=true;else pick(s.waterfront.funded?'supplyWaterfront':'fundWaterfront');
 }else if(o.chapter===3){
  if(!E.inlandEligible(s)){
   if(!s.market.access)pick('marketAccess');
   else if(s.market.left)waiting=true;
   else if(!Object.keys(s.market.businesses).length)pick('buildMarketBusiness');
   else pick('dispatchMarket',a=>s.market.businesses[a[0]]?.deliveries<3);
  }else{
   category='Inland';
   if(!s.inland.access)pick('inlandAccess');
   else if(s.inland.left)waiting=true;
   else if(!s.inland.terraces.some(Boolean))pick('buildTerrace');
   else if(!s.inland.terraces.some(t=>t&&!t.left))waiting=true;
   else if(!s.inland.kiln)pick('buildKiln');
   else if(s.inland.kiln.left)waiting=true;
   else if(!s.inland.shipments){if(s.selectedOrder!=='inland')pick('selectOrder',a=>E.orders(s).find(r=>r.id===a[0])?.cost.preserves);else pick('dispatch');}
   else pick('buildCourtyard');
  }
 }else if(o.chapter===4&&s.fleet.lighthouse.stage<3){
  if(!s.fleet.boats[0])pick('buyBoat',a=>a[0]===0);
  else if(s.fleet.lighthouse.left)waiting=true;
  else if((s.fleet.visits.quarry>0&&s.fleet.lighthouse.stage===0)||(s.fleet.visits.quarry>=3&&s.fleet.visits.island>=3))pick('buildLighthouseStage');
  else {const route=s.fleet.visits.quarry<3?'quarry':'island';pick('startVoyage',a=>!s.fleet.boats[a[0]]?.trip&&a[1]===route&&a[2]===1);if(!targets.length)waiting=true;}
 }else if(o.chapter===4){
  category='Neighbourhood';
  if(!s.neighbourhood.access)pick('openNeighbourhood');
  else{
   const has=t=>s.neighbourhood.plots.some(p=>p?.type===t);
   const missing=['carpenter','flaxgarden','weaver','home','sailmaker'].find(t=>!has(t));
   if(missing){if(s.neighbourhood.plots.some(p=>p&&!p.type))pick('buildNeighbourhood',a=>a[1]===missing);else pick('buyNeighbourhoodPlot');}
   else if(!s.neighbourhood.plots.some(p=>p?.type==='home'&&p.level))pick('upgradeNeighbourhoodHome');
   else if(!s.fleet.boats.some(b=>b?.sails)){pick('refitBoatSails',a=>!s.fleet.boats[a[0]]?.trip);if(!targets.length)waiting=true;}
   else if(!s.residents.proposal)pick('chooseResidentsProposal');
   else if(s.residents.delivered<3)pick('deliverResidentsSupplies');
   else waiting=true;
  }
 }else if(o.chapter===5){
  if(s.ferry.left)waiting=true;
  else if(s.ferry.stage<3)pick(s.ferry.funded?'deliverFerrySupplies':'fundFerryStage');
  else {pick('startFerryService',a=>!s.fleet.boats[a[0]]?.trip);if(!targets.length)waiting=true;}
 }
 // A choice stays a choice: no automatic spending, route selection or specialisation.
 if(targets.length>1){
  return {title:o.title,body:o.description,category:targets[0].category,actionID:null,choices:targets.map(a=>a.id),siteID:null,waiting:false,requirements:[]};
 }
 const target=targets[0];
 const requirements=Object.entries(target?.cost||{}).map(([item,required])=>({item,required,available:Math.max(0,E.available(s,item,target.goal))}));
 const siteFor=a=>a.fn==='harvestReplant'?'field':a.fn==='start'?({press:'olive',olives:'olive',saw:'boatyard',fittings:'boatyard',grapes:'estate',wine:'estate',clay:'claypit',jars:'kiln',tiles:'kiln',fruitPreserves:'kiln',vegetablePreserves:'kiln'}[a.args[0]]||a.args[0]):null;
 const result=(a,body)=>({title:a.title,body,category:a.category,actionID:a.id,choices:[a.id],siteID:siteFor(a),waiting:false,requirements});
 if(target?.enabled)return result(target,o.description);
 // Follow actual missing ingredients, counting reserved and incoming goods. No fake resource grants.
 const need=(item,amount,path=[])=>{
  if(path.includes(item)||E.available(s,item,target?.goal)+E.incoming(s,item)>=amount)return null;
  if(item==='wheat'&&s.ripe)return find('harvestReplant')[0];
  const recipes=Object.entries(E.RECIPES).filter(([key,r])=>r.output[item]&&E.unlocked(s,key));
  for(const [key]of recipes){const a=find('start',args=>args[0]===key)[0];if(a?.enabled)return a;}
  for(const [,r]of recipes)for(const [input,n]of Object.entries(r.cost)){const a=need(input,n,[...path,item]);if(a)return a;}
  return null;
 };
 if(target){
  for(const r of requirements){const a=need(r.item,r.required);if(a)return result(a,'To '+target.title.toLowerCase()+', prepare the missing supplies. '+o.description);}
  if(requirements.some(r=>['coins','wood','stone'].includes(r.item)&&r.available<r.required)){
   const dispatch=find('dispatch')[0];if(dispatch?.enabled)return result(dispatch,'Earn coins and building materials for '+target.title.toLowerCase()+'.');
   for(const [item,n]of Object.entries(dispatch?.cost||{})){const a=need(item,n);if(a)return result(a,'Prepare a shipment to earn the materials for '+target.title.toLowerCase()+'.');}
  }
  const pending=(item,amount,path=[])=>{
   if(path.includes(item)||E.available(s,item,target.goal)>=amount)return false;
   if(E.incoming(s,item)>0)return true;
   return Object.entries(E.RECIPES).some(([key,r])=>r.output[item]&&E.unlocked(s,key)&&Object.entries(r.cost).some(([input,n])=>pending(input,n,[...path,item])));
  };
  const cargo=find('dispatch')[0]?.cost||{};
  const waitingForCargo=requirements.some(r=>['coins','wood','stone'].includes(r.item)&&r.available<r.required)&&Object.entries(cargo).some(([item,n])=>pending(item,n));
  if(requirements.some(r=>pending(r.item,r.required))||waitingForCargo){
   return {title:'Wait for your workshops',body:s.speed===0?'Your town is paused. Resume time to finish the queued supplies.':'Supplies are already in production for '+target.title.toLowerCase()+'. Let the current batches finish; your next action will appear here.',category:'Production',actionID:null,choices:[],siteID:null,waiting:true,requirements};
  }
  return {...result(target,target.reason||o.description),waiting:false};
 }
 return {title:waiting?'Work is underway':o.title,body:s.speed===0?'Your town is paused. Resume time to continue production, building and voyages.':explanation,category,actionID:null,choices:[],siteID:null,waiting,requirements};
}
