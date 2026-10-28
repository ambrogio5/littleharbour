import {ITEMS,RECIPES,BUILD_COST,SECOND_COST,PIER_COST,WORKSHOP_COST,PATHS,CONTRACTS,CHARTER_COST,REFITS,WATERFRONT_SECONDS,WATERFRONT_STAGES,MARKET_ACCESS_COST,MARKET_SECONDS,MARKET_BUSINESSES,INLAND_ACCESS_COST,INLAND_SECONDS,TERRACE_TYPES,KILN_COST,COURTYARD_COST,FLEET_BOATS,FLEET_UPGRADES,FLEET_ROUTES,LIGHTHOUSE_STAGES,LIGHTHOUSE_SECONDS,COASTAL_PROJECTS,COASTAL_COMMISSIONS,NEIGHBOURHOOD_ACCESS_COST,PLOT_COST,NEIGHBOURHOOD_BUILDINGS,HOME_UPGRADE_COST,SAIL_REFIT_COST,NEIGHBOURHOOD_ORDERS,FERRY_STAGES,FERRY_SERVICES} from './catalog.js';
export * from './catalog.js';
export function fresh(){return {version:12,ferry:{stage:0,funded:false,delivered:0,runs:0},neighbourhood:{access:false,plots:[null,null,null,null,null,null],orders:0},fleet:{development:{quarry:0,island:0},commissions:{quarry:0,island:0},boats:[null,null],visits:{quarry:0,island:0},lighthouse:{stage:0,left:0}},inland:{access:false,left:0,terraces:[null,null],kiln:null,courtyard:false,courtyardLeft:0,shipments:0},reservations:{},market:{access:false,left:0,plots:[null,null,null],businesses:{}},waterfront:{path:null,stage:0,funded:false,delivered:0,left:0},refits:{},specialisation:null,specialists:[],contract:null,contractsDone:[],contractDeliveries:0,charter:false,construction:[],coins:80,stock:{wheat:0,flour:0,bread:0,olives:0,oil:0,fish:0,wood:24,stone:16,planks:0,boatparts:0,grapes:0,wine:0,provisions:0,clay:0,fruit:0,vegetables:0,jars:0,tiles:0,preserves:0,flax:0,cloth:0,furniture:0,sails:0},jobs:[],ripe:true,speed:1,seconds:0,deliveries:0,expansion:null,businesses:[],pier:false,workshopUpgrade:false,targets:{},selectedOrder:'local',onboarded:false,harvests:0,milled:0,baked:0,log:['Your harbour is ready. Start with the wheat field.']};}
export function has(s,type){return s.businesses.includes(type);}
export function reserved(s,item){return Object.values(s.reservations||{}).reduce((sum,c)=>sum+(c[item]||0),0);}
export function available(s,item,goalId=null){return (item==='coins'?s.coins:s.stock[item]||0)-reserved(s,item)+(s.reservations?.[goalId]?.[item]||0);}
export function canAfford(s,c,goalId=null){return Object.entries(c).every(([k,v])=>Number.isFinite(v)&&v>=0&&available(s,k,goalId)>=v);}
function spend(s,c,goalId=null){for(const[k,v]of Object.entries(c)){if(k==='coins')s.coins-=v;else s.stock[k]-=v;const own=s.reservations?.[goalId];if(own?.[k]){own[k]=Math.max(0,own[k]-v);if(!own[k])delete own[k];}}if(goalId&&s.reservations?.[goalId]&&!Object.keys(s.reservations[goalId]).length)delete s.reservations[goalId];}
function add(s,c){for(const[k,v]of Object.entries(c))s.stock[k]+=v;}
function note(s,t){s.log.unshift(t);s.log=s.log.slice(0,5);}
export function capacity(s,station){if(['flaxgarden','weaver','carpenter','sailmaker'].includes(station))return neighbourhoodCapacity(s);return station==='field'?1:(s.workshopUpgrade?4:2)+(s.refits?.[station]==='queue'?2:0);}
export const CONSTRUCTION_SECONDS=8;
export function underConstruction(s,type){return s.construction.find(p=>p.type===type)||null;}
export function unlocked(s,key){if(!Object.hasOwn(RECIPES,key))return false;const station=RECIPES[key].station;if(['flaxgarden','weaver','carpenter','sailmaker'].includes(station))return neighbourhoodReady(s)&&s.neighbourhood.plots.some(p=>p?.type===station);if(['claypit','terrace0','terrace1','kiln','preserving'].includes(station)){if(!inlandReady(s))return false;if(station==='claypit')return true;if(station.startsWith('terrace')){const plot=Number(station.slice(-1)),t=s.inland.terraces[plot];return !!t&&!t.left&&key===t.type+plot;}return !!s.inland.kiln&&!s.inland.kiln.left&&(station!=='preserving'||s.inland.terraces.some(t=>t&&!t.left&&t.type===(key==='fruitPreserves'?'orchard':'garden')));}if(station==='kitchen')return marketReady(s)&&!!marketBusiness(s,'kitchen')&&!marketBusiness(s,'kitchen').left;if(['boatyard','estate'].includes(station))return s.specialists.includes(station)&&!underConstruction(s,station)&&(s.charter||PATHS[s.specialisation]?.station===station);return key==='fishing'?has(s,'fishing')&&!underConstruction(s,'fishing'):['olives','press'].includes(key)?has(s,'olive')&&!underConstruction(s,'olive'):true;}
export function harvest(s){if(!s.ripe)return false;s.ripe=false;s.stock.wheat+=6;s.harvests++;note(s,'Harvest collected · +6 wheat');return true;}
export function start(s,key,quiet=false){if(!unlocked(s,key))return false;const r=RECIPES[key];if(key==='field'&&s.ripe)return false;if(s.jobs.filter(j=>RECIPES[j.key].station===r.station).length>=capacity(s,r.station)||!canAfford(s,r.cost))return false;spend(s,r.cost);s.jobs.push({key,left:recipeDuration(s,key)});if(!quiet)note(s,r.name+' queued');return true;}
// Bulk controls spend only available ingredients and respect shared station queues.
export function maxBatches(s,key){
 if(!unlocked(s,key)||(key==='field'&&s.ripe))return 0;
 const r=RECIPES[key],slots=capacity(s,r.station)-s.jobs.filter(j=>RECIPES[j.key].station===r.station).length;
 return Math.max(0,Math.min(slots,...Object.entries(r.cost).map(([item,n])=>Math.floor(available(s,item)/n))));
}
export function queueBatch(s,key,count){
 if(!Number.isSafeInteger(count)||count<1)return 0;
 const amount=Math.min(count,maxBatches(s,key));
 for(let i=0;i<amount;i++)start(s,key,true);
 if(amount)note(s,RECIPES[key].name+' · '+amount+' batch'+(amount===1?'':'es')+' queued');
 return amount;
}
export function harvestReplant(s){
 if(!harvest(s))return false;
 start(s,'field',true);
 return true;
}
export function incoming(s,item){return s.jobs.reduce((sum,j)=>sum+(RECIPES[j.key].output[item]||0),0);}
export function canCancel(s,index){const j=s.jobs[index];return !!j&&s.jobs.slice(0,index).some(x=>RECIPES[x.key].station===RECIPES[j.key].station);}
export function cancel(s,index){if(!Number.isInteger(index)||!canCancel(s,index))return false;const [j]=s.jobs.splice(index,1);add(s,RECIPES[j.key].cost);note(s,'Queued batch cancelled · ingredients returned');return true;}
export function prioritize(s,index){if(!Number.isInteger(index)||!canCancel(s,index))return false;const station=RECIPES[s.jobs[index].key].station,first=s.jobs.findIndex(j=>RECIPES[j.key].station===station);if(index===first+1)return false;const [j]=s.jobs.splice(index,1);s.jobs.splice(first+1,0,j);note(s,'Batch moved to the front of its waiting queue');return true;}
export function setTarget(s,key,target){if(!s.pier||!unlocked(s,key)||![0,6,12].includes(target))return false;s.targets[key]=target;note(s,target?RECIPES[key].name+' · maintain '+target+' in stock':'Automatic '+RECIPES[key].name.toLowerCase()+' stopped');return true;}
function automate(s){if(!s.pier)return;for(const key of Object.keys(RECIPES)){const target=s.targets[key]||0;if(!target||!unlocked(s,key))continue;const r=RECIPES[key],item=Object.keys(r.output)[0],incoming=s.jobs.reduce((n,j)=>n+(RECIPES[j.key].output[item]||0),0);if(key==='field'&&s.ripe&&s.stock.wheat<target)harvest(s);if(s.stock[item]+incoming<target)start(s,key,true);}}
export function tick(s,dt,onEvent){if(!s.speed||!Number.isFinite(dt)||dt<=0)return;const elapsed=Math.min(dt,60)*s.speed;s.seconds+=elapsed;let completed=0;const w=s.waterfront;if(w.left>0){w.left=Math.max(0,w.left-elapsed);if(w.left===0){note(s,WATERFRONT_STAGES[w.stage].name+' restored');w.stage++;w.funded=false;w.delivered=0;completed++;}}for(const project of [...s.construction]){project.left-=elapsed;if(project.left<=0){s.construction.splice(s.construction.indexOf(project),1);completed++;note(s,({olive:'Olive workshop',fishing:'Fishing jetty',pier:'Quay extension',storehouse:'Storehouse improvement',boatyard:'Boatyard',estate:'Vineyard and cellar',charter:'Harbour charter office'})[project.type]+' construction complete');}}const stations=[...new Set(s.jobs.map(j=>RECIPES[j.key].station))];for(const station of stations){let budget=elapsed;while(budget>0){const i=s.jobs.findIndex(j=>RECIPES[j.key].station===station);if(i<0)break;const j=s.jobs[i],r=RECIPES[j.key];if(j.left>budget){j.left-=budget;break;}budget-=j.left;s.jobs.splice(i,1);completed++;if(j.key==='field')s.ripe=true;else add(s,r.output);if(j.key==='mill')s.milled++;if(j.key==='bakery')s.baked++;if(j.key!=='field')onEvent?.({type:'produced',key:j.key});note(s,j.key==='field'?'Wheat is ready to harvest.':r.name+' complete · '+Object.entries(r.output).map(([k,v])=>'+'+v+' '+ITEMS[k].toLowerCase()).join(', '));}}completed+=tickMarket(s,elapsed);completed+=tickInland(s,elapsed);completed+=tickFleet(s,elapsed);automate(s);return completed;}
function withCharter(s,route){return s.charter?{...route,coins:Math.round(route.coins*1.2)}:route;}
export function orders(s){
 if(!s.deliveries)return [{id:'local',name:'Cala Verde',description:'Supply the village market with its first bread delivery.',cost:{bread:4},coins:80,wood:8,stone:4}];
 if(!s.expansion)return [{id:'local',name:'New coastal routes',description:'Build a fishing jetty or olive workshop to open new supply routes.',cost:{},locked:true}];
 const product=s.expansion==='fishing'?'fish':'oil';
 if(!s.pier)return [{id:'local',name:'Porto Santo',description:'Fresh supplies for a neighbouring harbour.',cost:{bread:2,[product]:2},coins:120,wood:6,stone:3}];
 return [
 {id:'local',name:'Cala Verde',description:'A balanced shipment for the coastal market.',cost:{bread:4,[product]:4},coins:180,wood:6,stone:2},
 {id:'materials',name:'Porto Santo',description:'A smaller order with more construction materials in return.',cost:{bread:2,[product]:2},coins:100,wood:10,stone:5},
 s.businesses.length===2?{id:'specialist',name:'Isola Lunga',description:'A mixed shipment from both of your businesses.',cost:{bread:4,fish:2,oil:2},coins:210,wood:6,stone:3}:{id:'specialist',name:'Isola Lunga',description:'A specialist shipment. No bread required.',cost:{[product]:6},coins:150,wood:2,stone:2}
 ,...(s.waterfront.stage===3?[{id:'waterfront',name:'Porto Grande',description:'Bulk cargo from the restored waterfront. Larger shipments return more building materials.',cost:s.waterfront.path==='maritime'?{bread:6,fish:4,boatparts:2}:{bread:6,oil:4,wine:2},coins:320,wood:22,stone:12}]:[])
 ,...(inlandTradeReady(s)?[{id:'inland',name:'Valle Serena',description:'Jarred harvests for inland villages. Return with timber and stone for your town.',cost:{preserves:4},coins:180,wood:8,stone:6}]:[])
 ];
}
export function order(s,id=s.selectedOrder){return withCharter(s,orders(s).find(o=>o.id===id)||orders(s)[0]);}
export function selectOrder(s,id){if(!orders(s).some(o=>o.id===id))return false;s.selectedOrder=id;return true;}
export function dispatch(s){const o=order(s),goal='trade:'+o.id;if(o.locked||!canAfford(s,o.cost,goal))return false;spend(s,o.cost,goal);releaseReservation(s,goal);s.coins+=o.coins;s.stock.wood+=o.wood;s.stock.stone+=o.stone;s.deliveries++;if(o.id==='inland')s.inland.shipments++;note(s,'Delivered to '+o.name+' · +'+o.coins+' coins, +'+o.wood+' timber, +'+o.stone+' stone');pruneReservations(s);return true;}
export function buildCost(s){return s.expansion?SECOND_COST:BUILD_COST;}
export function build(s,type){const previousOrders=orders(s),cost=buildCost(s);if(!['fishing','olive'].includes(type)||has(s,type)||s.deliveries<1||(s.expansion&&!s.pier)||!canAfford(s,cost))return false;spend(s,cost);s.businesses.push(type);s.expansion??=type;s.construction.push({type,left:CONSTRUCTION_SECONDS});note(s,(type==='fishing'?'Fishing jetty':'Olive workshop')+' construction started');pruneReservations(s,previousOrders);return true;}
export function upgrade(s){const previousOrders=orders(s);if(!s.expansion||s.deliveries<2||s.pier||!canAfford(s,PIER_COST))return false;spend(s,PIER_COST);s.pier=true;s.construction.push({type:'pier',left:CONSTRUCTION_SECONDS});note(s,'Quay extended · choose routes and automate production');pruneReservations(s,previousOrders);return true;}
export function upgradeWorkshops(s){if(!s.pier||s.workshopUpgrade||!canAfford(s,WORKSHOP_COST))return false;spend(s,WORKSHOP_COST);s.workshopUpgrade=true;s.construction.push({type:'storehouse',left:CONSTRUCTION_SECONDS});note(s,'Storehouse organised · four queue slots per workshop');return true;}
export function milestone(s){if(!s.harvests)return 0;if(!s.milled)return 1;if(!s.baked)return 2;if(!s.deliveries)return 3;if(!s.expansion)return 4;if(!s.pier)return 5;return 6;}
export function parseSave(raw){
 if(typeof raw!=='string'||raw.length>100000)throw Error('This is not a valid harbour save.');
 let x;try{x=JSON.parse(raw);}catch{throw Error('This file is not a readable harbour save.');}
 const invalid=()=>{throw Error('This save contains incomplete or invalid game data.');};
 if(!x||![1,2,3,4,5,6,7,8,9,10,11,12].includes(x.version)||!x.stock||typeof x.stock!=='object'||!Array.isArray(x.jobs)||!Array.isArray(x.log))invalid();
 const s=fresh();
 for(const k of ['coins','deliveries','harvests','milled','baked']){if(!Number.isSafeInteger(x[k])||x[k]<0||x[k]>1e9)invalid();s[k]=x[k];}
 if(!Number.isFinite(x.seconds)||x.seconds<0||x.seconds>1e10)invalid();s.seconds=x.seconds;
 for(const k of Object.keys(s.stock)){if(x.version<11&&['flax','cloth','furniture','sails'].includes(k))continue;if(x.version<8&&['clay','fruit','vegetables','jars','tiles','preserves'].includes(k))continue;if(x.version<7&&k==='provisions')continue;if(x.version<4&&['planks','boatparts','grapes','wine'].includes(k))continue;if(!Number.isSafeInteger(x.stock[k])||x.stock[k]<0||x.stock[k]>1e9)invalid();s.stock[k]=x.stock[k];}
 for(const k of ['ripe','pier']){if(typeof x[k]!=='boolean')invalid();s[k]=x[k];}
 if(![0,1,3].includes(x.speed)||!['fishing','olive',null].includes(x.expansion))invalid();s.speed=x.speed;s.expansion=x.expansion;
 if(x.version===1){s.businesses=x.expansion?[x.expansion]:[];s.onboarded=true;}
 else{if(!Array.isArray(x.businesses)||x.businesses.length>2||new Set(x.businesses).size!==x.businesses.length||x.businesses.some(b=>!['fishing','olive'].includes(b)))invalid();s.businesses=[...x.businesses];if(typeof x.workshopUpgrade!=='boolean'||typeof x.onboarded!=='boolean')invalid();s.workshopUpgrade=x.workshopUpgrade;s.onboarded=x.onboarded;if(!['local','materials','specialist',...(x.version>=6?['waterfront']:[]),...(x.version>=8?['inland']:[])].includes(x.selectedOrder))invalid();s.selectedOrder=x.selectedOrder;if(!x.targets||typeof x.targets!=='object'||Array.isArray(x.targets))invalid();for(const[k,v]of Object.entries(x.targets)){if(!Object.hasOwn(RECIPES,k)||![0,6,12].includes(v))invalid();s.targets[k]=v;}}
 if((s.expansion&&!has(s,s.expansion))||(!s.expansion&&s.businesses.length)||(s.businesses.length===2&&!s.pier)||(s.pier&&(!s.expansion||s.deliveries<2))||(s.workshopUpgrade&&!s.pier)||(!s.pier&&Object.values(s.targets).some(Boolean)))invalid();
 if(x.version>=4){
  if(![null,'maritime','estate'].includes(x.specialisation)||!Array.isArray(x.specialists)||x.specialists.length>2||new Set(x.specialists).size!==x.specialists.length||x.specialists.some(k=>!['boatyard','estate'].includes(k)))invalid();
  s.specialisation=x.specialisation;s.specialists=[...x.specialists];
  if(!Array.isArray(x.contractsDone)||x.contractsDone.length>4||new Set(x.contractsDone).size!==x.contractsDone.length||x.contractsDone.some(k=>!Object.hasOwn(CONTRACTS,k)))invalid();s.contractsDone=[...x.contractsDone];
  if(!Number.isSafeInteger(x.contractDeliveries)||x.contractDeliveries<0||x.contractDeliveries>1e9||typeof x.charter!=='boolean')invalid();s.contractDeliveries=x.contractDeliveries;s.charter=x.charter;
  if((s.specialisation&&!s.pier)||(s.specialists.length&&!s.specialisation)||(s.charter&&s.contractsDone.length<2)||s.specialists.some(st=>!has(s,st==='boatyard'?'fishing':'olive')))invalid();
  if(x.contract!==null){const c=x.contract,definition=c&&Object.hasOwn(CONTRACTS,c.id)?CONTRACTS[c.id]:null;if(!definition||!Number.isSafeInteger(c.shipped)||c.shipped<0||c.shipped>=definition.shipments||definition.path!==s.specialisation||!s.specialists.includes(PATHS[definition.path].station))invalid();s.contract={id:c.id,shipped:c.shipped};}
 }
 if(x.version>=3){if(!Array.isArray(x.construction)||x.construction.length>7)invalid();const seen=new Set();for(const p of x.construction){if(!p||!['olive','fishing','pier','storehouse','boatyard','estate','charter'].includes(p.type)||seen.has(p.type)||!Number.isFinite(p.left)||p.left<=0||p.left>CONSTRUCTION_SECONDS)invalid();if((['olive','fishing'].includes(p.type)&&!has(s,p.type))||(p.type==='pier'&&!s.pier)||(p.type==='storehouse'&&!s.workshopUpgrade)||(['boatyard','estate'].includes(p.type)&&!s.specialists.includes(p.type))||(p.type==='charter'&&!s.charter))invalid();seen.add(p.type);s.construction.push({type:p.type,left:p.left});}}
 if(x.version>=5){
  if(!x.refits||typeof x.refits!=='object'||Array.isArray(x.refits))invalid();
  for(const[st,mode]of Object.entries(x.refits)){if(!Object.hasOwn(REFITS,st)||!['speed','queue'].includes(mode)||!s.expansion||(st==='fishing'&&!has(s,'fishing')))invalid();s.refits[st]=mode;}
 }
 if(x.version>=6){
  const w=x.waterfront;
  if(!w||typeof w!=='object'||Array.isArray(w)||![null,'maritime','estate'].includes(w.path)||!Number.isInteger(w.stage)||w.stage<0||w.stage>3||typeof w.funded!=='boolean'||!Number.isInteger(w.delivered)||w.delivered<0||w.delivered>2||!Number.isFinite(w.left)||w.left<0||w.left>WATERFRONT_SECONDS)invalid();
  if(w.path===null){if(w.stage||w.funded||w.delivered||w.left)invalid();}
  else if(!s.charter||underConstruction(s,'charter')||!s.specialists.includes(PATHS[w.path].station)||underConstruction(s,PATHS[w.path].station)||(!w.stage&&!w.funded))invalid();
  if((!w.funded&&(w.delivered||w.left))||(w.stage===3&&w.funded)||(w.funded&&((w.delivered===2)!==(w.left>0))))invalid();
  s.waterfront={path:w.path,stage:w.stage,funded:w.funded,delivered:w.delivered,left:w.left};
 }
 if(s.selectedOrder==='waterfront'&&s.waterfront.stage!==3)invalid();
 if(x.jobs.length>100)invalid();
 if(x.version>=7)validateMarket(s,x.market,invalid);
 if(x.version>=8)validateInland(s,x.inland,invalid);
 if(x.version>=9)validateFleet(s,x.fleet,invalid,x.version);
 if(x.version>=11)validateNeighbourhood(s,x.neighbourhood,invalid);
 if(x.version>=12)validateFerry(s,x.ferry,invalid);
 if(s.selectedOrder==='inland'&&!inlandTradeReady(s))invalid();
 for(const j of x.jobs){if(!j||!Object.hasOwn(RECIPES,j.key)||!unlocked(s,j.key)||!Number.isFinite(j.left)||j.left<=0||j.left>(['flax','cloth','furniture','sails'].includes(j.key)?RECIPES[j.key].duration:recipeDuration(s,j.key)))invalid();s.jobs.push({key:j.key,left:j.left});}
 for(const station of new Set(Object.values(RECIPES).map(r=>r.station)))if(s.jobs.filter(j=>RECIPES[j.key].station===station).length>capacity(s,station))invalid();
 if(s.ripe&&s.jobs.some(j=>j.key==='field'))invalid();
 if(x.log.length>5||x.log.some(t=>typeof t!=='string'||t.length>250))invalid();s.log=x.log.map(t=>t.replace(/[<>]/g,''));
 if(x.version>=7)validateReservations(s,x.reservations,invalid);
 return s;
}
export function restore(raw){try{return parseSave(raw);}catch{return fresh();}}

// The second chapter asks players to invest in a distinct kind of town.
export function pathBlocker(s,path){
 if(!Object.hasOwn(PATHS,path))return 'Choose a valid town direction.';
 if(!s.pier||underConstruction(s,'pier'))return 'Finish extending the quay first.';
 if(s.contract&&s.specialisation!==path)return 'Finish or leave the current contract before switching.';
 const station=PATHS[s.specialisation]?.station;
 if(!s.charter&&s.specialisation!==path&&station&&(s.jobs.some(j=>RECIPES[j.key].station===station)||underConstruction(s,station)))return 'Finish the current specialist work before switching.';
 return '';
}
export function specialise(s,path){if(pathBlocker(s,path))return false;if(s.specialisation===path)return true;s.specialisation=path;note(s,'Town direction · '+PATHS[path].name);return true;}
export function invest(s){const p=PATHS[s.specialisation];if(!p||!s.pier||!has(s,p.requires)||underConstruction(s,p.requires)||s.specialists.includes(p.station)||!canAfford(s,p.cost))return false;spend(s,p.cost);s.specialists.push(p.station);s.construction.push({type:p.station,left:CONSTRUCTION_SECONDS});note(s,p.building+' construction started');return true;}
export function availableContracts(s){return Object.entries(CONTRACTS).filter(([,c])=>c.path===s.specialisation).map(([id,c])=>({id,...c}));}
export function acceptContract(s,id){if(!Object.hasOwn(CONTRACTS,id)||s.contract)return false;const c=CONTRACTS[id],p=PATHS[c.path];if(c.path!==s.specialisation||!s.specialists.includes(p.station)||underConstruction(s,p.station)||!has(s,p.requires))return false;s.contract={id,shipped:0};note(s,'Contract accepted · '+c.name);return true;}
export function contractReady(s){if(!s.contract)return false;return canAfford(s,CONTRACTS[s.contract.id].cost,'contract:'+s.contract.id);}
export function dispatchContract(s){if(!contractReady(s))return false;const goal='contract:'+s.contract.id,c=CONTRACTS[s.contract.id];spend(s,c.cost,goal);releaseReservation(s,goal);s.coins+=c.coins;s.stock.wood+=c.wood;s.stock.stone+=c.stone;s.contract.shipped++;s.contractDeliveries++;if(s.contract.shipped===c.shipments){const first=!s.contractsDone.includes(s.contract.id);if(first)s.contractsDone.push(s.contract.id);s.coins+=c.bonus;note(s,'Contract complete · '+c.name+' · +'+c.bonus+' coins'+(first?' · new partnership':''));s.contract=null;}else note(s,c.name+' · shipment '+s.contract.shipped+'/'+c.shipments+' delivered');return true;}
export function abandonContract(s){if(!s.contract)return false;releaseReservation(s,'contract:'+s.contract.id);s.contract=null;note(s,'Contract released. Previous shipments remain delivered.');return true;}
export function establishCharter(s){if(s.charter||s.contractsDone.length<2||!canAfford(s,CHARTER_COST))return false;spend(s,CHARTER_COST);s.charter=true;s.construction.push({type:'charter',left:CONSTRUCTION_SECONDS});note(s,'Harbour charter established · +20% regular trade earnings · both specialist plots unlocked');return true;}
export function chapterTwo(s){
 if(!s.specialisation)return {step:0,title:'Choose what your town becomes',description:'Choose a working waterfront or a coastal estate in Build. There is one active specialist plot until you earn the harbour charter.',target:'build'};
 const p=PATHS[s.specialisation];
 if(!s.specialists.includes(p.station)||underConstruction(s,p.station))return {step:1,title:'Invest in your '+p.building.toLowerCase(),description:'Build the '+p.building.toLowerCase()+'. Requires the '+(p.requires==='fishing'?'fishing jetty':'olive workshop')+' and '+Object.entries(p.cost).map(([k,v])=>v+' '+(k==='coins'?'coins':ITEMS[k].toLowerCase())).join(', ')+'.',target:'build'};
 if(s.charter)return {step:6,title:'A town of your own',description:'Chapter complete. Both specialist plots can work together and regular trade earns 20% more. Keep developing your town in open play.',target:'trade'};
 if(s.contractsDone.length>=2)return {step:5,title:'Establish the harbour charter',description:'Two lasting partnerships earned. Invest 400 coins, 20 timber and 12 stone to unlock both specialist plots and better trade earnings.',target:'build'};
 if(s.contract)return {step:3+s.contractsDone.length,title:CONTRACTS[s.contract.id].name,description:'Shipment '+(s.contract.shipped+1)+' of '+CONTRACTS[s.contract.id].shipments+'. Fulfil the chosen contract, while keeping everyday trade available for materials.',target:'contracts'};
 return {step:s.contractsDone.length?4:2,title:s.contractsDone.length?'Build a second partnership':'Choose your first contract',description:s.contractsDone.length?'Complete a different contract to qualify for the harbour charter.':'Compare the two contracts. Accept the one that fits your production plans.',target:'contracts'};
}
// Opening guidance is derived from stock and queues, never a second economy.
export function openingGuide(s){
 const view=(title,description,label,tab='produce',station='overview')=>({title,description,label,action:'view',tab,station});
 if(s.charter&&!underConstruction(s,'charter')){const c=fleetEligible(s)?fleetGuide(s):s.inland.access?inlandGuide(s):s.waterfront.stage===3?marketGuide(s):chapterThree(s);return view(c.title,c.description,c.label,c.target||'waterfront');}
 if(s.pier){if(underConstruction(s,'pier'))return view('The quay is taking shape','Keep the workshops running while the crew finishes.','Watch the quay','map','pier');const c=chapterTwo(s);return view(c.title,c.description,'Continue chapter two',c.target);}
 if(s.deliveries&&!s.expansion)return view('Your first trade paid for a new livelihood','Fishing gives you a direct supply of fish. Olive oil adds a harvest-and-press chain. Both can be built later.','Compare the two businesses','build');
 if(s.expansion&&underConstruction(s,s.expansion))return view('Your new business is being built','You can prepare bread while the crew works. Production opens when construction finishes.','Check production');
 if(s.deliveries>=2&&canAfford(s,PIER_COST))return {title:'Open the harbour to more trade',description:'The quay unlocks three routes, stock targets and the second business. Cost: 140 coins, 10 timber and 8 stone.',label:'Extend the quay',action:'upgrade'};
 const o=order(s);
 if(!o.locked&&canAfford(s,o.cost))return {title:s.deliveries?'Your next shipment is ready':'Your first shipment is ready',description:'Deliver to '+o.name+' for '+o.coins+' coins, '+o.wood+' timber and '+o.stone+' stone.',label:'Dispatch to '+o.name,action:'dispatch'};
 const title=s.deliveries?'Supply your new coastal route':'From wheat to your first shipment';
 const next=(key,n)=>{const amount=Math.min(n,maxBatches(s,key));return amount?{title,description:RECIPES[key].name+'. '+(s.deliveries?'Keep bread and your new goods moving together.':'Four bread will fund your first expansion. Buildings work in parallel.'),label:RECIPES[key].name+' · '+amount+' batch'+(amount===1?'':'es'),action:'batch',key,count:amount}:null;};
 const bread=Math.max(0,(o.cost.bread||0)-s.stock.bread-incoming(s,'bread'));
 if(bread){
  const bake=next('bakery',Math.ceil(bread/2));if(bake)return bake;
  const flour=Math.max(0,Math.ceil(bread/2)*2-s.stock.flour-incoming(s,'flour'));
  if(flour){const mill=next('mill',Math.ceil(flour/2));if(mill)return mill;
   if(s.ripe)return {title,description:'Collect six wheat and plant the next crop. Your mill will turn the harvest into flour.',label:'Harvest & replant',action:'harvest-replant'};
   if(!s.jobs.some(j=>j.key==='field'))return {title,description:'Plant wheat to supply the mill. Crops stay ready until you collect them.',label:'Plant wheat',action:'start',key:'field'};
  }
 }
 const fish=Math.max(0,(o.cost.fish||0)-s.stock.fish-incoming(s,'fish'));
 if(fish){const a=next('fishing',Math.ceil(fish/2));if(a)return a;}
 const oil=Math.max(0,(o.cost.oil||0)-s.stock.oil-incoming(s,'oil'));
 if(oil){const press=next('press',Math.ceil(oil/2));if(press)return press;const olives=Math.max(0,Math.ceil(oil/2)*2-s.stock.olives-incoming(s,'olives'));if(olives){const a=next('olives',Math.ceil(olives/4));if(a)return a;}}
 return view('Your workshops are making the next shipment',s.speed===0?'The town is paused. Resume when you want production to continue.':'Goods in production are already counted. Check the queues or keep exploring; nothing expires.',s.speed===0?'Resume at 1×':'View the workshops',s.speed===0?'resume':'produce');
}

// Refit choices compete with expansion funds, but never gate basic trading.
export function recipeDuration(s,key){return RECIPES[key].duration*(['flax','cloth','furniture','sails'].includes(key)&&s.neighbourhood?.plots.some(p=>p?.type==='square')?.9:1)*(s.refits?.[RECIPES[key].station]==='speed'?.75:1);}
export function refitBlocker(s,station,mode){
 if(!Object.hasOwn(REFITS,station)||!['speed','queue'].includes(mode))return 'Choose a valid workshop setup.';
 if(!s.expansion||underConstruction(s,s.expansion))return 'Finish your first business before investing in refits.';
 if(station==='fishing'&&(!has(s,'fishing')||underConstruction(s,'fishing')))return 'Build and finish the fishing jetty first.';
 if(s.refits?.[station]===mode)return 'Already installed.';
 if(s.jobs.some(j=>RECIPES[j.key].station===station))return 'Finish active work and clear waiting batches before refitting.';
 if(!canAfford(s,REFITS[station][mode].cost))return 'Trade for the remaining coins and materials.';
 return '';
}
export function installRefit(s,station,mode){if(refitBlocker(s,station,mode))return false;spend(s,REFITS[station][mode].cost);s.refits[station]=mode;note(s,REFITS[station].name+' refit · '+REFITS[station][mode].name);return true;}

// A staged civic project uses the same goods, currency and simulation clock.
export function waterfrontBlocker(s){
 const w=s.waterfront;
 if(!s.charter||underConstruction(s,'charter'))return 'Finish the harbour charter first.';
 if(w.stage===3)return 'Waterfront restoration complete.';
 if(w.funded)return 'This stage is already funded.';
 const path=w.path||s.specialisation,p=PATHS[path];
 if(!p||!s.specialists.includes(p.station)||underConstruction(s,p.station))return 'Finish your chosen specialist workshop first.';
 if(!canAfford(s,WATERFRONT_STAGES[w.stage].cost))return 'Keep trading for the remaining coins and materials.';
 return '';
}
export function fundWaterfront(s,stage){
 const w=s.waterfront;if(stage!==w.stage||waterfrontBlocker(s))return false;
 spend(s,WATERFRONT_STAGES[w.stage].cost);w.path??=s.specialisation;w.funded=true;
 note(s,WATERFRONT_STAGES[w.stage].name+' funded · two supply deliveries needed');return true;
}
export function waterfrontSupplies(s){const w=s.waterfront;return WATERFRONT_STAGES[w.stage]?.[w.path||s.specialisation]||{};}
export function supplyWaterfront(s,stage,delivery){
 const w=s.waterfront,c=waterfrontSupplies(s),goal='waterfront:'+stage+':'+delivery;
 if(stage!==w.stage||delivery!==w.delivered||!w.funded||w.stage===3||w.left>0||w.delivered>=2||!canAfford(s,c,goal))return false;
 spend(s,c,goal);releaseReservation(s,goal);w.delivered++;if(w.delivered===2)w.left=WATERFRONT_SECONDS;
 note(s,WATERFRONT_STAGES[w.stage].name+' · supply '+w.delivered+'/2 delivered');return true;
}
export function chapterThree(s){
 const w=s.waterfront,p=WATERFRONT_STAGES[w.stage];
 if(w.stage===3)return {step:3,title:'A restored waterfront',description:'The sea wall, landing and trading arcade are open. Porto Grande now accepts bulk cargo for 22 timber and 12 stone per shipment.',label:'Visit the waterfront'};
 return {step:w.stage,title:p.name,description:w.left?'Your crew is finishing this stage. Construction follows the simulation clock.':w.funded?'Deliver the remaining supplies. '+w.delivered+' of 2 consignments received.':'Fund the next stage of the waterfront restoration, then supply two consignments from your town.',label:w.funded?'View restoration progress':'Plan the waterfront'};
}

// Reservations protect existing goods across production, trade and civic work.
export function goalCost(s,id){
 if(typeof id!=='string')return null;
 const parts=id.split(':');
 if(parts[0]==='ferryfund'&&parts.length===2&&parts[1]===String(s.ferry.stage)&&ferryEligible(s)&&s.ferry.stage<3&&!s.ferry.funded)return {...FERRY_STAGES[s.ferry.stage].cost};
 if(parts[0]==='ferry'&&parts.length===3&&parts[1]===String(s.ferry.stage)&&parts[2]===String(s.ferry.delivered)&&ferryEligible(s)&&s.ferry.stage<3&&s.ferry.funded)return {...FERRY_STAGES[s.ferry.stage].supplies};
 if(parts[0]==='ferryservice'&&parts.length===3&&/^[01]$/.test(parts[1])){const slot=Number(parts[1]),p=ferryPlan(s,slot,parts[2]);return p&&!ferryServiceAccessBlocker(s,slot,parts[2])?{...p.cost}:null;}

 if(parts[0]==='neighbourhood')return neighbourhoodGoalCost(s,parts);
 if(parts[0]==='circuit'&&parts.length===4&&/^[01]$/.test(parts[1])&&/^[123]$/.test(parts[2])&&/^[123]$/.test(parts[3])){const slot=Number(parts[1]),stops=[{route:'quarry',tier:Number(parts[2])},{route:'island',tier:Number(parts[3])}],p=circuitPlan(s,slot,stops);return p&&!fleetBoat(s,slot).trip&&!circuitAccessBlocker(s,slot,stops)?{...p.cost}:null;}
 if(parts[0]==='coastal'&&parts.length===3&&Object.hasOwn(COASTAL_PROJECTS,parts[1])&&parts[2]===String(s.fleet.development[parts[1]])&&!coastalProjectAccessBlocker(s,parts[1]))return {...COASTAL_PROJECTS[parts[1]][s.fleet.development[parts[1]]].cost};
 if(parts[0]==='commission'&&parts.length===3&&Object.hasOwn(COASTAL_PROJECTS,parts[1])&&parts[2]===String(s.fleet.commissions[parts[1]])&&s.fleet.development[parts[1]]===3)return {...commissionPlan(s,parts[1]).cost};
 if(parts[0]==='fleet'&&parts.length===4&&/^[01]$/.test(parts[1])&&/^[123]$/.test(parts[3])){const slot=Number(parts[1]),tier=Number(parts[3]),b=s.fleet.boats[slot],p=voyagePlan(s,slot,parts[2],tier);return b&&!b.trip&&p&&!voyageAccessBlocker(s,slot,parts[2],tier)?{...p.cost}:null;}
 if(parts[0]==='lighthouse'&&parts.length===2&&parts[1]===String(s.fleet.lighthouse.stage)&&!lighthouseAccessBlocker(s))return {...LIGHTHOUSE_STAGES[s.fleet.lighthouse.stage].cost};
 if(parts[0]==='trade'&&parts.length===2){const route=orders(s).find(o=>o.id===parts[1]);return route&&!route.locked?{...route.cost}:null;}
 if(parts[0]==='contract'&&parts.length===2&&s.contract?.id===parts[1])return {...CONTRACTS[parts[1]].cost};
 if(parts[0]==='waterfront'&&parts.length===3&&id===`waterfront:${s.waterfront.stage}:${s.waterfront.delivered}`&&s.waterfront.funded&&!s.waterfront.left&&s.waterfront.stage<3)return {...waterfrontSupplies(s)};
 if(parts[0]==='market'&&parts.length===2){const o=marketOrder(s,parts[1]);return o?{...o.cost}:null;}
 return null;
}
export function goalTitle(s,id){
 if(!goalCost(s,id))return null;
 const [kind,key,route,tier]=id.split(':');
 if(kind==='ferryfund')return FERRY_STAGES[s.ferry.stage].name+' funding';
 if(kind==='ferry')return FERRY_STAGES[s.ferry.stage].name+' · supply '+(s.ferry.delivered+1)+' of 3';
 if(kind==='ferryservice')return FERRY_SERVICES[route].name+' · berth '+(Number(key)+1);
 if(kind==='neighbourhood')return neighbourhoodGoalTitle(s,id.split(':'));
 if(kind==='circuit')return 'Coastal circuit · berth '+(Number(key)+1);
 if(kind==='coastal')return COASTAL_PROJECTS[key][s.fleet.development[key]].name;
 if(kind==='commission')return commissionPlan(s,key).name;
 if(kind==='fleet')return FLEET_ROUTES[route].tiers[Number(tier)-1].name+' · berth '+(Number(key)+1);
 if(kind==='lighthouse')return LIGHTHOUSE_STAGES[s.fleet.lighthouse.stage].name;
 return kind==='trade'?orders(s).find(o=>o.id===key).name:kind==='contract'?CONTRACTS[key].name:kind==='market'?MARKET_BUSINESSES[key].name+' standing order':WATERFRONT_STAGES[s.waterfront.stage].name+' supply '+(s.waterfront.delivered+1);
}
export function reserveFor(s,id,cost=undefined){
 const required=goalCost(s,id);if(!required)return false;
 if(cost!==undefined&&(!cost||typeof cost!=='object'||Array.isArray(cost)||Object.keys(cost).length!==Object.keys(required).length||Object.entries(required).some(([k,v])=>cost[k]!==v)))return false;
 const allocation={};for(const [item,n]of Object.entries(required)){const amount=Math.min(n,available(s,item,id));if(amount>0)allocation[item]=amount;}
 if(!Object.keys(allocation).length)return false;
 s.reservations[id]=allocation;return true;
}
export function releaseReservation(s,id){if(!Object.hasOwn(s.reservations||{},id))return false;delete s.reservations[id];return true;}
function pruneReservations(s,previousOrders=null){for(const [id,allocation]of Object.entries(s.reservations||{})){const cost=goalCost(s,id),old=previousOrders?.find(o=>'trade:'+o.id===id)?.cost;if(old&&(!cost||JSON.stringify(old)!==JSON.stringify(cost))){delete s.reservations[id];continue;}if(!cost){delete s.reservations[id];continue;}for(const item of Object.keys(allocation)){allocation[item]=Math.min(allocation[item],cost[item]||0);if(!allocation[item])delete allocation[item];}if(!Object.keys(allocation).length)delete s.reservations[id];}}
function validateReservations(s,raw,invalid){
 if(!raw||typeof raw!=='object'||Array.isArray(raw)||Object.keys(raw).length>20)invalid();
 for(const [id,c]of Object.entries(raw)){const cost=goalCost(s,id);if(!cost||!c||typeof c!=='object'||Array.isArray(c)||!Object.keys(c).length)invalid();for(const [item,n]of Object.entries(c)){if(!Object.hasOwn(cost,item)||!Number.isSafeInteger(n)||n<=0||n>cost[item])invalid();}s.reservations[id]={...c};}
 for(const item of ['coins',...Object.keys(s.stock)])if(available(s,item)<0)invalid();
}

// The market uses the ordinary town inventory and simulation clock.
export function marketReady(s){return !!s.market.access&&s.market.left===0;}
export function marketBusiness(s,type){return Object.hasOwn(MARKET_BUSINESSES,type)?s.market.businesses[type]||null:null;}
export function marketAccessBlocker(s){if(s.waterfront.stage!==3)return 'Finish restoring the waterfront first.';if(s.market.access)return s.market.left?'The market access road is being built.':'The market access road is open.';if(!canAfford(s,MARKET_ACCESS_COST))return 'Trade for the remaining coins and road materials.';return '';}
export function marketAccess(s){if(marketAccessBlocker(s))return false;spend(s,MARKET_ACCESS_COST);s.market.access=true;s.market.left=MARKET_SECONDS.access;note(s,'Market access road construction started');return true;}
export function marketBlocker(s,type,plot){
 if(!Object.hasOwn(MARKET_BUSINESSES,type))return 'Choose a valid market business.';
 if(!marketReady(s))return 'Finish the market access road first.';
 const definition=MARKET_BUSINESSES[type];
 if(marketBusiness(s,type))return 'This business is already built or under construction.';
 if(plot!==definition.plot)return plot===2?'This plot is reserved for a future business.':'Choose the marked plot for this business.';
 if(s.market.plots[plot])return 'This market plot is already occupied.';
 if(!has(s,definition.requires)||underConstruction(s,definition.requires))return 'Finish the '+(definition.requires==='fishing'?'fishing jetty':'olive workshop')+' first.';
 if(!canAfford(s,definition.cost))return 'Trade for the remaining coins and building materials.';
 return '';
}
export function buildMarketBusiness(s,type,plot){if(marketBlocker(s,type,plot))return false;spend(s,MARKET_BUSINESSES[type].cost);s.market.plots[plot]=type;s.market.businesses[type]={plot,left:MARKET_SECONDS.business,demand:3,replenish:0,auto:false,deliveries:0};note(s,MARKET_BUSINESSES[type].name+' construction started');return true;}
export function marketOrder(s,type){const b=marketBusiness(s,type),definition=MARKET_BUSINESSES[type];if(!marketReady(s)||!b||b.left)return null;return {id:type,name:definition.name+' standing order',cost:{...definition.order},coins:Math.round(definition.coins*(s.inland.courtyard&&!s.inland.courtyardLeft?1.25:1)),demand:b.demand};}
export function dispatchMarket(s,type){const o=marketOrder(s,type),b=marketBusiness(s,type),goal='market:'+type;if(!o||!b.demand||!canAfford(s,o.cost,goal))return false;spend(s,o.cost,goal);releaseReservation(s,goal);s.coins+=o.coins;if(b.demand===3)b.replenish=0;b.demand--;b.deliveries++;note(s,o.name+' supplied · +'+o.coins+' coins');return true;}
export function setMarketAuto(s,type,on){const b=marketBusiness(s,type);if(!b||typeof on!=='boolean')return false;b.auto=on;note(s,MARKET_BUSINESSES[type].name+' automatic supply '+(on?'enabled':'stopped'));return true;}
function tickMarket(s,elapsed){
 let changed=0;
 if(s.market.left>0){s.market.left=Math.max(0,s.market.left-elapsed);if(!s.market.left){note(s,'Market access road complete · the first two business plots are open');changed++;}}
 for(const [type,b]of Object.entries(s.market.businesses)){
  let budget=elapsed;if(b.left){budget=Math.max(0,elapsed-b.left);b.left=Math.max(0,b.left-elapsed);if(!b.left){note(s,MARKET_BUSINESSES[type].name+' construction complete');changed++;}else continue;}
  if(b.demand<3){b.replenish+=budget;while(b.replenish>=MARKET_SECONDS.demand&&b.demand<3){b.replenish-=MARKET_SECONDS.demand;b.demand++;changed++;}if(b.demand===3)b.replenish=0;}
  if(b.auto)while(dispatchMarket(s,type))changed++;
 }
 return changed;
}
function validateMarket(s,m,invalid){
 if(!m||typeof m!=='object'||Array.isArray(m)||typeof m.access!=='boolean'||!Number.isFinite(m.left)||m.left<0||m.left>MARKET_SECONDS.access||!Array.isArray(m.plots)||m.plots.length!==3||m.plots[2]!==null||!m.businesses||typeof m.businesses!=='object'||Array.isArray(m.businesses))invalid();
 if((m.access&&s.waterfront.stage!==3)||(!m.access&&(m.left||m.plots.some(Boolean)||Object.keys(m.businesses).length))||(m.left&&Object.keys(m.businesses).length))invalid();
 const out={access:m.access,left:m.left,plots:[...m.plots],businesses:{}};
 for(const [type,b]of Object.entries(m.businesses)){
  const definition=Object.hasOwn(MARKET_BUSINESSES,type)?MARKET_BUSINESSES[type]:null;
  if(!definition||!b||typeof b!=='object'||Array.isArray(b)||b.plot!==definition.plot||m.plots[b.plot]!==type||!has(s,definition.requires)||underConstruction(s,definition.requires)||!Number.isFinite(b.left)||b.left<0||b.left>MARKET_SECONDS.business||!Number.isSafeInteger(b.demand)||b.demand<0||b.demand>3||!Number.isFinite(b.replenish)||b.replenish<0||b.replenish>=MARKET_SECONDS.demand||typeof b.auto!=='boolean'||!Number.isSafeInteger(b.deliveries)||b.deliveries<0||b.deliveries>1e9||(b.demand===3&&b.replenish)||(b.left&&(b.demand!==3||b.replenish||b.deliveries)))invalid();
  out.businesses[type]={plot:b.plot,left:b.left,demand:b.demand,replenish:b.replenish,auto:b.auto,deliveries:b.deliveries};
 }
 for(let i=0;i<2;i++)if(m.plots[i]!==null&&(!Object.hasOwn(out.businesses,m.plots[i])||out.businesses[m.plots[i]].plot!==i))invalid();
 s.market=out;
}
export function marketGuide(s){
 if(inlandEligible(s))return inlandGuide(s);
 if(!s.market.access)return {step:0,title:'Open the market quarter',description:'Build an access road for 200 coins, 16 timber and 12 stone. Your restored waterfront makes room for two new businesses.',label:'Plan the market',target:'market'};
 if(s.market.left)return {step:1,title:'The market road is taking shape',description:'The road opens when the construction crew finishes. Keep ordinary trade moving for building materials.',label:'Watch the market',target:'market'};
 if(!Object.keys(s.market.businesses).length)return {step:2,title:'Choose your first market business',description:'Open the fishmonger or harbour kitchen. Each business costs 120 coins, 8 timber and 4 stone.',label:'Choose a market plot',target:'market'};
 return {step:3,title:'Supply your market quarter',description:'The fishmonger buys 4 fish for 60 coins. The kitchen prepares provisions from bread and oil, then buys 4 provisions for 90 coins. Demand recovers over time; automatic supply is optional.',label:'Visit the market',target:'market'};
}


export function inlandEligible(s){return marketReady(s)&&Object.values(s.market.businesses).some(b=>!b.left&&b.deliveries>=3);}
export function inlandReady(s){return !!s.inland.access&&!s.inland.left;}
export function inlandTradeReady(s){return inlandReady(s)&&!!s.inland.kiln&&!s.inland.kiln.left&&s.inland.terraces.some(t=>t&&!t.left);}
export function inlandAccessBlocker(s){if(!inlandEligible(s))return 'Supply one market business three times first.';if(s.inland.access)return s.inland.left?'The inland path is being built.':'The inland path is open.';if(!canAfford(s,INLAND_ACCESS_COST))return 'Trade for the remaining path materials and coins.';return '';}
export function inlandAccess(s){if(inlandAccessBlocker(s))return false;spend(s,INLAND_ACCESS_COST);s.inland.access=true;s.inland.left=INLAND_SECONDS.access;note(s,'Inland path construction started');return true;}
export function terraceBlocker(s,plot,type){if(![0,1].includes(plot)||!Object.hasOwn(TERRACE_TYPES,type))return 'Choose a terrace and its crop.';if(!inlandReady(s))return 'Finish the inland path first.';if(s.inland.terraces[plot])return 'This terrace is already planted or under construction.';if(!canAfford(s,TERRACE_TYPES[type].cost))return 'Trade for the remaining terrace materials and coins.';return '';}
export function buildTerrace(s,plot,type){if(terraceBlocker(s,plot,type))return false;spend(s,TERRACE_TYPES[type].cost);s.inland.terraces[plot]={type,left:INLAND_SECONDS.terrace};note(s,(plot===0?'Upper':'Lower')+' terrace · '+TERRACE_TYPES[type].name+' planting started');return true;}
export function kilnBlocker(s){if(!inlandReady(s))return 'Finish the inland path first.';if(s.inland.kiln)return s.inland.kiln.left?'The kiln and preserving room are being built.':'The kiln and preserving room are open.';if(!canAfford(s,KILN_COST))return 'Trade for the remaining kiln materials and coins.';return '';}
export function buildKiln(s){if(kilnBlocker(s))return false;spend(s,KILN_COST);s.inland.kiln={left:INLAND_SECONDS.kiln};note(s,'Kiln and preserving room construction started');return true;}
export function courtyardBlocker(s){if(!inlandTradeReady(s)||s.inland.shipments<1)return 'Send an inland preserves shipment first.';if(s.inland.courtyard)return s.inland.courtyardLeft?'The market courtyard is being tiled.':'The market courtyard is complete.';if(!canAfford(s,COURTYARD_COST))return 'Fire twelve tiles and gather the remaining courtyard funds and stone.';return '';}
export function buildCourtyard(s){if(courtyardBlocker(s))return false;spend(s,COURTYARD_COST);s.inland.courtyard=true;s.inland.courtyardLeft=INLAND_SECONDS.courtyard;note(s,'Market courtyard tiling started');return true;}
function tickInland(s,elapsed){let changed=0;const i=s.inland;const projects=[[i,'left','Inland path complete'],...i.terraces.filter(Boolean).map(t=>[t,'left',TERRACE_TYPES[t.type].name+' ready']),...(i.kiln?[[i.kiln,'left','Kiln and preserving room complete']]:[]),[i,'courtyardLeft','Market courtyard complete · local orders earn 25% more']];for(const [p,key,label]of projects)if(p[key]>0){p[key]=Math.max(0,p[key]-elapsed);if(!p[key]){note(s,label);changed++;}}return changed;}
export function inlandGuide(s){
 if(!s.inland.access)return {step:0,title:'Open the inland terraces',description:'Your market is established. Build the inland path for 240 coins, 16 timber and 16 stone.',label:'Plan the terraces',target:'inland'};
 if(s.inland.left)return {step:0,title:'The inland path is taking shape',description:'The crew is connecting two terraces and the clay bank to the harbour.',label:'Visit the terraces',target:'inland'};
 if(!s.inland.terraces.some(t=>t&&!t.left))return {step:1,title:'Choose your first crop',description:'Plant fruit trees or a kitchen garden on either terrace. Both crops can be preserved for trade.',label:'Choose a terrace',target:'inland'};
 if(!s.inland.kiln||s.inland.kiln.left)return {step:2,title:'Build the kiln and preserving room',description:'Gather clay locally, fire jars with timber, then preserve your harvest. Tiles compete for the same kiln.',label:'Plan the kiln',target:'inland'};
 if(!s.inland.shipments)return {step:3,title:'Send your first inland shipment',description:'Fill four jars of preserves and trade them with Valle Serena for coins, timber and stone.',label:'Plan inland trade',target:'inland'};
 if(!s.inland.courtyard||s.inland.courtyardLeft)return {step:4,title:'Tile the market courtyard',description:'Fire twelve tiles and improve the market. Completed paving raises local order earnings by 25%.',label:'Plan the courtyard',target:'inland'};
 return {step:5,title:'From terrace to market',description:'Your inland chain is established. Balance kiln time between jars and tiles, grow your second terrace and supply town or export orders.',label:'Manage the terraces',target:'inland'};
}
function validateInland(s,i,invalid){
 const obj=x=>x&&typeof x==='object'&&!Array.isArray(x),time=(x,max)=>Number.isFinite(x)&&x>=0&&x<=max;
 if(!obj(i)||typeof i.access!=='boolean'||!time(i.left,INLAND_SECONDS.access)||!Array.isArray(i.terraces)||i.terraces.length!==2||typeof i.courtyard!=='boolean'||!time(i.courtyardLeft,INLAND_SECONDS.courtyard)||!Number.isSafeInteger(i.shipments)||i.shipments<0||i.shipments>1e9)invalid();
 if((i.access&&!inlandEligible(s))||(!i.access&&(i.left||i.terraces.some(t=>t!==null)||i.kiln!==null||i.courtyard||i.courtyardLeft||i.shipments))||(i.left&&(i.terraces.some(t=>t!==null)||i.kiln!==null||i.courtyard||i.shipments)))invalid();
 const out={access:i.access,left:i.left,terraces:[],kiln:null,courtyard:i.courtyard,courtyardLeft:i.courtyardLeft,shipments:i.shipments};
 for(const t of i.terraces){if(t===null){out.terraces.push(null);continue;}if(!obj(t)||!Object.hasOwn(TERRACE_TYPES,t.type)||!time(t.left,INLAND_SECONDS.terrace))invalid();out.terraces.push({type:t.type,left:t.left});}
 if(i.kiln!==null){if(!obj(i.kiln)||!time(i.kiln.left,INLAND_SECONDS.kiln))invalid();out.kiln={left:i.kiln.left};}
 if((i.shipments&&(!out.kiln||out.kiln.left||!out.terraces.some(t=>t&&!t.left)))||(i.courtyard&&!i.shipments)||(!i.courtyard&&i.courtyardLeft))invalid();
 s.inland=out;
}


// Voyages capture cargo and rewards when launched. Future balance changes do not
// change paid voyages; settlement clears the trip before crediting its snapshot.
export function fleetEligible(s){return s.inland.shipments>=1;}
export function berthCount(s){return s.fleet.lighthouse.stage===3?2:1;}
function fleetBoat(s,slot){return Number.isInteger(slot)&&slot>=0&&slot<2?s.fleet.boats[slot]:null;}
export function boatBlocker(s,slot,type){
 if(![0,1].includes(slot)||!Object.hasOwn(FLEET_BOATS,type))return 'Choose a berth and boat type.';
 if(!fleetEligible(s))return 'Send your first inland preserves shipment first.';
 if(slot>=berthCount(s))return 'Complete the lighthouse to open the second berth.';
 if(slot===1&&!s.fleet.boats[0])return 'Buy a boat for the first berth first.';
 if(s.fleet.boats[slot])return 'This berth already has a boat.';
 if(!canAfford(s,FLEET_BOATS[type].cost))return 'Trade for the remaining boat funds and materials.';
 return '';
}
export function buyBoat(s,slot,type){if(boatBlocker(s,slot,type))return false;spend(s,FLEET_BOATS[type].cost);s.fleet.boats[slot]={type,upgrade:null,sails:false,trip:null,repeat:null};note(s,FLEET_BOATS[type].name+' moored at berth '+(slot+1));return true;}
export function voyagePlan(s,slot,route,tier=1){
 const b=fleetBoat(s,slot),r=Object.hasOwn(FLEET_ROUTES,route)?FLEET_ROUTES[route]:null,d=r&&Number.isInteger(tier)?r.tiers[tier-1]:null;
 if(!b||!d)return null;
 const boat=FLEET_BOATS[b.type],up=b.upgrade?FLEET_UPGRADES[b.upgrade]:null,scale=boat.cargoScale*(up?.cargoScale||1),scaled=cost=>Object.fromEntries(Object.entries(cost).map(([k,n])=>[k,Math.ceil(n*scale)]));
 return {route,tier,name:d.name,destination:r.name,cost:scaled(d.cost),reward:coastalReward(s,route,scaled(d.reward)),duration:Math.ceil(d.duration*boat.timeScale*(up?.timeScale||1)*(s.fleet.development.island>=2?.85:1)*(b.sails?.9:1)),goal:`fleet:${slot}:${route}:${tier}`};
}
function voyageAccessBlocker(s,slot,route,tier=1){
 const b=fleetBoat(s,slot),p=voyagePlan(s,slot,route,tier);
 if(!fleetEligible(s)||!b||!p||slot>=berthCount(s))return 'Choose an owned boat and a valid route.';
 const d=FLEET_ROUTES[route].tiers[tier-1];
 if(s.fleet.visits[route]<d.visits)return 'Complete '+d.visits+' visits to '+FLEET_ROUTES[route].name+' first.';
 if(d.lighthouse&&s.fleet.lighthouse.stage!==3)return 'Complete the lighthouse to navigate the outer route.';
 return '';
}
export function voyageBlocker(s,slot,route,tier=1){const blocked=voyageAccessBlocker(s,slot,route,tier);if(blocked)return blocked;const b=fleetBoat(s,slot),p=voyagePlan(s,slot,route,tier);if(b.trip)return 'This boat is already at sea.';if(!canAfford(s,p.cost,p.goal))return 'Prepare the missing cargo or release supplies reserved for other orders.';return '';}
function releaseBerthReservations(s,slot){for(const id of Object.keys(s.reservations))if(id.startsWith(`fleet:${slot}:`)||id.startsWith(`circuit:${slot}:`)||id.startsWith(`ferryservice:${slot}:`)||id===`neighbourhood:sails:${slot}`)releaseReservation(s,id);}
export function startVoyage(s,slot,route,tier=1,quiet=false){
 if(voyageBlocker(s,slot,route,tier))return false;
 const b=fleetBoat(s,slot),p=voyagePlan(s,slot,route,tier);
 spend(s,p.cost,p.goal);releaseBerthReservations(s,slot);
 b.trip={route,tier,cargo:{...p.cost},reward:{...p.reward},duration:p.duration,left:p.duration};
 if(!quiet)note(s,FLEET_BOATS[b.type].name+' departed for '+p.destination);
 return true;
}
export function cancelVoyage(s,slot){const b=fleetBoat(s,slot);if(!b?.trip)return false;const cargo=b.trip.cargo;b.trip=null;b.repeat=null;add(s,cargo);note(s,'Voyage recalled · cargo returned; repeat sailings stopped');return true;}
export function repeatVoyageBlocker(s,slot,route,tier=1){const b=fleetBoat(s,slot);if(!b)return 'Choose an owned boat.';if(route===null)return '';const blocked=voyageAccessBlocker(s,slot,route,tier);if(blocked)return blocked;if(s.fleet.visits[route]<3)return 'Complete three visits to this destination before enabling repeat sailings.';return '';}
export function setRepeatVoyage(s,slot,route,tier=1){if(repeatVoyageBlocker(s,slot,route,tier))return false;const b=fleetBoat(s,slot),old=b.repeat;if(old&&(route!==old.route||tier!==old.tier))releaseReservation(s,`fleet:${slot}:${old.route}:${old.tier}`);b.repeat=route===null?null:{route,tier};note(s,route===null?'Repeat sailings stopped':'Repeat sailings set · '+FLEET_ROUTES[route].name);return true;}
export function boatUpgradeBlocker(s,slot,mode){const b=fleetBoat(s,slot);if(!b||!Object.hasOwn(FLEET_UPGRADES,mode))return 'Choose an owned boat and a setup.';if(b.trip)return 'Wait for the boat to return before changing its setup.';if(s.fleet.visits.quarry+s.fleet.visits.island<3)return 'Complete three voyages before upgrading a boat.';if(b.upgrade===mode)return 'This setup is already installed.';if(!canAfford(s,FLEET_UPGRADES[mode].cost))return 'Trade for the remaining upgrade funds and materials.';return '';}
export function installBoatUpgrade(s,slot,mode){if(boatUpgradeBlocker(s,slot,mode))return false;spend(s,FLEET_UPGRADES[mode].cost);releaseBerthReservations(s,slot);fleetBoat(s,slot).upgrade=mode;note(s,FLEET_UPGRADES[mode].name+' installed at berth '+(slot+1));return true;}
function lighthouseAccessBlocker(s){
 const l=s.fleet.lighthouse,d=LIGHTHOUSE_STAGES[l.stage];
 if(!fleetEligible(s)||!s.fleet.boats[0])return 'Establish your fleet first.';
 if(!d)return 'The lighthouse is complete.';
 if(l.left)return 'The lighthouse crew is still working.';
 const missing=Object.entries(d.requires).filter(([route,n])=>s.fleet.visits[route]<n);
 if(missing.length)return 'Complete '+missing.map(([route,n])=>n+' visit'+(n===1?'':'s')+' to '+FLEET_ROUTES[route].name).join(' and ')+' first.';
 return '';
}
export function lighthouseBlocker(s){const blocked=lighthouseAccessBlocker(s);if(blocked)return blocked;const l=s.fleet.lighthouse;if(!canAfford(s,LIGHTHOUSE_STAGES[l.stage].cost,'lighthouse:'+l.stage))return 'Gather the lighthouse funding and supplies shown below.';return '';}
export function buildLighthouseStage(s,expectedStage){const l=s.fleet.lighthouse;if(expectedStage!==l.stage||lighthouseBlocker(s))return false;const stage=LIGHTHOUSE_STAGES[l.stage],goal='lighthouse:'+l.stage;spend(s,stage.cost,goal);releaseReservation(s,goal);l.left=LIGHTHOUSE_SECONDS;note(s,stage.name+' construction started');return true;}
function tickFleet(s,elapsed){
 let changed=0;const l=s.fleet.lighthouse;
 if(l.left>0){l.left=Math.max(0,l.left-elapsed);if(!l.left){note(s,LIGHTHOUSE_STAGES[l.stage].name+' complete');l.stage++;changed++;}}
 for(let slot=0;slot<2;slot++){
  const b=s.fleet.boats[slot];if(!b)continue;
  if(b.trip){b.trip.left=Math.max(0,b.trip.left-elapsed);if(!b.trip.left){const trip=b.trip;b.trip=null;s.coins+=trip.reward.coins||0;add(s,Object.fromEntries(Object.entries(trip.reward).filter(([k])=>k!=='coins')));if(trip.ferry){s.ferry.runs++;note(s,FERRY_SERVICES[trip.route].name+' returned · fares received');}else{for(const stop of trip.stops||[{route:trip.route}])s.fleet.visits[stop.route]++;note(s,trip.stops?'Coastal circuit returned · both destinations supplied':FLEET_ROUTES[trip.route].name+' voyage returned · '+s.fleet.visits[trip.route]+' completed visit'+(s.fleet.visits[trip.route]===1?'':'s'));}changed++;}}
  // At most one settlement per berth per tick. A new repeat trip begins now;
  // elapsed time from the previous trip is never spent again on this voyage.
  if(!b.trip&&b.repeat&&startVoyage(s,slot,b.repeat.route,b.repeat.tier,true))changed++;
 }
 return changed;
}
export function fleetGuide(s){
 if(!s.fleet.boats[0])return {step:0,title:'Establish your coastal fleet',description:'Your preserves can supply longer voyages. Buy a quick cutter or a larger coaster for the first berth.',label:'Choose your first boat',target:'fleet'};
 if(!s.fleet.visits.quarry)return {step:1,title:'Reach Pietra Cove',description:'Supply the quarry crews and bring back materials for the lighthouse foundation.',label:'Plan a quarry voyage',target:'fleet'};
 if(s.fleet.lighthouse.stage===0)return {step:2,title:'Lay the lighthouse foundation',description:'Invest in the headland while your boat builds coastal relationships.',label:'Plan the lighthouse',target:'fleet'};
 if(s.fleet.visits.quarry<3||s.fleet.visits.island<3)return {step:3,title:'Build two coastal partnerships',description:'Complete three visits to each destination. Partnerships improve rewards and unlock optional repeat sailings.',label:'Plan your next voyage',target:'fleet'};
 if(s.fleet.lighthouse.stage<3)return {step:4,title:'Light the coast',description:'Finish the keeper’s house and lantern with kiln tiles and supplies. The completed lighthouse opens outer routes and a second berth.',label:'Continue the lighthouse',target:'fleet'};
 if(!s.fleet.boats[1])return {step:5,title:'Open a second working berth',description:'Add another boat and choose complementary roles. Both berths can sail independently.',label:'Choose your second boat',target:'fleet'};
 if(s.fleet.development.quarry<3||s.fleet.development.island<3)return {step:6,title:'Build the coastal settlements',description:'Supply three local projects at each destination. New landings, a crane and pilots improve the whole fleet.',label:'Develop the destinations',target:'fleet'};
 if(!s.fleet.commissions.quarry||!s.fleet.commissions.island)return {step:7,title:'Supply the coastal workshops',description:'The masons and chandlery now offer rotating commissions. Balance local supplies against your next circuit.',label:'Review local commissions',target:'fleet'};
 return {step:8,title:'A working coastal network',description:'Mix contracts to fit your holds, run two-berth circuits and supply rotating commissions at both settlements.',label:'Manage the destinations',target:'fleet'};
}
function validateFleet(s,f,invalid,version){
 const obj=x=>x&&typeof x==='object'&&!Array.isArray(x),count=x=>Number.isSafeInteger(x)&&x>=0&&x<=1e9;
 if(!obj(f)||!Array.isArray(f.boats)||f.boats.length!==2||!obj(f.visits)||Object.keys(f.visits).length!==2||!count(f.visits.quarry)||!count(f.visits.island)||!obj(f.lighthouse))invalid();
 const l=f.lighthouse;if(!Number.isInteger(l.stage)||l.stage<0||l.stage>3||!Number.isFinite(l.left)||l.left<0||l.left>LIGHTHOUSE_SECONDS||(l.stage===3&&l.left))invalid();
 const out={development:{quarry:0,island:0},commissions:{quarry:0,island:0},boats:[null,null],visits:{quarry:f.visits.quarry,island:f.visits.island},lighthouse:{stage:l.stage,left:l.left}};
 if(version>=10){
  if(!obj(f.development)||!obj(f.commissions)||Object.keys(f.development).length!==2||Object.keys(f.commissions).length!==2)invalid();
  for(const route of ['quarry','island']){const stage=f.development[route],n=f.commissions[route];if(!Number.isInteger(stage)||stage<0||stage>3||!count(n)||(n&&stage!==3)||(stage&&(!f.boats[0]||f.visits[route]<COASTAL_PROJECTS[route][stage-1].visits)))invalid();out.development[route]=stage;out.commissions[route]=n;}
 }
 if(!fleetEligible(s)&&(f.boats.some(b=>b!==null)||f.visits.quarry||f.visits.island||l.stage||l.left))invalid();
 if(!f.boats[0]&&(f.boats[1]!==null||f.visits.quarry||f.visits.island||l.stage||l.left))invalid();
 if(l.stage||l.left){const requirement=LIGHTHOUSE_STAGES[l.left?l.stage:l.stage-1].requires;if(Object.entries(requirement).some(([route,n])=>f.visits[route]<n))invalid();}
 const packet=(value,allowed)=>{if(!obj(value)||!Object.keys(value).length)invalid();const result={};for(const[k,n]of Object.entries(value)){if(!allowed.includes(k)||!Number.isSafeInteger(n)||n<=0||n>1000000)invalid();result[k]=n;}return result;};
 for(let slot=0;slot<2;slot++){
  const b=f.boats[slot];if(b===null)continue;
  if(!obj(b)||!Object.hasOwn(FLEET_BOATS,b.type)||![null,'speed','cargo'].includes(b.upgrade)||(slot===1&&l.stage!==3)||(b.upgrade&&f.visits.quarry+f.visits.island<3))invalid();
  if(version>=11&&typeof b.sails!=='boolean')invalid();const result={type:b.type,upgrade:b.upgrade,sails:version>=11?b.sails:false,trip:null,repeat:null};
  const validRoute=(route,tier)=>Object.hasOwn(FLEET_ROUTES,route)&&Number.isInteger(tier)&&tier>=1&&tier<=3&&f.visits[route]>=FLEET_ROUTES[route].tiers[tier-1].visits&&(!FLEET_ROUTES[route].tiers[tier-1].lighthouse||l.stage===3);
  if(b.trip!==null){const t=b.trip;if(!obj(t)||!validRoute(t.route,t.tier)||!Number.isFinite(t.duration)||t.duration<=0||t.duration>86400||!Number.isFinite(t.left)||t.left<=0||t.left>t.duration)invalid();result.trip={route:t.route,tier:t.tier,cargo:packet(t.cargo,Object.keys(s.stock)),reward:packet(t.reward,['coins','wood','stone']),duration:t.duration,left:t.left};if(t.stops!==undefined){if(version<10||!Array.isArray(t.stops)||t.stops.length!==2||t.stops[0]?.route!=='quarry'||t.stops[1]?.route!=='island'||t.route!==t.stops[0].route||t.tier!==t.stops[0].tier||t.stops.some(stop=>!obj(stop)||!validRoute(stop.route,stop.tier)))invalid();result.trip.stops=t.stops.map(stop=>({route:stop.route,tier:stop.tier}));}if(t.ferry!==undefined){if(version<12||t.ferry!==true||t.tier!==1||t.stops!==undefined)invalid();result.trip.ferry=true;}}

  if(b.repeat!==null){const r=b.repeat;if(!obj(r)||!validRoute(r.route,r.tier)||f.visits[r.route]<3)invalid();result.repeat={route:r.route,tier:r.tier};}
  out.boats[slot]=result;
 }
 s.fleet=out;
}

function coastalReward(s,route,reward){const out={...reward};if(route==='quarry'&&s.fleet.development.quarry>=1)for(const k of ['wood','stone'])if(out[k])out[k]=Math.ceil(out[k]*1.2);if(route==='island'&&s.fleet.development.island>=1&&out.coins)out.coins=Math.ceil(out.coins*1.15);return out;}
export function boatCargoCapacity(s,slot){const b=fleetBoat(s,slot);return b?Math.floor((20+(s.fleet.development.quarry>=2?6:0))*FLEET_BOATS[b.type].cargoScale*(b.upgrade==='cargo'?1.5:1)):0;}
function validCircuitStops(stops){return Array.isArray(stops)&&stops.length===2&&stops[0]?.route==='quarry'&&stops[1]?.route==='island'&&stops.every(p=>Number.isInteger(p.tier)&&p.tier>=1&&p.tier<=3);}
export function circuitPlan(s,slot,stops){
 const b=fleetBoat(s,slot);if(!b||!validCircuitStops(stops))return null;
 const cost={},reward={},boat=FLEET_BOATS[b.type];let duration=0;
 for(const stop of stops){const d=FLEET_ROUTES[stop.route].tiers[stop.tier-1];for(const[k,n]of Object.entries(d.cost))cost[k]=(cost[k]||0)+Math.ceil(n*boat.cargoScale);const returns=coastalReward(s,stop.route,Object.fromEntries(Object.entries(d.reward).map(([k,n])=>[k,Math.ceil(n*boat.cargoScale)])));for(const[k,n]of Object.entries(returns))reward[k]=(reward[k]||0)+n;duration+=d.duration*boat.timeScale;}
 duration=Math.ceil(duration*.8*(b.upgrade==='speed'?.75:1)*(s.fleet.development.island>=2?.85:1)*(b.sails?.9:1));
 return {name:'Pietra Cove → Isola dei Pescatori',cost,reward,duration,used:Object.values(cost).reduce((a,b)=>a+b,0),capacity:boatCargoCapacity(s,slot),stops:stops.map(p=>({...p})),goal:`circuit:${slot}:${stops[0].tier}:${stops[1].tier}`};
}
function circuitAccessBlocker(s,slot,stops){const p=circuitPlan(s,slot,stops);if(!p)return 'Choose two valid coastal contracts.';for(const stop of stops){const reason=voyageAccessBlocker(s,slot,stop.route,stop.tier);if(reason)return reason;}if(p.used>p.capacity)return `This circuit needs ${p.used} cargo spaces; your hold has ${p.capacity}. Choose smaller contracts, expand the hold or build the quarry crane.`;return '';}
export function circuitBlocker(s,slot,stops){const reason=circuitAccessBlocker(s,slot,stops);if(reason)return reason;if(fleetBoat(s,slot).trip)return 'This boat is already at sea.';const p=circuitPlan(s,slot,stops);return canAfford(s,p.cost,p.goal)?'':'Prepare the missing cargo or release supplies reserved for other orders.';}
export function startCircuit(s,slot,stops){if(circuitBlocker(s,slot,stops))return false;const p=circuitPlan(s,slot,stops),b=fleetBoat(s,slot);spend(s,p.cost,p.goal);releaseBerthReservations(s,slot);b.repeat=null;b.trip={route:stops[0].route,tier:stops[0].tier,cargo:{...p.cost},reward:{...p.reward},duration:p.duration,left:p.duration,stops:p.stops};note(s,'Coastal circuit departed · both contracts loaded; single-route repeats stopped');return true;}
function coastalProjectAccessBlocker(s,route){if(!Object.hasOwn(COASTAL_PROJECTS,route))return 'Choose a coastal settlement.';const stage=s.fleet.development[route],d=COASTAL_PROJECTS[route][stage];if(!fleetEligible(s)||!s.fleet.boats[0])return 'Establish your coastal fleet first.';if(!d)return 'This settlement is fully developed.';if(s.fleet.visits[route]<d.visits)return `Complete ${d.visits} visits to ${FLEET_ROUTES[route].name} first.`;return '';}
export function coastalProjectBlocker(s,route){const reason=coastalProjectAccessBlocker(s,route);if(reason)return reason;const stage=s.fleet.development[route];return canAfford(s,COASTAL_PROJECTS[route][stage].cost,`coastal:${route}:${stage}`)?'':'Gather the project funding and supplies.';}
export function fundCoastalProject(s,route,expectedStage){if(!Object.hasOwn(COASTAL_PROJECTS,route)||expectedStage!==s.fleet.development[route]||coastalProjectBlocker(s,route))return false;const d=COASTAL_PROJECTS[route][expectedStage],goal=`coastal:${route}:${expectedStage}`;spend(s,d.cost,goal);releaseReservation(s,goal);s.fleet.development[route]++;note(s,d.name+' complete · '+FLEET_ROUTES[route].name);return true;}
export function commissionPlan(s,route){if(!Object.hasOwn(COASTAL_COMMISSIONS,route))return null;const count=s.fleet.commissions[route],d=COASTAL_COMMISSIONS[route][count%COASTAL_COMMISSIONS[route].length];return {...d,cost:{...d.cost},reward:{...d.reward},count,goal:`commission:${route}:${count}`};}
export function commissionBlocker(s,route){const p=commissionPlan(s,route);if(!p)return 'Choose a coastal settlement.';if(s.fleet.development[route]!==3)return 'Complete all three settlement projects to open commissions.';return canAfford(s,p.cost,p.goal)?'':'Prepare the commission supplies or release other reservations.';}
export function completeCommission(s,route,expectedCount){const p=commissionPlan(s,route);if(!p||p.count!==expectedCount||commissionBlocker(s,route))return false;spend(s,p.cost,p.goal);releaseReservation(s,p.goal);s.coins+=p.reward.coins||0;add(s,Object.fromEntries(Object.entries(p.reward).filter(([k])=>k!=='coins')));s.fleet.commissions[route]++;note(s,p.name+' fulfilled · next local commission available');return true;}

export function neighbourhoodEligible(s){return s.fleet.visits.quarry>=3||s.fleet.visits.island>=3;}
export function neighbourhoodReady(s){return !!s.neighbourhood?.access;}
export function neighbourhoodCapacity(s){return 2+(s.neighbourhood?.plots||[]).reduce((n,p)=>n+(p?.type==='home'?1+p.level:0),0);}
export function neighbourhoodAccessBlocker(s){if(s.neighbourhood.access)return 'The neighbourhood is already open.';if(!neighbourhoodEligible(s))return 'Establish a coastal partnership with three visits to either destination.';return canAfford(s,NEIGHBOURHOOD_ACCESS_COST,'neighbourhood:access')?'':'Gather the access funding and materials.';}
export function openNeighbourhood(s){if(neighbourhoodAccessBlocker(s))return false;spend(s,NEIGHBOURHOOD_ACCESS_COST,'neighbourhood:access');releaseReservation(s,'neighbourhood:access');s.neighbourhood.access=true;note(s,'The new neighbourhood is open · choose your first plots');return true;}
function validNeighbourhoodSlot(index){return Number.isInteger(index)&&index>=0&&index<6;}
function plotAccessBlocker(s,index){if(!neighbourhoodReady(s))return 'Open the neighbourhood first.';if(!validNeighbourhoodSlot(index))return 'Choose one of the six plots.';if(s.neighbourhood.plots[index])return 'This plot is already owned.';return '';}
export function plotBlocker(s,index){const reason=plotAccessBlocker(s,index);if(reason)return reason;return canAfford(s,PLOT_COST,`neighbourhood:plot:${index}`)?'':'Gather the plot funding and materials.';}
export function buyNeighbourhoodPlot(s,index){if(plotBlocker(s,index))return false;const goal=`neighbourhood:plot:${index}`;spend(s,PLOT_COST,goal);releaseReservation(s,goal);s.neighbourhood.plots[index]={type:null,level:0};note(s,'Neighbourhood plot '+(index+1)+' purchased');return true;}
function neighbourhoodBuildAccessBlocker(s,index,type){if(!neighbourhoodReady(s)||!validNeighbourhoodSlot(index)||!s.neighbourhood.plots[index])return 'Buy this plot first.';if(!Object.hasOwn(NEIGHBOURHOOD_BUILDINGS,type))return 'Choose a neighbourhood building.';if(s.neighbourhood.plots[index].type)return 'Move or remove the current building first.';if(s.neighbourhood.plots.filter(p=>p?.type===type).length>=(type==='home'?2:1))return type==='home'?'Two homes are already built.':'This neighbourhood already has that building.';return '';}
export function neighbourhoodBuildBlocker(s,index,type){const reason=neighbourhoodBuildAccessBlocker(s,index,type);if(reason)return reason;return canAfford(s,NEIGHBOURHOOD_BUILDINGS[type].cost,`neighbourhood:build:${index}:${type}`)?'':'Gather the building funding and materials.';}
export function buildNeighbourhood(s,index,type){if(neighbourhoodBuildBlocker(s,index,type))return false;const goal=`neighbourhood:build:${index}:${type}`;spend(s,NEIGHBOURHOOD_BUILDINGS[type].cost,goal);s.neighbourhood.plots[index]={type,level:0};pruneReservations(s);note(s,NEIGHBOURHOOD_BUILDINGS[type].name+' opened');return true;}
export function neighbourhoodMoveBlocker(s,from,to){if(!neighbourhoodReady(s)||!validNeighbourhoodSlot(from)||!validNeighbourhoodSlot(to)||from===to)return 'Choose two different purchased plots.';if(!s.neighbourhood.plots[from]?.type||!s.neighbourhood.plots[to])return 'Move a building to another purchased plot.';return '';}
export function moveNeighbourhoodBuilding(s,from,to){if(neighbourhoodMoveBlocker(s,from,to))return false;[s.neighbourhood.plots[from],s.neighbourhood.plots[to]]=[s.neighbourhood.plots[to],s.neighbourhood.plots[from]];for(const id of Object.keys(s.reservations))if(id.startsWith('neighbourhood:home:')||id.startsWith('neighbourhood:build:'))releaseReservation(s,id);note(s,'Neighbourhood layout updated · production continues');return true;}
function homeUpgradeAccessBlocker(s,index){if(!neighbourhoodReady(s)||!validNeighbourhoodSlot(index)||s.neighbourhood.plots[index]?.type!=='home')return 'Choose a town house.';if(s.neighbourhood.plots[index].level)return 'This home is already furnished.';return '';}
export function homeUpgradeBlocker(s,index){const reason=homeUpgradeAccessBlocker(s,index);if(reason)return reason;return canAfford(s,HOME_UPGRADE_COST,`neighbourhood:home:${index}`)?'':'Prepare furniture, cloth and the furnishing fee.';}
export function upgradeNeighbourhoodHome(s,index){if(homeUpgradeBlocker(s,index))return false;const goal=`neighbourhood:home:${index}`;spend(s,HOME_UPGRADE_COST,goal);releaseReservation(s,goal);s.neighbourhood.plots[index].level=1;note(s,'Town house furnished · another neighbourhood queue slot');return true;}
export function neighbourhoodRemoveBlocker(s,index){if(!neighbourhoodReady(s)||!validNeighbourhoodSlot(index)||!s.neighbourhood.plots[index]?.type)return 'Choose a built plot.';const p=s.neighbourhood.plots[index];if(s.jobs.some(j=>RECIPES[j.key].station===p.type))return 'Finish or cancel this workshop’s queued work first.';if(p.type==='home'){const limit=neighbourhoodCapacity(s)-1-p.level;for(const st of ['flaxgarden','carpenter','weaver','sailmaker'])if(s.jobs.filter(j=>RECIPES[j.key].station===st).length>limit)return 'Finish or cancel extra neighbourhood work before removing this home.';}return '';}
export function removeNeighbourhoodBuilding(s,index){if(neighbourhoodRemoveBlocker(s,index))return false;const p=s.neighbourhood.plots[index],d=NEIGHBOURHOOD_BUILDINGS[p.type];s.coins+=Math.floor(d.cost.coins/2);if(d.recipe)delete s.targets[d.recipe];s.neighbourhood.plots[index]={type:null,level:0};pruneReservations(s);note(s,d.name+' removed · half the building coin cost recovered; plot retained');return true;}
function sailRefitAccessBlocker(s,slot){const b=fleetBoat(s,slot);if(!neighbourhoodReady(s)||!b||!s.neighbourhood.plots.some(p=>p?.type==='sailmaker'))return 'Open the sail loft and choose an owned boat.';if(b.sails)return 'Permanent sail refit already installed.';if(b.trip)return 'Wait for the boat to return before refitting its sails.';return '';}
export function sailRefitBlocker(s,slot){const reason=sailRefitAccessBlocker(s,slot);if(reason)return reason;return canAfford(s,SAIL_REFIT_COST,`neighbourhood:sails:${slot}`)?'':'Prepare sails, timber and the refit fee.';}
export function refitBoatSails(s,slot){if(sailRefitBlocker(s,slot))return false;const goal=`neighbourhood:sails:${slot}`;spend(s,SAIL_REFIT_COST,goal);releaseReservation(s,goal);fleetBoat(s,slot).sails=true;note(s,'Permanent sail refit installed · future voyages 10% faster');return true;}
export function neighbourhoodOrder(s){const id=s.neighbourhood.orders,d=NEIGHBOURHOOD_ORDERS[id%NEIGHBOURHOOD_ORDERS.length];return {...d,cost:{...d.cost},reward:{...d.reward},id,goal:`neighbourhood:order:${id}`};}
export function neighbourhoodOrderBlocker(s){if(!neighbourhoodReady(s))return 'Open the neighbourhood first.';const p=neighbourhoodOrder(s);return canAfford(s,p.cost,p.goal)?'':'Prepare the local order supplies or release other reservations.';}
export function completeNeighbourhoodOrder(s,expectedCount){const p=neighbourhoodOrder(s);if(expectedCount!==p.id||neighbourhoodOrderBlocker(s))return false;spend(s,p.cost,p.goal);releaseReservation(s,p.goal);s.coins+=p.reward.coins||0;add(s,Object.fromEntries(Object.entries(p.reward).filter(([k])=>k!=='coins')));s.neighbourhood.orders++;note(s,p.name+' delivered · next local order ready');return true;}
function neighbourhoodGoalCost(s,parts){const [,kind,index,type]=parts,slot=Number(index);if(kind==='access'&&parts.length===2&&!s.neighbourhood.access&&neighbourhoodEligible(s))return {...NEIGHBOURHOOD_ACCESS_COST};if(kind==='plot'&&parts.length===3&&String(slot)===index&&!plotAccessBlocker(s,slot))return {...PLOT_COST};if(kind==='build'&&parts.length===4&&String(slot)===index&&!neighbourhoodBuildAccessBlocker(s,slot,type))return {...NEIGHBOURHOOD_BUILDINGS[type].cost};if(kind==='home'&&parts.length===3&&String(slot)===index&&!homeUpgradeAccessBlocker(s,slot))return {...HOME_UPGRADE_COST};if(kind==='sails'&&parts.length===3&&String(slot)===index&&!sailRefitAccessBlocker(s,slot))return {...SAIL_REFIT_COST};if(kind==='order'&&parts.length===3&&neighbourhoodReady(s)&&index===String(s.neighbourhood.orders))return {...neighbourhoodOrder(s).cost};return null;}
function neighbourhoodGoalTitle(s,parts){const [,kind,index,type]=parts;return kind==='access'?'Open the neighbourhood':kind==='plot'?'Buy neighbourhood plot '+(Number(index)+1):kind==='build'?NEIGHBOURHOOD_BUILDINGS[type].name+' · plot '+(Number(index)+1):kind==='home'?'Furnish town house · plot '+(Number(index)+1):kind==='sails'?'Sail refit · berth '+(Number(index)+1):neighbourhoodOrder(s).name;}
export function neighbourhoodGuide(s){if(!s.neighbourhood.access)return {step:0,title:'Build a neighbourhood',description:'Your first coastal partnership opens six town plots. Choose a layout for homes, crafts and a public square.',label:'Open the neighbourhood',target:'neighbourhood'};if(!s.neighbourhood.plots.some(p=>p?.type==='carpenter'))return {step:1,title:'Make room for crafts',description:'Buy a plot and build a carpenter. Timber becomes furniture for homes and local orders.',label:'Choose a plot',target:'neighbourhood'};if(!s.neighbourhood.plots.some(p=>p?.type==='weaver')||!s.neighbourhood.plots.some(p=>p?.type==='flaxgarden'))return {step:2,title:'Grow and weave',description:'Build a flax garden and weaving studio. Cloth supplies homes and the sail loft.',label:'Plan the neighbourhood',target:'neighbourhood'};if(!s.neighbourhood.plots.some(p=>p?.type==='home'&&p.level))return {step:3,title:'Furnish your first home',description:'Invest furniture and cloth in a home to enlarge workshop queues.',label:'Furnish a home',target:'neighbourhood'};if(!s.fleet.boats.some(b=>b?.sails))return {step:4,title:'Refit a working boat',description:'Stitch sails at the sail loft and fit them to an idle boat for permanently faster voyages.',label:'Plan a sail refit',target:'neighbourhood'};return {step:5,title:'A neighbourhood at work',description:'Balance local orders, housing and fleet refits. Move buildings freely or redevelop a plot to change direction.',label:'Manage the neighbourhood',target:'neighbourhood'};}
function validateNeighbourhood(s,n,invalid){const obj=x=>x&&typeof x==='object'&&!Array.isArray(x);if(!obj(n)||typeof n.access!=='boolean'||!Array.isArray(n.plots)||n.plots.length!==6||!Number.isSafeInteger(n.orders)||n.orders<0||n.orders>1e9)invalid();if(n.access&&!neighbourhoodEligible(s))invalid();const counts={};const plots=n.plots.map(p=>{if(p===null)return null;if(!obj(p)||!n.access||!(p.type===null||Object.hasOwn(NEIGHBOURHOOD_BUILDINGS,p.type))||![0,1].includes(p.level)||(p.type!=='home'&&p.level))invalid();if(p.type){counts[p.type]=(counts[p.type]||0)+1;if(counts[p.type]>(p.type==='home'?2:1))invalid();}return {type:p.type,level:p.level};});if(!n.access&&(n.orders||s.fleet.boats.some(b=>b?.sails)))invalid();s.neighbourhood={access:n.access,plots,orders:n.orders};}

export function ferryEligible(s){return neighbourhoodReady(s)&&s.fleet.lighthouse.stage===3;}
export function ferryFundingBlocker(s){if(!ferryEligible(s))return 'Open the neighbourhood and complete the lighthouse first.';if(s.ferry.stage===3)return 'The passenger terminal is complete.';if(s.ferry.funded)return 'This stage is funded. Deliver its three supply batches.';return canAfford(s,FERRY_STAGES[s.ferry.stage].cost,'ferryfund:'+s.ferry.stage)?'':'Earn the remaining terminal funding.';}
export function fundFerryStage(s,expectedStage){if(expectedStage!==s.ferry.stage||ferryFundingBlocker(s))return false;const goal='ferryfund:'+s.ferry.stage;spend(s,FERRY_STAGES[s.ferry.stage].cost,goal);releaseReservation(s,goal);s.ferry.funded=true;note(s,FERRY_STAGES[s.ferry.stage].name+' funded · three supply batches needed');return true;}
export function ferryDeliveryBlocker(s){if(!ferryEligible(s))return 'Open the neighbourhood and complete the lighthouse first.';if(s.ferry.stage===3)return 'The passenger terminal is complete.';if(!s.ferry.funded)return 'Fund this terminal stage first.';const goal=`ferry:${s.ferry.stage}:${s.ferry.delivered}`;return canAfford(s,FERRY_STAGES[s.ferry.stage].supplies,goal)?'':'Prepare the supply batch shown below or release other reservations.';}
export function deliverFerrySupplies(s,expectedStage,expectedDelivered){if(expectedStage!==s.ferry.stage||expectedDelivered!==s.ferry.delivered||ferryDeliveryBlocker(s))return false;const stage=s.ferry.stage,d=FERRY_STAGES[stage],goal=`ferry:${stage}:${s.ferry.delivered}`;spend(s,d.supplies,goal);releaseReservation(s,goal);s.ferry.delivered++;if(s.ferry.delivered===3){s.ferry.stage++;s.ferry.funded=false;s.ferry.delivered=0;note(s,d.name+' complete'+(s.ferry.stage===3?' · passenger services now available':''));}else note(s,d.name+' · '+s.ferry.delivered+' of 3 supply batches delivered');return true;}
export function ferryPlan(s,slot,destination){const b=fleetBoat(s,slot),d=Object.hasOwn(FERRY_SERVICES,destination)?FERRY_SERVICES[destination]:null;if(!b||!d)return null;const boat=FLEET_BOATS[b.type],up=b.upgrade?FLEET_UPGRADES[b.upgrade]:null,scale=boat.cargoScale*(up?.cargoScale||1),scaled=packet=>Object.fromEntries(Object.entries(packet).map(([k,n])=>[k,Math.ceil(n*scale)]));return {route:destination,tier:1,name:d.name,destination:FLEET_ROUTES[destination].name,cost:scaled(d.cost),reward:scaled(d.reward),duration:Math.ceil(d.duration*boat.timeScale*(up?.timeScale||1)*(s.fleet.development.island>=2?.85:1)*(b.sails?.9:1)),goal:`ferryservice:${slot}:${destination}`};}
function ferryServiceAccessBlocker(s,slot,destination){const b=fleetBoat(s,slot);if(!ferryEligible(s)||s.ferry.stage!==3)return 'Complete all three passenger terminal stages first.';if(!b||slot>=berthCount(s)||!Object.hasOwn(FERRY_SERVICES,destination))return 'Choose an owned boat and a passenger destination.';if(b.trip)return 'This boat is already at sea.';return '';}
export function ferryServiceBlocker(s,slot,destination){const reason=ferryServiceAccessBlocker(s,slot,destination);if(reason)return reason;const p=ferryPlan(s,slot,destination);return canAfford(s,p.cost,p.goal)?'':'Prepare the passenger provisions or release other reservations.';}
export function startFerryService(s,slot,destination){if(ferryServiceBlocker(s,slot,destination))return false;const b=fleetBoat(s,slot),p=ferryPlan(s,slot,destination);spend(s,p.cost,p.goal);releaseBerthReservations(s,slot);b.repeat=null;b.trip={route:destination,tier:1,ferry:true,cargo:{...p.cost},reward:{...p.reward},duration:p.duration,left:p.duration};note(s,p.name+' departed · cargo repeat trips stopped');return true;}
export function ferryGuide(s){if(s.ferry.stage<3){const d=FERRY_STAGES[s.ferry.stage];return {step:s.ferry.stage,title:d.name,description:s.ferry.funded?`Deliver supply batch ${s.ferry.delivered+1} of 3. Delivered goods are saved permanently for this stage.`:'Fund the stage, then deliver three batches from your existing workshops.',label:s.ferry.funded?'Deliver terminal supplies':'Plan the passenger terminal',target:'ferry'};}if(!s.ferry.runs)return {step:3,title:'Your first passenger service',description:'Choose an idle boat and provision a passenger run. Fares offer an alternative to cargo trade.',label:'Plan a ferry service',target:'ferry'};return {step:4,title:'A working passenger terminal',description:'Balance food supplies and boat time between passengers, cargo and coastal projects.',label:'Manage passenger services',target:'ferry'};}
function validateFerry(s,f,invalid){if(!f||typeof f!=='object'||Array.isArray(f)||!Number.isInteger(f.stage)||f.stage<0||f.stage>3||typeof f.funded!=='boolean'||!Number.isInteger(f.delivered)||f.delivered<0||f.delivered>2||!Number.isSafeInteger(f.runs)||f.runs<0||f.runs>1e9)invalid();if((!f.funded&&f.delivered)||(f.stage===3&&f.funded)||(f.runs&&f.stage!==3)||((f.stage||f.funded||f.delivered||f.runs)&&!ferryEligible(s))||s.fleet.boats.some(b=>b?.trip?.ferry&&f.stage!==3))invalid();s.ferry={stage:f.stage,funded:f.funded,delivered:f.delivered,runs:f.runs};}
