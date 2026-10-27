import {ITEMS,RECIPES,BUILD_COST,SECOND_COST,PIER_COST,WORKSHOP_COST,PATHS,CONTRACTS,CHARTER_COST,REFITS,WATERFRONT_SECONDS,WATERFRONT_STAGES,MARKET_ACCESS_COST,MARKET_SECONDS,MARKET_BUSINESSES} from './catalog.js';
export * from './catalog.js';
export function fresh(){return {version:7,reservations:{},market:{access:false,left:0,plots:[null,null,null],businesses:{}},waterfront:{path:null,stage:0,funded:false,delivered:0,left:0},refits:{},specialisation:null,specialists:[],contract:null,contractsDone:[],contractDeliveries:0,charter:false,construction:[],coins:80,stock:{wheat:0,flour:0,bread:0,olives:0,oil:0,fish:0,wood:24,stone:16,planks:0,boatparts:0,grapes:0,wine:0,provisions:0},jobs:[],ripe:true,speed:1,seconds:0,deliveries:0,expansion:null,businesses:[],pier:false,workshopUpgrade:false,targets:{},selectedOrder:'local',onboarded:false,harvests:0,milled:0,baked:0,log:['Your harbour is ready. Start with the wheat field.']};}
export function has(s,type){return s.businesses.includes(type);}
export function reserved(s,item){return Object.values(s.reservations||{}).reduce((sum,c)=>sum+(c[item]||0),0);}
export function available(s,item,goalId=null){return (item==='coins'?s.coins:s.stock[item]||0)-reserved(s,item)+(s.reservations?.[goalId]?.[item]||0);}
export function canAfford(s,c,goalId=null){return Object.entries(c).every(([k,v])=>Number.isFinite(v)&&v>=0&&available(s,k,goalId)>=v);}
function spend(s,c,goalId=null){for(const[k,v]of Object.entries(c)){if(k==='coins')s.coins-=v;else s.stock[k]-=v;const own=s.reservations?.[goalId];if(own?.[k]){own[k]=Math.max(0,own[k]-v);if(!own[k])delete own[k];}}if(goalId&&s.reservations?.[goalId]&&!Object.keys(s.reservations[goalId]).length)delete s.reservations[goalId];}
function add(s,c){for(const[k,v]of Object.entries(c))s.stock[k]+=v;}
function note(s,t){s.log.unshift(t);s.log=s.log.slice(0,5);}
export function capacity(s,station){return station==='field'?1:(s.workshopUpgrade?4:2)+(s.refits?.[station]==='queue'?2:0);}
export const CONSTRUCTION_SECONDS=8;
export function underConstruction(s,type){return s.construction.find(p=>p.type===type)||null;}
export function unlocked(s,key){if(!Object.hasOwn(RECIPES,key))return false;const station=RECIPES[key].station;if(station==='kitchen')return marketReady(s)&&!!marketBusiness(s,'kitchen')&&!marketBusiness(s,'kitchen').left;if(['boatyard','estate'].includes(station))return s.specialists.includes(station)&&!underConstruction(s,station)&&(s.charter||PATHS[s.specialisation]?.station===station);return key==='fishing'?has(s,'fishing')&&!underConstruction(s,'fishing'):['olives','press'].includes(key)?has(s,'olive')&&!underConstruction(s,'olive'):true;}
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
function automate(s){if(!s.pier)return;for(const key of Object.keys(RECIPES)){const target=s.targets[key]||0;if(!target||!unlocked(s,key))continue;const r=RECIPES[key],item=Object.keys(r.output)[0],incoming=s.jobs.reduce((n,j)=>n+(j.key===key?r.output[item]:0),0);if(key==='field'&&s.ripe&&s.stock.wheat<target)harvest(s);if(s.stock[item]+incoming<target)start(s,key,true);}}
export function tick(s,dt,onEvent){if(!s.speed||!Number.isFinite(dt)||dt<=0)return;const elapsed=Math.min(dt,60)*s.speed;s.seconds+=elapsed;let completed=0;const w=s.waterfront;if(w.left>0){w.left=Math.max(0,w.left-elapsed);if(w.left===0){note(s,WATERFRONT_STAGES[w.stage].name+' restored');w.stage++;w.funded=false;w.delivered=0;completed++;}}for(const project of [...s.construction]){project.left-=elapsed;if(project.left<=0){s.construction.splice(s.construction.indexOf(project),1);completed++;note(s,({olive:'Olive workshop',fishing:'Fishing jetty',pier:'Quay extension',storehouse:'Storehouse improvement',boatyard:'Boatyard',estate:'Vineyard and cellar',charter:'Harbour charter office'})[project.type]+' construction complete');}}const stations=[...new Set(s.jobs.map(j=>RECIPES[j.key].station))];for(const station of stations){let budget=elapsed;while(budget>0){const i=s.jobs.findIndex(j=>RECIPES[j.key].station===station);if(i<0)break;const j=s.jobs[i],r=RECIPES[j.key];if(j.left>budget){j.left-=budget;break;}budget-=j.left;s.jobs.splice(i,1);completed++;if(j.key==='field')s.ripe=true;else add(s,r.output);if(j.key==='mill')s.milled++;if(j.key==='bakery')s.baked++;if(j.key!=='field')onEvent?.({type:'produced',key:j.key});note(s,j.key==='field'?'Wheat is ready to harvest.':r.name+' complete · '+Object.entries(r.output).map(([k,v])=>'+'+v+' '+ITEMS[k].toLowerCase()).join(', '));}}completed+=tickMarket(s,elapsed);automate(s);return completed;}
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
 ];
}
export function order(s,id=s.selectedOrder){return withCharter(s,orders(s).find(o=>o.id===id)||orders(s)[0]);}
export function selectOrder(s,id){if(!orders(s).some(o=>o.id===id))return false;s.selectedOrder=id;return true;}
export function dispatch(s){const o=order(s),goal='trade:'+o.id;if(o.locked||!canAfford(s,o.cost,goal))return false;spend(s,o.cost,goal);releaseReservation(s,goal);s.coins+=o.coins;s.stock.wood+=o.wood;s.stock.stone+=o.stone;s.deliveries++;note(s,'Delivered to '+o.name+' · +'+o.coins+' coins, +'+o.wood+' timber, +'+o.stone+' stone');pruneReservations(s);return true;}
export function buildCost(s){return s.expansion?SECOND_COST:BUILD_COST;}
export function build(s,type){const previousOrders=orders(s),cost=buildCost(s);if(!['fishing','olive'].includes(type)||has(s,type)||s.deliveries<1||(s.expansion&&!s.pier)||!canAfford(s,cost))return false;spend(s,cost);s.businesses.push(type);s.expansion??=type;s.construction.push({type,left:CONSTRUCTION_SECONDS});note(s,(type==='fishing'?'Fishing jetty':'Olive workshop')+' construction started');pruneReservations(s,previousOrders);return true;}
export function upgrade(s){const previousOrders=orders(s);if(!s.expansion||s.deliveries<2||s.pier||!canAfford(s,PIER_COST))return false;spend(s,PIER_COST);s.pier=true;s.construction.push({type:'pier',left:CONSTRUCTION_SECONDS});note(s,'Quay extended · choose routes and automate production');pruneReservations(s,previousOrders);return true;}
export function upgradeWorkshops(s){if(!s.pier||s.workshopUpgrade||!canAfford(s,WORKSHOP_COST))return false;spend(s,WORKSHOP_COST);s.workshopUpgrade=true;s.construction.push({type:'storehouse',left:CONSTRUCTION_SECONDS});note(s,'Storehouse organised · four queue slots per workshop');return true;}
export function milestone(s){if(!s.harvests)return 0;if(!s.milled)return 1;if(!s.baked)return 2;if(!s.deliveries)return 3;if(!s.expansion)return 4;if(!s.pier)return 5;return 6;}
export function parseSave(raw){
 if(typeof raw!=='string'||raw.length>100000)throw Error('This is not a valid harbour save.');
 let x;try{x=JSON.parse(raw);}catch{throw Error('This file is not a readable harbour save.');}
 const invalid=()=>{throw Error('This save contains incomplete or invalid game data.');};
 if(!x||![1,2,3,4,5,6,7].includes(x.version)||!x.stock||typeof x.stock!=='object'||!Array.isArray(x.jobs)||!Array.isArray(x.log))invalid();
 const s=fresh();
 for(const k of ['coins','deliveries','harvests','milled','baked']){if(!Number.isSafeInteger(x[k])||x[k]<0||x[k]>1e9)invalid();s[k]=x[k];}
 if(!Number.isFinite(x.seconds)||x.seconds<0||x.seconds>1e10)invalid();s.seconds=x.seconds;
 for(const k of Object.keys(s.stock)){if(x.version<7&&k==='provisions')continue;if(x.version<4&&['planks','boatparts','grapes','wine'].includes(k))continue;if(!Number.isSafeInteger(x.stock[k])||x.stock[k]<0||x.stock[k]>1e9)invalid();s.stock[k]=x.stock[k];}
 for(const k of ['ripe','pier']){if(typeof x[k]!=='boolean')invalid();s[k]=x[k];}
 if(![0,1,3].includes(x.speed)||!['fishing','olive',null].includes(x.expansion))invalid();s.speed=x.speed;s.expansion=x.expansion;
 if(x.version===1){s.businesses=x.expansion?[x.expansion]:[];s.onboarded=true;}
 else{if(!Array.isArray(x.businesses)||x.businesses.length>2||new Set(x.businesses).size!==x.businesses.length||x.businesses.some(b=>!['fishing','olive'].includes(b)))invalid();s.businesses=[...x.businesses];if(typeof x.workshopUpgrade!=='boolean'||typeof x.onboarded!=='boolean')invalid();s.workshopUpgrade=x.workshopUpgrade;s.onboarded=x.onboarded;if(!['local','materials','specialist',...(x.version>=6?['waterfront']:[])].includes(x.selectedOrder))invalid();s.selectedOrder=x.selectedOrder;if(!x.targets||typeof x.targets!=='object'||Array.isArray(x.targets))invalid();for(const[k,v]of Object.entries(x.targets)){if(!Object.hasOwn(RECIPES,k)||![0,6,12].includes(v))invalid();s.targets[k]=v;}}
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
 if(x.jobs.length>[...new Set(Object.values(RECIPES).map(r=>r.station))].reduce((total,st)=>total+capacity(s,st),0))invalid();
 if(x.version>=7)validateMarket(s,x.market,invalid);
 for(const j of x.jobs){if(!j||!Object.hasOwn(RECIPES,j.key)||!unlocked(s,j.key)||!Number.isFinite(j.left)||j.left<=0||j.left>recipeDuration(s,j.key))invalid();s.jobs.push({key:j.key,left:j.left});}
 for(const station of ['field','mill','bakery','fishing','olive','boatyard','estate','kitchen'])if(s.jobs.filter(j=>RECIPES[j.key].station===station).length>capacity(s,station))invalid();
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
 if(s.charter&&!underConstruction(s,'charter')){const c=s.waterfront.stage===3?marketGuide(s):chapterThree(s);return view(c.title,c.description,c.label,c.target||'waterfront');}
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
export function recipeDuration(s,key){return RECIPES[key].duration*(s.refits?.[RECIPES[key].station]==='speed'?.75:1);}
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
 if(parts[0]==='trade'&&parts.length===2){const route=orders(s).find(o=>o.id===parts[1]);return route&&!route.locked?{...route.cost}:null;}
 if(parts[0]==='contract'&&parts.length===2&&s.contract?.id===parts[1])return {...CONTRACTS[parts[1]].cost};
 if(parts[0]==='waterfront'&&parts.length===3&&id===`waterfront:${s.waterfront.stage}:${s.waterfront.delivered}`&&s.waterfront.funded&&!s.waterfront.left&&s.waterfront.stage<3)return {...waterfrontSupplies(s)};
 if(parts[0]==='market'&&parts.length===2){const o=marketOrder(s,parts[1]);return o?{...o.cost}:null;}
 return null;
}
export function goalTitle(s,id){
 if(!goalCost(s,id))return null;
 const [kind,key]=id.split(':');
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
export function marketOrder(s,type){const b=marketBusiness(s,type),definition=MARKET_BUSINESSES[type];if(!marketReady(s)||!b||b.left)return null;return {id:type,name:definition.name+' standing order',cost:{...definition.order},coins:definition.coins,demand:b.demand};}
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
 if(!s.market.access)return {step:0,title:'Open the market quarter',description:'Build an access road for 200 coins, 16 timber and 12 stone. Your restored waterfront makes room for two new businesses.',label:'Plan the market',target:'market'};
 if(s.market.left)return {step:1,title:'The market road is taking shape',description:'The road opens when the construction crew finishes. Keep ordinary trade moving for building materials.',label:'Watch the market',target:'market'};
 if(!Object.keys(s.market.businesses).length)return {step:2,title:'Choose your first market business',description:'Open the fishmonger or harbour kitchen. Each business costs 120 coins, 8 timber and 4 stone.',label:'Choose a market plot',target:'market'};
 return {step:3,title:'Supply your market quarter',description:'The fishmonger buys 4 fish for 60 coins. The kitchen prepares provisions from bread and oil, then buys 4 provisions for 90 coins. Demand recovers over time; automatic supply is optional.',label:'Visit the market',target:'market'};
}
