// Native presentation adapter. All economic mutations go through the shipped engine.
import * as E from '../dist/engine.js';
import * as V from '../dist/lab/evolution.js';
import {worldEntities} from '../dist/world-model.js';
import {currentObjective} from '../dist/progression.js';
import {projectPlan,queueProject,costPlan,queueCost} from '../dist/project-planning.js';
import {sampleTown} from '../dist/demo-town.js';
import {nextStep} from './guidance.js';
import {directions} from './directions.js';
import * as F from './festival.js';
import * as S from './story.js';
import * as C from './chronicle.js';
import * as Y from './city-port.js';
import * as R from './crews.js';
let town=E.fresh(), evolution=V.createEvolution(), stockTargets={}, festival=F.freshFestival(), chronicle=null;
const clone=x=>JSON.parse(JSON.stringify(x));
const costText=c=>Object.entries(c||{}).map(([k,n])=>`${n} ${E.ITEMS[k]||k}`).join(' · ');
const effects={dispatch:'ship-cargo',dispatchContract:'ship-cargo',dispatchMarket:'ship-cargo',upgrade:'expand-quay',fundFerryStage:'expand-quay',buildNeighbourhood:'fund-festival',deliverResidentsSupplies:'fund-festival',openNeighbourhood:'fund-festival',fundWaterfront:'repair-waterfront',supplyWaterfront:'repair-waterfront',upgradeWorkshops:'train-artisans',invest:'train-artisans',buildMarketBusiness:'train-artisans',buildKiln:'train-artisans',buildTerrace:'restore-grove',inlandAccess:'restore-grove'};
function mutate(s,fn,args){
 // Native's larger target still uses the original unlock checks and automation worker.
 // Browser exports retain a maximum target of 12; new investments require schema 14.
 if(fn==='setTarget'&&args[1]===24){if(!E.setTarget(s,args[0],12))return false;s.log[0]=E.RECIPES[args[0]].name+' · maintain 24 in stock';return true;}
 if(fn==='queueProject')return queueProject(s,...args).queued>0;if(fn==='speed'){if(![0,1,3].includes(args[0]))return false;s.speed=args[0];return true;}return E[fn](s,...args);}
function registry(s,f=festival,c=chronicle){
 const out=[];
 function add(category,title,fn,args=[],cost=null,reason='',goal=null,destructive=false){
  let enabled=false;try{const copy=clone(s),before=JSON.stringify(copy);enabled=!!mutate(copy,fn,args)&&JSON.stringify(copy)!==before;}catch{}
  if(c?.city.voyages[args[0]]&&['startVoyage','startFerryService','startCircuit','setRepeatVoyage','installBoatUpgrade','refitBoatSails','cancelVoyage'].includes(fn)){enabled=false;reason='This boat is on a city voyage. Wait for its return or recall that voyage.';}
  out.push({id:JSON.stringify([fn,args]),category,title,fn,args,partner:S.partner(fn,args),detail:costText(cost),enabled,reason:enabled?'':typeof reason==='string'&&reason?reason:'Gather the required supplies, finish earlier work, or free a queue slot.',goal,destructive,cost:cost||{}});
 }
 add('Production','Harvest & replant','harvestReplant',[],null,'Wait for the wheat to ripen.');
 for(const [key,r]of Object.entries(E.RECIPES))if(E.unlocked(s,key)){
  add('Production',r.name,'start',[key],r.cost,`Needs ingredients and a free ${r.station} queue slot. A ripe crop must be harvested.`,null);
  out[out.length-1].detail=`${Math.round(E.recipeDuration(s,key)/R.rate(c,'station:'+r.station)*10)/10}s · makes ${costText(E.recipeOutput(s,key))}${Object.keys(r.cost).length?' · needs '+costText(r.cost):' · no ingredients'}`;
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
  if(s.fleet.lighthouse.stage===3)for(const [station,name]of Object.entries(E.ADVANCED_STATIONS))if(Object.entries(E.RECIPES).some(([key,r])=>r.station===station&&E.unlocked(s,key)))for(const tier of [2,3])for(const mode of ['speed','yield','original']){
   const p=E.advancedRefitPlan(s,station,tier,mode);if(mode==='original'&&s.advancedRefits[station]?.tier!==tier)continue;if((s.advancedRefits[station]?.tier||2)>tier)continue;
   add('Refits',name+' · '+(mode==='original'?'Restore original setup':'Tier '+tier+' · '+(mode==='speed'?'faster batches':'more output')),'installAdvancedRefit',[station,tier,mode,p.epoch],p.cost,E.advancedRefitBlocker(s,station,tier,mode),p.goal,!!s.advancedRefits[station]);
   const preview=clone(s);preview.advancedRefits[station]={tier,mode,epoch:p.epoch};out[out.length-1].detail=(costText(p.cost)||'No charge')+'\n'+Object.entries(E.RECIPES).filter(([key,r])=>r.station===station&&E.unlocked(s,key)).map(([key,r])=>r.name+': '+E.recipeDuration(preview,key)+'s, next batch '+costText(E.recipeOutput(preview,key))).join('; ');
  }
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
  if(b.plot===2&&s.market.plots[2]&&s.market.plots[2]!==id)add('Market','Switch to '+b.name,'switchMarketBusiness',[id,s.market.plots[2],s.marketRevision],E.MARKET_SWITCH_COST,E.switchMarketBlocker(s,id,s.market.plots[2]),null,true);
  else if(!s.market.businesses[id])add('Market','Build '+b.name,'buildMarketBusiness',[id,b.plot],b.cost,E.marketBlocker(s,id,b.plot));
  else{const o=E.marketOrder(s,id);add('Market','Supply '+b.name+(o?' · receive '+costText({...o.reward,...(o.coins?{coins:o.coins}:{})}):''),'dispatchMarket',[id],o?.cost,'Wait for construction, demand and supplies.','market:'+id);add('Market',`${s.market.businesses[id].auto?'Stop':'Enable'} automatic supply · ${b.name}`,'setMarketAuto',[id,!s.market.businesses[id].auto]);}
 }
 if(!s.inland.access)add('Inland','Open inland terraces','inlandAccess',[],E.INLAND_ACCESS_COST,E.inlandAccessBlocker(s));
 else{
  for(let i=0;i<2;i++)if(!s.inland.terraces[i])for(const [id,t]of Object.entries(E.TERRACE_TYPES))add('Inland',`Plant ${t.name} · terrace ${i+1}`,'buildTerrace',[i,id],t.cost,E.terraceBlocker(s,i,id));
  if(!s.inland.kiln)add('Inland','Build kiln & preserving room','buildKiln',[],E.KILN_COST,E.kilnBlocker(s));
  if(!s.inland.courtyard)add('Inland','Tile market courtyard','buildCourtyard',[],E.COURTYARD_COST,E.courtyardBlocker(s));
 }
 if(!s.fleet.thirdBerth)add('Fleet','Open the third working berth','buildThirdBerth',[],E.THIRD_BERTH_COST,E.thirdBerthBlocker(s),'thirdberth');
 for(let slot=0;slot<3;slot++){
  const b=s.fleet.boats[slot];
  if(!b){for(const[id,d]of Object.entries(E.FLEET_BOATS))add('Fleet',`Buy ${d.name} · berth ${slot+1}`,'buyBoat',[slot,id],d.cost,E.boatBlocker(s,slot,id));continue;}
  if(b.trip)add('Fleet',`Recall berth ${slot+1} · refund cargo`,'cancelVoyage',[slot],null,'',null,true);
  for(const[route,r]of Object.entries(E.FLEET_ROUTES))for(let tier=1;tier<=3;tier++){
   const p=E.voyagePlan(s,slot,route,tier);add('Fleet',`Berth ${slot+1}: ${r.tiers[tier-1].name} · ${Math.round(p.duration/R.rate(c,'boat:'+slot)*10)/10}s · ${costText(p.reward)}`,'startVoyage',[slot,route,tier],p.cost,E.voyageBlocker(s,slot,route,tier),p.goal);
   if(s.fleet.visits[route]>=3)add('Fleet',`Repeat ${r.name} tier ${tier} · berth ${slot+1}`,'setRepeatVoyage',[slot,route,tier],null,E.repeatVoyageBlocker(s,slot,route,tier));
  }
  if(b.repeat)add('Fleet','Stop repeat · berth '+(slot+1),'setRepeatVoyage',[slot,null]);
  for(let q=1;q<=3;q++)for(let i=1;i<=3;i++){const stops=[{route:'quarry',tier:q},{route:'island',tier:i}],p=E.circuitPlan(s,slot,stops);if(p)add('Circuits',`Berth ${slot+1}: quarry ${q} → island ${i} · ${Math.round(p.duration/R.rate(c,'boat:'+slot)*10)/10}s`,'startCircuit',[slot,stops],p.cost,E.circuitBlocker(s,slot,stops),p.goal);}
  for(const[mode,d]of Object.entries(E.FLEET_UPGRADES))add('Fleet',`Berth ${slot+1}: ${d.name}`,'installBoatUpgrade',[slot,mode],d.cost,E.boatUpgradeBlocker(s,slot,mode),null,!!b.upgrade);
  add('Fleet','Fit new sails · berth '+(slot+1),'refitBoatSails',[slot],E.SAIL_REFIT_COST,E.sailRefitBlocker(s,slot),'neighbourhood:sails:'+slot);
  if(E.ferryEligible(s)&&s.ferry.stage===3)for(const dest of Object.keys(E.FERRY_SERVICES)){const p=E.ferryPlan(s,slot,dest);add('Ferry',`Berth ${slot+1}: ${p.name} · ${Math.round(p.duration/R.rate(c,'boat:'+slot)*10)/10}s · ${costText(p.reward)}`,'startFerryService',[slot,dest],p.cost,E.ferryServiceBlocker(s,slot,dest),p.goal);}
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
 for(const offer of F.offers(s,f,c?.festivalTickets)){
  const copy=clone(s), progress=clone(f), history=c?clone(c):null,goal='native-festival:'+JSON.stringify([offer.fn,offer.args]);
  for(const[k,n]of Object.entries(history?.reservations[goal]||{})){if(k==='coins')copy.coins+=n;else copy.stock[k]+=n;}
  const enabled=F.mutateFestival(copy,progress,offer.fn,offer.args,history?.festivalTickets);
  out.push({id:JSON.stringify([offer.fn,offer.args]),category:'Festival',...offer,detail:costText(offer.cost),enabled,reason:enabled?'':offer.reason||'Prepare the finished supplies or release reservations held for other projects.',goal:Object.keys(offer.cost).length?goal:null,destructive:false});
 }
 for(const offer of C.actions(s,c,f)){
  const enabled=C.mutate(clone(s),clone(c||C.freshChronicle()),f,offer.fn,offer.args);
  out.push({id:JSON.stringify([offer.fn,offer.args]),category:'Goals',...offer,detail:costText(offer.cost),enabled,reason:enabled?'':offer.reason,goal:offer.goal||null,destructive:offer.destructive||false});
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
 const input=JSON.parse(raw);let next,evo,targets={},progress=F.freshFestival(),history=null;
 if(input&&Object.hasOwn(input,'nativeVersion')){
  if(![1,2,3,4,5].includes(input.nativeVersion))throw Error('This native save requires a newer app.');
  if(input.nativeVersion===5&&!input.chronicle?.crews||input.nativeVersion<5&&input.chronicle&&Object.hasOwn(input.chronicle,'crews'))throw Error('Harbour crews require native save version 5.');
  next=E.parseSave(JSON.stringify(input.town));evo=V.restoreEvolution(JSON.stringify(input.evolution));
  if(input.nativeVersion>=2)targets=checkedStockTargets(next,input.stockTargets);
  else if(Object.hasOwn(input,'stockTargets'))throw Error('Native stock targets require save version 2.');
  if(input.nativeVersion>=3){if(input.nativeVersion>=4&&JSON.stringify(input.festival)===JSON.stringify(F.freshFestival()))progress=F.freshFestival();else progress=F.restoreFestival(next,input.festival);}
  else if(Object.hasOwn(input,'festival'))throw Error('Festival progress requires native save version 3.');
  if(input.nativeVersion>=4)history=C.restore(next,progress,input.chronicle);
  else if(Object.hasOwn(input,'chronicle'))throw Error('Chronicle progress requires native save version 4.');
 }else{next=E.parseSave(raw);evo=V.createEvolution();}
 town=next;evolution=evo;stockTargets=targets;festival=progress;chronicle=history;return true;
}
export function save(){
 const extended=Object.keys(stockTargets).length>0;
 return JSON.stringify({nativeVersion:chronicle?.crews?5:chronicle?4:festival.stage>0?3:extended?2:1,town,evolution:V.restoreEvolution(V.serializeEvolution(evolution)),...((chronicle||extended||festival.stage>0)?{stockTargets}:{}),...((chronicle||festival.stage>0)?{festival}:{}),...(chronicle?{chronicle}:{})});
}
export function browserSave(){return JSON.stringify(C.exportTown(town,chronicle));}
export function legacyBrowserSave(){return E.legacyBrowserSave(C.exportTown(town,chronicle));}
export function reset(sample=false){town=sample?sampleTown():E.fresh();evolution=V.createEvolution();stockTargets={};festival=F.freshFestival();chronicle=null;return true;}
export function tick(dt){
 // Apply native caps only during the synchronous engine step. Production costs,
 // queues, reservations and target accounting are all the original engine logic.
 const before=town.fleet.boats.map(b=>b?.trip?clone(b.trip):null),seconds=town.seconds;
 for(const key of Object.keys(stockTargets))town.targets[key]=24;
 const arrivals=[null,null,null];
 try{E.tick(town,dt,undefined,R.work(chronicle,(slot,trip)=>{arrivals[slot]=trip;}));}finally{for(const key of Object.keys(stockTargets))town.targets[key]=12;}
 F.recordArrivals(town,festival,before);
 C.tick(town,chronicle,before,town.seconds-seconds,arrivals);
 return true;
}
export function speed(value){if(![0,1,3].includes(value))throw Error('Invalid speed');town.speed=value;return true;}
export function act(id){
 const action=registry(town).find(a=>a.id===id);if(!action||!action.enabled)return false;
 // Work on a transaction copy: reject invalid results before changing the live town.
 const next=clone(town),progress=clone(festival),history=chronicle?clone(chronicle):null;
 const nextChronicle=action.fn==='chronicleBegin'?(history||C.freshChronicle()):history;
 if(action.fn.startsWith('festival')&&nextChronicle){
  for(const[k,n]of Object.entries(nextChronicle.reservations[action.goal]||{})){if(k==='coins')next.coins+=n;else next.stock[k]+=n;}
  delete nextChronicle.reservations[action.goal];
  // Theme changes return any previous theme's unspent reserved supplies.
  if(action.fn==='festivalChoose')for(const g of Object.keys(nextChronicle.reservations))if(g.startsWith('native-festival:')){if(!C.release(next,nextChronicle,g))return false;}
 }
 const changed=action.fn.startsWith('chronicle')?C.mutate(next,nextChronicle,progress,action.fn,action.args):action.fn.startsWith('festival')?F.mutateFestival(next,progress,action.fn,action.args,nextChronicle?.festivalTickets):mutate(next,action.fn,action.args);if(!changed)return false;
 const validated=E.parseSave(JSON.stringify(next));let nextEvolution=evolution;
 let effect=effects[action.fn];if(action.fn==='build')effect=action.args[0]==='olive'?'restore-grove':'expand-quay';if(action.fn==='specialise')effect=action.args[0]==='estate'?'restore-grove':'train-artisans';if(action.fn==='setTownFocus')effect=action.args[0]==='trade'?'ship-cargo':action.args[0]==='builders'?'train-artisans':'fund-festival';
 if(effect)nextEvolution=V.applyChoice(evolution,effect);
 if(!nextEvolution.pendingEvent&&nextEvolution.choiceCount>=6*(nextEvolution.season+1))nextEvolution=V.advanceSeason(nextEvolution);
 const targets={...stockTargets};
 if(action.fn==='setTarget'){if(action.args[1]===24)targets[action.args[0]]=24;else delete targets[action.args[0]];}
 for(const key of Object.keys(targets))if(validated.targets[key]!==12||!E.unlocked(validated,key))delete targets[key];
 if(progress.stage>0)F.restoreFestival(validated,progress);
 if(nextChronicle)C.enableFestival(nextChronicle,progress);
 C.departure(nextChronicle,action.fn,action.args);
 R.reconcile(validated,nextChronicle);
 if(nextChronicle)C.restore(validated,progress,nextChronicle);
 town=validated;evolution=nextEvolution;stockTargets=targets;festival=progress;chronicle=nextChronicle;return true;
}
// One atomic target edit. Reuses the original unlock/target rules and never
// starts production or spends stock during this transaction.
export function setTargets(keys,target){
 if(!Array.isArray(keys)||!keys.length||new Set(keys).size!==keys.length||![0,6,12,24].includes(target))return false;
 if(keys.some(key=>typeof key!=='string'||!Object.hasOwn(E.RECIPES,key)||!E.unlocked(town,key))||!town.pier)return false;
 if(keys.every(key=>(stockTargets[key]||town.targets[key]||0)===target))return true;
 const next=clone(town),targets={...stockTargets};
 for(const key of keys){if(!mutate(next,'setTarget',[key,target]))return false;if(target===24)targets[key]=24;else delete targets[key];}
 next.log=[`${keys.length} production targets · ${target?'keep '+target:'automatic production off'}`,...town.log].slice(0,5);
 const validated=E.parseSave(JSON.stringify(next));
 town=validated;stockTargets=targets;return true;
}
export function resolve(option){evolution=V.resolveEvent(evolution,option);return true;}
export function newCoast(coast,name){
 if(!['rocky','marsh','windy'].includes(coast))return false;
 const next=E.fresh(),history=C.freshChronicle();history.coast=coast;history.townName=name.trim();
 C.restore(next,F.freshFestival(),history);reset();chronicle=history;return true;
}
export function identity(name,awning){const history=clone(chronicle||C.freshChronicle());history.townName=name.trim();history.awning=awning;C.restore(town,festival,history);chronicle=history;return true;}
export function pin(goal){
 if(goal!==null&&!['guide','festival',...directions(town,registry(town)).map(d=>'direction:'+d.id),...(chronicle?.offers.map(o=>'year:'+o.id)||[]),...Object.keys(chronicle?.projects||{}).map(id=>'chronicle:'+id)].includes(goal))return false;
 const next=clone(chronicle||C.freshChronicle());next.pin=goal;C.enableFestival(next,festival);chronicle=C.restore(town,festival,next);return true;
}
export function reserve(goal){const next=clone(town),history=chronicle?clone(chronicle):goal.startsWith('native-festival:')?C.freshChronicle():null;if(history)C.enableFestival(history,festival);const ok=C.goalCost(history,goal,festival,next)?C.reserve(next,history,goal,festival):E.reserveFor(next,goal);if(!ok)return false;const validated=E.parseSave(JSON.stringify(next));if(history)C.restore(validated,festival,history);town=validated;chronicle=history;return true;}
export function plan(goal){const cost=C.goalCost(chronicle,goal,festival,town),p=cost?costPlan(C.planTown(town,chronicle,goal),goal,cost,(registry(town).find(a=>a.goal===goal)?.title||C.goalTitle(chronicle,goal))):projectPlan(town,goal);for(const r of p.requirements)r.reserved=chronicle?.reservations[goal]?.[r.item]||town.reservations[goal]?.[r.item]||0;return JSON.stringify(S.presentation(p));}
export function queuePlan(goal){const next=clone(town),cost=C.goalCost(chronicle,goal,festival,town),held=chronicle?.reservations[goal]||{};const result=cost?queueCost(next,goal,Object.fromEntries(Object.entries(cost).map(([k,n])=>[k,n-(held[k]||0)])),(registry(town).find(a=>a.goal===goal)?.title||C.goalTitle(chronicle,goal))):queueProject(next,goal);town=E.parseSave(JSON.stringify(next));return result.queued;}
export function snapshot(){
 const entities=worldEntities(town).filter(e=>e.id!=='specialist').map(e=>{if(e.id==='mill'||e.id==='bakery'||e.id==='fishing')e.level=town.refits[e.id]?2:e.level;const rank=town.advancedRefits[e.select||e.kind]?.tier;if(rank&&e.stage==='built')e.level=rank;return e;});
 for(const [id,x,y,label]of [['boatyard',1080,1390,'Boatyard'],['estate',790,790,'Vineyard & cellar']])entities.push({id,x,y,zone:id==='estate'?'inland':'market',kind:id,label,select:id,stage:town.specialists.includes(id)?(E.underConstruction(town,id)?'building':'built'):'unbuilt',level:town.specialists.includes(id)?1:0});
 for(const e of entities){
  const station=e.id==='kiln'?(town.advancedRefits.preserving?.tier===3&&town.advancedRefits.kiln?.tier!==3?'preserving':'kiln'):Object.hasOwn(E.ADVANCED_STATIONS,e.id)?e.id:e.select||e.kind;
  const rank=town.advancedRefits[station]?.tier;
  if(rank&&e.stage==='built'){e.level=rank;if(rank===3)e.artwork='advanced-'+station;}
 }
 if(chronicle?.started){
  const locations=[[300,1750],[780,1720],[1220,2460],[350,2440],[1230,1730],[200,590],[830,2470],[900,1020]];
  for(const p of C.view(town,chronicle,festival).projects){const i=C.PROJECTS.findIndex(d=>d.id===p.id),[x,y]=locations[i];entities.push({id:'chronicle-'+p.id,x,y,zone:'harbour',kind:'chronicle-'+p.id,label:p.title,tab:'goals',stage:p.stage<=0?'unbuilt':p.stage<4?'building':'built',level:p.branch+1});}
 }
 const actions=registry(town),baseObjective=currentObjective(town),festivalView=F.festivalView(town,festival);
 if(festivalView.unlocked){const court=entities.find(e=>e.id==='courtyard');court.tab='festival';court.label='Festival courtyard';}
 if(chronicle?.festivalTickets&&festival.stage===4)festivalView.body='Choose between two festival requests. Completing one keeps the other offer and its reserved supplies. Your courtyard stays decorated.';
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
  return [key,{station:r.station,target,stock,incoming,item,status:!target?'Manual production':town.speed===0?'Paused':stock+incoming>=target?'Target covered by stock and queued work':actions.some(a=>a.fn==='start'&&a.args[0]===key&&a.enabled)?'Will queue when the town clock advances':'Waiting for ingredients or a free queue slot'}];
 }));
 return JSON.stringify(S.presentation({crews:R.view(town,chronicle),chronicle:C.view(town,chronicle,festival),story:{...S.story(town,evolution,festival,objective,guidance),townName:chronicle?.townName||S.TOWN_NAME},festival:festivalView,directions:directions(town,actions),legacyBrowserAvailable:!E.legacyExportBlocker(town),markets:Object.entries(E.MARKET_BUSINESSES).map(([id,d])=>({id,name:d.name,plot:d.plot,demand:town.market.businesses[id]?.demand??null})),workshops,advancedRefits:town.advancedRefits,townFocus:town.townFocus,berthCount:E.berthCount(town),guidance,coins:town.coins,speed:town.speed,seconds:town.seconds,stock:town.stock,deliveries:town.deliveries,jobs:town.jobs.map((j,i)=>({id:String(i),name:E.RECIPES[j.key].name,left:j.left/R.rate(chronicle,'station:'+E.RECIPES[j.key].station),duration:E.recipeDuration(town,j.key)/R.rate(chronicle,'station:'+E.RECIPES[j.key].station)})),objective,entities,actions,evolution,style:V.deriveWorldStyle(evolution),event:V.currentEvent(evolution),log:town.log,boats:Y.boats(town,chronicle)}));
}

export function assignCrew(team,target,epoch){
 if(!chronicle)return false;
 const next=clone(town),history=clone(chronicle);
 if(!R.assign(next,history,team,target,epoch))return false;
 const validated=E.parseSave(JSON.stringify(next));C.restore(validated,festival,history);
 town=validated;chronicle=history;return true;
}
