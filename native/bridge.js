// Native presentation adapter. All economic mutations go through the shipped engine.
import * as E from '../dist/engine.js';
import * as V from '../dist/lab/evolution.js';
import {worldEntities} from '../dist/world-model.js';
import {currentObjective} from '../dist/progression.js';
import {projectPlan,queueProject} from '../dist/project-planning.js';
import {sampleTown} from '../dist/demo-town.js';
import {nextStep} from './guidance.js';
import {directions} from './directions.js';
import * as F from './festival.js';
import * as S from './story.js';
let town=E.fresh(), evolution=V.createEvolution(), stockTargets={}, festival=F.freshFestival();
const clone=x=>JSON.parse(JSON.stringify(x));
const costText=c=>Object.entries(c||{}).map(([k,n])=>`${n} ${E.ITEMS[k]||k}`).join(' · ');
const effects={dispatch:'ship-cargo',dispatchContract:'ship-cargo',dispatchMarket:'ship-cargo',upgrade:'expand-quay',fundFerryStage:'expand-quay',buildNeighbourhood:'fund-festival',deliverResidentsSupplies:'fund-festival',openNeighbourhood:'fund-festival',fundWaterfront:'repair-waterfront',supplyWaterfront:'repair-waterfront',upgradeWorkshops:'train-artisans',invest:'train-artisans',buildMarketBusiness:'train-artisans',buildKiln:'train-artisans',buildTerrace:'restore-grove',inlandAccess:'restore-grove'};
function mutate(s,fn,args){
 // Native's larger target still uses the original unlock checks and automation worker.
 // The canonical town remains loadable by the deployed browser (maximum target 12).
 if(fn==='setTarget'&&args[1]===24){if(!E.setTarget(s,args[0],12))return false;s.log[0]=E.RECIPES[args[0]].name+' · maintain 24 in stock';return true;}
 if(fn==='queueProject')return queueProject(s,...args).queued>0;if(fn==='speed'){if(![0,1,3].includes(args[0]))return false;s.speed=args[0];return true;}return E[fn](s,...args);}
function registry(s,f=festival){
 const out=[];
 function add(category,title,fn,args=[],cost=null,reason='',goal=null,destructive=false){
  let enabled=false;try{const copy=clone(s),before=JSON.stringify(copy);enabled=!!mutate(copy,fn,args)&&JSON.stringify(copy)!==before;}catch{}
  out.push({id:JSON.stringify([fn,args]),category,title,fn,args,partner:S.partner(fn,args),detail:costText(cost),enabled,reason:enabled?'':typeof reason==='string'&&reason?reason:'Gather the required supplies, finish earlier work, or free a queue slot.',goal,destructive,cost:cost||{}});
 }
 add('Production','Harvest & replant','harvestReplant',[],null,'Wait for the wheat to ripen.');
 for(const [key,r]of Object.entries(E.RECIPES))if(E.unlocked(s,key)){
  add('Production',r.name,'start',[key],r.cost,`Needs ingredients and a free ${r.station} queue slot. A ripe crop must be harvested.`,null);
  out[out.length-1].detail=`${E.recipeDuration(s,key)}s · makes ${costText(r.output)}${Object.keys(r.cost).length?' · needs '+costText(r.cost):' · no ingredients'}`;
  if(s.pier)for(const n of [0,6,12,24])add('Automation',`${r.name} · ${n?'maintain '+n:'stop target'}`,'setTarget',[key,n]);
 }
 s.jobs.forEach((j,i)=>{if(E.canCancel(s,i)){add('Queues','Cancel '+E.RECIPES[j.key].name,'cancel',[i],null,'Only waiting batches can be cancelled.');add('Queues','Make next: '+E.RECIPES[j.key].name,'prioritize',[i]);}});
 for(const o of E.orders(s)){
  add('Trade','Select '+o.name,'selectOrder',[o.id],o.cost,o.locked?o.description:'This route is already selected.');
  if(o.id===s.selectedOrder){const actual=E.order(s);add('Trade',o.locked?'Open coastal trade':`Ship to ${o.name} · earn ${actual.coins} coins, ${actual.wood} timber, ${actual.stone} stone`,'dispatch',[],actual.cost,o.locked?o.description:'Prepare the cargo or release other reservations.','trade:'+o.id);}
 }
 for(const b of ['fishing','olive'])if(!s.businesses.includes(b))add('Build',b==='olive'?'Build olive workshop':'Build fishing jetty','build',[b],E.buildCost(s),'Make your first delivery. A second business needs the quay.');
 if(!s.pier)add('Build','Extend the working quay','upgrade',[],E.PIER_COST,'Make two deliveries and build your first business.');
 if(!s.workshopUpgrade)add('Build','Organise the storehouse','upgradeWorkshops',[],E.WORKSHOP_COST,'Extend the quay first.');
 if(s.pier){
  for(const [id,p]of Object.entries(E.PATHS))add('Build',p.name,'specialise',[id],null,E.pathBlocker(s,id));
  const path=E.PATHS[s.specialisation];if(path&&!s.specialists.includes(path.station))add('Build','Build '+path.building,'invest',[],path.cost,'Complete the required livelihood and collect building supplies.');
  for(const [id,p]of Object.entries(E.TOWN_FOCUSES))add('Build',p.name+' · '+p.benefit,'setTownFocus',[id],s.townFocus?{coins:100}:null,E.townFocusBlocker(s,id),null,!!s.townFocus);
  for(const [station,r]of Object.entries(E.REFITS))if(station!=='fishing'||s.businesses.includes(station))for(const mode of ['speed','queue'])add('Refits',r.name+' · '+r[mode].name,'installRefit',[station,mode],r[mode].cost,E.refitBlocker(s,station,mode),null,!!s.refits[station]);
  if(!s.charter)add('Contracts','Establish harbour charter','establishCharter',[],E.CHARTER_COST,'Complete two different contracts.');
 }
 if(s.contract){const c=E.CONTRACTS[s.contract.id];add('Contracts',`Deliver ${c.name} · ${s.contract.shipped+1}/${c.shipments}`,'dispatchContract',[],c.cost,'Prepare the contracted cargo.','contract:'+s.contract.id);add('Contracts','Release current contract','abandonContract',[],null,'',null,true);}
 else for(const c of E.availableContracts(s))add('Contracts',`Accept ${c.name} · ${c.shipments} shipments · ${c.bonus} bonus coins`,'acceptContract',[c.id],c.cost,'Complete the specialist workshop.');
 if(s.waterfront.stage<3){const w=s.waterfront,stage=E.WATERFRONT_STAGES[w.stage];
  if(!w.funded)add('Waterfront','Fund '+stage.name,'fundWaterfront',[w.stage],stage.cost,E.waterfrontBlocker(s),null);
  else if(!w.left)add('Waterfront',`Supply ${stage.name} · ${w.delivered+1}/2`,'supplyWaterfront',[w.stage,w.delivered],E.waterfrontSupplies(s),'Prepare the stage supplies.','waterfront:'+w.stage+':'+w.delivered);
 }
 if(!s.market.access)add('Market','Open market quarter','marketAccess',[],E.MARKET_ACCESS_COST,E.marketAccessBlocker(s));
 else for(const [id,b]of Object.entries(E.MARKET_BUSINESSES)){
  if(!s.market.businesses[id])add('Market','Build '+b.name,'buildMarketBusiness',[id,b.plot],b.cost,E.marketBlocker(s,id,b.plot));
  else{const o=E.marketOrder(s,id);add('Market','Supply '+b.name,'dispatchMarket',[id],o?.cost,'Wait for construction, demand and supplies.','market:'+id);add('Market',`${s.market.businesses[id].auto?'Stop':'Enable'} automatic supply · ${b.name}`,'setMarketAuto',[id,!s.market.businesses[id].auto]);}
 }
 if(!s.inland.access)add('Inland','Open inland terraces','inlandAccess',[],E.INLAND_ACCESS_COST,E.inlandAccessBlocker(s));
 else{
  for(let i=0;i<2;i++)if(!s.inland.terraces[i])for(const [id,t]of Object.entries(E.TERRACE_TYPES))add('Inland',`Plant ${t.name} · terrace ${i+1}`,'buildTerrace',[i,id],t.cost,E.terraceBlocker(s,i,id));
  if(!s.inland.kiln)add('Inland','Build kiln & preserving room','buildKiln',[],E.KILN_COST,E.kilnBlocker(s));
  if(!s.inland.courtyard)add('Inland','Tile market courtyard','buildCourtyard',[],E.COURTYARD_COST,E.courtyardBlocker(s));
 }
 for(let slot=0;slot<2;slot++){
  const b=s.fleet.boats[slot];
  if(!b){for(const[id,d]of Object.entries(E.FLEET_BOATS))add('Fleet',`Buy ${d.name} · berth ${slot+1}`,'buyBoat',[slot,id],d.cost,E.boatBlocker(s,slot,id));continue;}
  if(b.trip)add('Fleet',`Recall berth ${slot+1} · refund cargo`,'cancelVoyage',[slot],null,'',null,true);
  for(const[route,r]of Object.entries(E.FLEET_ROUTES))for(let tier=1;tier<=3;tier++){
   const p=E.voyagePlan(s,slot,route,tier);add('Fleet',`Berth ${slot+1}: ${r.tiers[tier-1].name} · ${p.duration}s · ${costText(p.reward)}`,'startVoyage',[slot,route,tier],p.cost,E.voyageBlocker(s,slot,route,tier),p.goal);
   if(s.fleet.visits[route]>=3)add('Fleet',`Repeat ${r.name} tier ${tier} · berth ${slot+1}`,'setRepeatVoyage',[slot,route,tier],null,E.repeatVoyageBlocker(s,slot,route,tier));
  }
  if(b.repeat)add('Fleet','Stop repeat · berth '+(slot+1),'setRepeatVoyage',[slot,null]);
  for(let q=1;q<=3;q++)for(let i=1;i<=3;i++){const stops=[{route:'quarry',tier:q},{route:'island',tier:i}],p=E.circuitPlan(s,slot,stops);if(p)add('Circuits',`Berth ${slot+1}: quarry ${q} → island ${i} · ${p.duration}s`,'startCircuit',[slot,stops],p.cost,E.circuitBlocker(s,slot,stops),p.goal);}
  for(const[mode,d]of Object.entries(E.FLEET_UPGRADES))add('Fleet',`Berth ${slot+1}: ${d.name}`,'installBoatUpgrade',[slot,mode],d.cost,E.boatUpgradeBlocker(s,slot,mode),null,!!b.upgrade);
  add('Fleet','Fit new sails · berth '+(slot+1),'refitBoatSails',[slot],E.SAIL_REFIT_COST,E.sailRefitBlocker(s,slot),'neighbourhood:sails:'+slot);
  if(E.ferryEligible(s)&&s.ferry.stage===3)for(const dest of Object.keys(E.FERRY_SERVICES)){const p=E.ferryPlan(s,slot,dest);add('Ferry',`Berth ${slot+1}: ${p.name} · ${p.duration}s · ${costText(p.reward)}`,'startFerryService',[slot,dest],p.cost,E.ferryServiceBlocker(s,slot,dest),p.goal);}
 }
 if(s.fleet.lighthouse.stage<3){const stage=s.fleet.lighthouse.stage,d=E.LIGHTHOUSE_STAGES[stage];add('Lighthouse',d.name,'buildLighthouseStage',[stage],d.cost,E.lighthouseBlocker(s),'lighthouse:'+stage);}
 for(const route of Object.keys(E.FLEET_ROUTES)){
  const stage=s.fleet.development[route],d=E.COASTAL_PROJECTS[route][stage];
  if(d)add('Destinations',d.name,'fundCoastalProject',[route,stage],d.cost,E.coastalProjectBlocker(s,route),'coastal:'+route+':'+stage);
  else{const p=E.commissionPlan(s,route);if(p)add('Destinations',p.name,'completeCommission',[route,s.fleet.commissions[route]],p.cost,E.commissionBlocker(s,route),p.goal);}
 }
 if(!s.neighbourhood.access)add('Neighbourhood','Open the neighbourhood','openNeighbourhood',[],E.NEIGHBOURHOOD_ACCESS_COST,E.neighbourhoodAccessBlocker(s),'neighbourhood:access');
 else{
  for(let i=0;i<6;i++){const p=s.neighbourhood.plots[i];
   if(!p)add('Neighbourhood',`Buy plot ${i+1}`,'buyNeighbourhoodPlot',[i],E.PLOT_COST,E.plotBlocker(s,i),'neighbourhood:plot:'+i);
   else if(!p.type)for(const[id,d]of Object.entries(E.NEIGHBOURHOOD_BUILDINGS))add('Neighbourhood',`Plot ${i+1}: ${d.name} · ${d.description}`,'buildNeighbourhood',[i,id],d.cost,E.neighbourhoodBuildBlocker(s,i,id),`neighbourhood:build:${i}:${id}`);
   else{
    if(p.type==='home'&&!p.level)add('Neighbourhood',`Furnish home · plot ${i+1}`,'upgradeNeighbourhoodHome',[i],E.HOME_UPGRADE_COST,E.homeUpgradeBlocker(s,i),'neighbourhood:home:'+i);
    for(let to=0;to<6;to++)if(to!==i&&s.neighbourhood.plots[to])add('Town layout',`Move / swap plot ${i+1} → ${to+1}`,'moveNeighbourhoodBuilding',[i,to],null,E.neighbourhoodMoveBlocker(s,i,to));
    add('Town layout',`Redevelop plot ${i+1} · half coin refund, materials lost`,'removeNeighbourhoodBuilding',[i],null,E.neighbourhoodRemoveBlocker(s,i),null,true);
   }
  }
  const o=E.neighbourhoodOrder(s);add('Neighbourhood',o.name,'completeNeighbourhoodOrder',[s.neighbourhood.orders],o.cost,E.neighbourhoodOrderBlocker(s),'neighbourhood:order:'+s.neighbourhood.orders);
  for(const[id,p]of Object.entries(E.RESIDENT_PROPOSALS))add('Residents',p.name+' · '+p.benefit,'chooseResidentsProposal',[id],null,'Open the neighbourhood. The first delivery commits your choice.');
  const r=s.residents;if(r.proposal&&r.delivered<3){const d=E.RESIDENT_PROPOSALS[r.proposal].stages[r.delivered];add('Residents',d.name,'deliverResidentsSupplies',[r.proposal,r.delivered],d.cost,E.residentsDeliveryBlocker(s,r.proposal,r.delivered),`residents:${r.proposal}:${r.delivered}`);}
 }
 if(s.ferry.stage<3){const f=s.ferry,d=E.FERRY_STAGES[f.stage];if(!f.funded)add('Ferry','Fund '+d.name,'fundFerryStage',[f.stage],d.cost,E.ferryFundingBlocker(s),'ferryfund:'+f.stage);else add('Ferry',`Supply ${d.name} · ${f.delivered+1}/3`,'deliverFerrySupplies',[f.stage,f.delivered],d.supplies,E.ferryDeliveryBlocker(s),`ferry:${f.stage}:${f.delivered}`);}
 for(const id of Object.keys(s.reservations))add('Reservations','Release '+(E.goalTitle(s,id)||id),'releaseReservation',[id]);
 for(const offer of F.offers(s,f)){
  const copy=clone(s), progress=clone(f), enabled=F.mutateFestival(copy,progress,offer.fn,offer.args);
  out.push({id:JSON.stringify([offer.fn,offer.args]),category:'Festival',...offer,detail:costText(offer.cost),enabled,reason:enabled?'':offer.reason||'Prepare the finished supplies or release reservations held for other projects.',goal:null,destructive:false});
 }
 return out;
}
function checkedStockTargets(s,raw){
 if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('Invalid native stock targets.');
 const entries=Object.entries(raw);
 if(entries.some(([key,value])=>!Object.hasOwn(E.RECIPES,key)||value!==24||s.targets[key]!==12||!s.pier||!E.unlocked(s,key)))throw Error('Invalid native stock targets.');
 return Object.fromEntries(entries);
}
export function load(raw){
 const input=JSON.parse(raw);let next,evo,targets={},progress=F.freshFestival();
 if(input&&Object.hasOwn(input,'nativeVersion')){
  if(![1,2,3].includes(input.nativeVersion))throw Error('This native save requires a newer app.');
  next=E.parseSave(JSON.stringify(input.town));evo=V.restoreEvolution(JSON.stringify(input.evolution));
  if(input.nativeVersion>=2)targets=checkedStockTargets(next,input.stockTargets);
  else if(Object.hasOwn(input,'stockTargets'))throw Error('Native stock targets require save version 2.');
  if(input.nativeVersion===3)progress=F.restoreFestival(next,input.festival);
  else if(Object.hasOwn(input,'festival'))throw Error('Festival progress requires native save version 3.');
 }else{next=E.parseSave(raw);evo=V.createEvolution();}
 town=next;evolution=evo;stockTargets=targets;festival=progress;return true;
}
export function save(){
 const extended=Object.keys(stockTargets).length>0;
 return JSON.stringify({nativeVersion:festival.stage>0?3:extended?2:1,town,evolution:V.restoreEvolution(V.serializeEvolution(evolution)),...((extended||festival.stage>0)?{stockTargets}:{}),...(festival.stage>0?{festival}:{} )});
}
export function browserSave(){return JSON.stringify(town);}
export function reset(sample=false){town=sample?sampleTown():E.fresh();evolution=V.createEvolution();stockTargets={};festival=F.freshFestival();return true;}
export function tick(dt){
 // Apply native caps only during the synchronous engine step. Production costs,
 // queues, reservations and target accounting are all the original engine logic.
 const before=town.fleet.boats.map(b=>b?.trip?clone(b.trip):null);
 for(const key of Object.keys(stockTargets))town.targets[key]=24;
 try{E.tick(town,dt);}finally{for(const key of Object.keys(stockTargets))town.targets[key]=12;}
 F.recordArrivals(town,festival,before);
 return true;
}
export function speed(value){if(![0,1,3].includes(value))throw Error('Invalid speed');town.speed=value;return true;}
export function act(id){
 const action=registry(town).find(a=>a.id===id);if(!action||!action.enabled)return false;
 // Work on a transaction copy: reject invalid results before changing the live town.
 const next=clone(town),progress=clone(festival);
 const changed=action.fn.startsWith('festival')?F.mutateFestival(next,progress,action.fn,action.args):mutate(next,action.fn,action.args);if(!changed)return false;
 const validated=E.parseSave(JSON.stringify(next));let nextEvolution=evolution;
 let effect=effects[action.fn];if(action.fn==='build')effect=action.args[0]==='olive'?'restore-grove':'expand-quay';if(action.fn==='specialise')effect=action.args[0]==='estate'?'restore-grove':'train-artisans';if(action.fn==='setTownFocus')effect=action.args[0]==='trade'?'ship-cargo':action.args[0]==='builders'?'train-artisans':'fund-festival';
 if(effect)nextEvolution=V.applyChoice(evolution,effect);
 if(!nextEvolution.pendingEvent&&nextEvolution.choiceCount>=6*(nextEvolution.season+1))nextEvolution=V.advanceSeason(nextEvolution);
 const targets={...stockTargets};
 if(action.fn==='setTarget'){if(action.args[1]===24)targets[action.args[0]]=24;else delete targets[action.args[0]];}
 for(const key of Object.keys(targets))if(validated.targets[key]!==12||!E.unlocked(validated,key))delete targets[key];
 if(progress.stage>0)F.restoreFestival(validated,progress);
 town=validated;evolution=nextEvolution;stockTargets=targets;festival=progress;return true;
}
export function resolve(option){evolution=V.resolveEvent(evolution,option);return true;}
export function reserve(goal){const next=clone(town);if(!E.reserveFor(next,goal))return false;town=E.parseSave(JSON.stringify(next));return true;}
export function plan(goal){return JSON.stringify(S.presentation(projectPlan(town,goal)));}
export function queuePlan(goal){const next=clone(town),result=queueProject(next,goal);town=E.parseSave(JSON.stringify(next));return result.queued;}
export function snapshot(){
 const entities=worldEntities(town).filter(e=>e.id!=='specialist').map(e=>{if(e.id==='mill'||e.id==='bakery'||e.id==='fishing')e.level=town.refits[e.id]?2:e.level;return e;});
 for(const [id,x,y,label]of [['boatyard',1080,1390,'Boatyard'],['estate',790,790,'Vineyard & cellar']])entities.push({id,x,y,zone:id==='estate'?'inland':'market',kind:id,label,select:id,stage:town.specialists.includes(id)?(E.underConstruction(town,id)?'building':'built'):'unbuilt',level:town.specialists.includes(id)?1:0});
 const actions=registry(town),baseObjective=currentObjective(town),festivalView=F.festivalView(town,festival);
 if(festivalView.unlocked){const court=entities.find(e=>e.id==='courtyard');court.tab='festival';court.label='Festival courtyard';}
 const objective=festivalView.unlocked?{...baseObjective,chapter:6,chapterName:'Harbour festival',title:festivalView.title,description:festivalView.body,target:'festival',complete:festival.stage===4}:baseObjective;
 let guidance;
 if(festivalView.unlocked&&festival.stage<4){
  let targets=actions.filter(a=>a.category==='Festival'&&a.fn!=='festivalChoose');
  if(festival.stage===2){
   const route=['quarry','island'].find(r=>festival.visits[r]+town.fleet.boats.filter(b=>b?.trip?.ferry&&b.trip.route===r).length<2);
   const mission=actions.find(a=>a.fn==='startFerryService'&&!town.fleet.boats[a.args[0]]?.trip&&a.args[1]===route);
   targets=mission?[mission]:[];
  }
  guidance=nextStep(town,actions,objective,{targets,category:festival.stage===2?'Ferry':'Festival'});
 }else guidance=nextStep(town,actions,objective);
 const workshops=Object.fromEntries(Object.entries(E.RECIPES).filter(([key])=>E.unlocked(town,key)).map(([key,r])=>{
  const item=Object.keys(r.output)[0],target=stockTargets[key]||town.targets[key]||0,stock=town.stock[item]||0,incoming=E.incoming(town,item);
  return [key,{target,stock,incoming,item,status:!target?'Manual production':town.speed===0?'Paused':stock+incoming>=target?'Target covered by stock and queued work':actions.some(a=>a.fn==='start'&&a.args[0]===key&&a.enabled)?'Will queue when the town clock advances':'Waiting for ingredients or a free queue slot'}];
 }));
 return JSON.stringify(S.presentation({story:S.story(town,evolution,festival,objective,guidance),festival:festivalView,directions:directions(town,actions),workshops,townFocus:town.townFocus,berthCount:E.berthCount(town),guidance,coins:town.coins,speed:town.speed,seconds:town.seconds,stock:town.stock,deliveries:town.deliveries,jobs:town.jobs.map((j,i)=>({id:String(i),name:E.RECIPES[j.key].name,left:j.left,duration:E.recipeDuration(town,j.key)})),objective,entities,actions,evolution,style:V.deriveWorldStyle(evolution),event:V.currentEvent(evolution),log:town.log,boats:town.fleet.boats}));
}
