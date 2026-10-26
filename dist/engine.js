export const ITEMS={wheat:'Wheat',flour:'Flour',bread:'Bread',olives:'Olives',oil:'Olive oil',fish:'Fish',wood:'Timber',stone:'Stone',planks:'Planks',boatparts:'Boat fittings',grapes:'Grapes',wine:'Wine'};
export const RECIPES={
 field:{name:'Grow wheat',station:'field',cost:{},output:{wheat:6},duration:12},
 mill:{name:'Mill flour',station:'mill',cost:{wheat:2},output:{flour:2},duration:8},
 bakery:{name:'Bake bread',station:'bakery',cost:{flour:2},output:{bread:2},duration:12},
 fishing:{name:'Send fishing boat',station:'fishing',cost:{},output:{fish:2},duration:14},
 olives:{name:'Gather olives',station:'olive',cost:{},output:{olives:4},duration:10},
 press:{name:'Press olive oil',station:'olive',cost:{olives:2},output:{oil:2},duration:12},
 saw:{name:'Saw planks',station:'boatyard',cost:{wood:2},output:{planks:4},duration:12},
 fittings:{name:'Make boat fittings',station:'boatyard',cost:{planks:4},output:{boatparts:2},duration:20},
 grapes:{name:'Harvest grapes',station:'estate',cost:{},output:{grapes:4},duration:18},
 wine:{name:'Make wine',station:'estate',cost:{grapes:4},output:{wine:2},duration:24}
};
export const BUILD_COST={coins:80,wood:12,stone:4},SECOND_COST={coins:110,wood:10,stone:4},PIER_COST={coins:140,wood:10,stone:8},WORKSHOP_COST={coins:120,wood:8,stone:4};
export function fresh(){return {version:4,specialisation:null,specialists:[],contract:null,contractsDone:[],contractDeliveries:0,charter:false,construction:[],coins:80,stock:{wheat:0,flour:0,bread:0,olives:0,oil:0,fish:0,wood:24,stone:16,planks:0,boatparts:0,grapes:0,wine:0},jobs:[],ripe:true,speed:1,seconds:0,deliveries:0,expansion:null,businesses:[],pier:false,workshopUpgrade:false,targets:{},selectedOrder:'local',onboarded:false,harvests:0,milled:0,baked:0,log:['Your harbour is ready. Start with the wheat field.']};}
export function has(s,type){return s.businesses.includes(type);}
export function canAfford(s,c){return Object.entries(c).every(([k,v])=>Number.isFinite(v)&&v>=0&&(k==='coins'?s.coins:s.stock[k])>=v);}
function spend(s,c){for(const[k,v]of Object.entries(c))if(k==='coins')s.coins-=v;else s.stock[k]-=v;}
function add(s,c){for(const[k,v]of Object.entries(c))s.stock[k]+=v;}
function note(s,t){s.log.unshift(t);s.log=s.log.slice(0,5);}
export function capacity(s,station){return station==='field'?1:s.workshopUpgrade?4:2;}
export const CONSTRUCTION_SECONDS=8;
export function underConstruction(s,type){return s.construction.find(p=>p.type===type)||null;}
export function unlocked(s,key){if(!Object.hasOwn(RECIPES,key))return false;const station=RECIPES[key].station;if(['boatyard','estate'].includes(station))return s.specialists.includes(station)&&!underConstruction(s,station)&&(s.charter||PATHS[s.specialisation]?.station===station);return key==='fishing'?has(s,'fishing')&&!underConstruction(s,'fishing'):['olives','press'].includes(key)?has(s,'olive')&&!underConstruction(s,'olive'):true;}
export function harvest(s){if(!s.ripe)return false;s.ripe=false;s.stock.wheat+=6;s.harvests++;note(s,'Harvest collected · +6 wheat');return true;}
export function start(s,key,quiet=false){if(!unlocked(s,key))return false;const r=RECIPES[key];if(key==='field'&&s.ripe)return false;if(s.jobs.filter(j=>RECIPES[j.key].station===r.station).length>=capacity(s,r.station)||!canAfford(s,r.cost))return false;spend(s,r.cost);s.jobs.push({key,left:r.duration});if(!quiet)note(s,r.name+' queued');return true;}
export function canCancel(s,index){const j=s.jobs[index];return !!j&&s.jobs.slice(0,index).some(x=>RECIPES[x.key].station===RECIPES[j.key].station);}
export function cancel(s,index){if(!Number.isInteger(index)||!canCancel(s,index))return false;const [j]=s.jobs.splice(index,1);add(s,RECIPES[j.key].cost);note(s,'Queued batch cancelled · ingredients returned');return true;}
export function prioritize(s,index){if(!Number.isInteger(index)||!canCancel(s,index))return false;const station=RECIPES[s.jobs[index].key].station,first=s.jobs.findIndex(j=>RECIPES[j.key].station===station);if(index===first+1)return false;const [j]=s.jobs.splice(index,1);s.jobs.splice(first+1,0,j);note(s,'Batch moved to the front of its waiting queue');return true;}
export function setTarget(s,key,target){if(!s.pier||!unlocked(s,key)||![0,6,12].includes(target))return false;s.targets[key]=target;note(s,target?RECIPES[key].name+' · maintain '+target+' in stock':'Automatic '+RECIPES[key].name.toLowerCase()+' stopped');return true;}
function automate(s){if(!s.pier)return;for(const key of Object.keys(RECIPES)){const target=s.targets[key]||0;if(!target||!unlocked(s,key))continue;const r=RECIPES[key],item=Object.keys(r.output)[0],incoming=s.jobs.reduce((n,j)=>n+(j.key===key?r.output[item]:0),0);if(key==='field'&&s.ripe&&s.stock.wheat<target)harvest(s);if(s.stock[item]+incoming<target)start(s,key,true);}}
export function tick(s,dt,onEvent){if(!s.speed||!Number.isFinite(dt)||dt<=0)return;const elapsed=Math.min(dt,60)*s.speed;s.seconds+=elapsed;let completed=0;for(const project of [...s.construction]){project.left-=elapsed;if(project.left<=0){s.construction.splice(s.construction.indexOf(project),1);completed++;note(s,({olive:'Olive workshop',fishing:'Fishing jetty',pier:'Quay extension',storehouse:'Storehouse improvement',boatyard:'Boatyard',estate:'Vineyard and cellar',charter:'Harbour charter office'})[project.type]+' construction complete');}}const stations=[...new Set(s.jobs.map(j=>RECIPES[j.key].station))];for(const station of stations){let budget=elapsed;while(budget>0){const i=s.jobs.findIndex(j=>RECIPES[j.key].station===station);if(i<0)break;const j=s.jobs[i],r=RECIPES[j.key];if(j.left>budget){j.left-=budget;break;}budget-=j.left;s.jobs.splice(i,1);completed++;if(j.key==='field')s.ripe=true;else add(s,r.output);if(j.key==='mill')s.milled++;if(j.key==='bakery')s.baked++;if(j.key!=='field')onEvent?.({type:'produced',key:j.key});note(s,j.key==='field'?'Wheat is ready to harvest.':r.name+' complete · '+Object.entries(r.output).map(([k,v])=>'+'+v+' '+ITEMS[k].toLowerCase()).join(', '));}}automate(s);return completed;}
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
 ];
}
export function order(s,id=s.selectedOrder){return withCharter(s,orders(s).find(o=>o.id===id)||orders(s)[0]);}
export function selectOrder(s,id){if(!orders(s).some(o=>o.id===id))return false;s.selectedOrder=id;return true;}
export function dispatch(s){const o=order(s);if(o.locked||!canAfford(s,o.cost))return false;spend(s,o.cost);s.coins+=o.coins;s.stock.wood+=o.wood;s.stock.stone+=o.stone;s.deliveries++;note(s,'Delivered to '+o.name+' · +'+o.coins+' coins, +'+o.wood+' timber, +'+o.stone+' stone');return true;}
export function buildCost(s){return s.expansion?SECOND_COST:BUILD_COST;}
export function build(s,type){const cost=buildCost(s);if(!['fishing','olive'].includes(type)||has(s,type)||s.deliveries<1||(s.expansion&&!s.pier)||!canAfford(s,cost))return false;spend(s,cost);s.businesses.push(type);s.expansion??=type;s.construction.push({type,left:CONSTRUCTION_SECONDS});note(s,(type==='fishing'?'Fishing jetty':'Olive workshop')+' construction started');return true;}
export function upgrade(s){if(!s.expansion||s.deliveries<2||s.pier||!canAfford(s,PIER_COST))return false;spend(s,PIER_COST);s.pier=true;s.construction.push({type:'pier',left:CONSTRUCTION_SECONDS});note(s,'Quay extended · choose routes and automate production');return true;}
export function upgradeWorkshops(s){if(!s.pier||s.workshopUpgrade||!canAfford(s,WORKSHOP_COST))return false;spend(s,WORKSHOP_COST);s.workshopUpgrade=true;s.construction.push({type:'storehouse',left:CONSTRUCTION_SECONDS});note(s,'Storehouse organised · four queue slots per workshop');return true;}
export function milestone(s){if(!s.harvests)return 0;if(!s.milled)return 1;if(!s.baked)return 2;if(!s.deliveries)return 3;if(!s.expansion)return 4;if(!s.pier)return 5;return 6;}
export function parseSave(raw){
 if(typeof raw!=='string'||raw.length>100000)throw Error('This is not a valid harbour save.');
 let x;try{x=JSON.parse(raw);}catch{throw Error('This file is not a readable harbour save.');}
 const invalid=()=>{throw Error('This save contains incomplete or invalid game data.');};
 if(!x||![1,2,3,4].includes(x.version)||!x.stock||typeof x.stock!=='object'||!Array.isArray(x.jobs)||!Array.isArray(x.log))invalid();
 const s=fresh();
 for(const k of ['coins','deliveries','harvests','milled','baked']){if(!Number.isSafeInteger(x[k])||x[k]<0||x[k]>1e9)invalid();s[k]=x[k];}
 if(!Number.isFinite(x.seconds)||x.seconds<0||x.seconds>1e10)invalid();s.seconds=x.seconds;
 for(const k of Object.keys(s.stock)){if(x.version<4&&['planks','boatparts','grapes','wine'].includes(k))continue;if(!Number.isSafeInteger(x.stock[k])||x.stock[k]<0||x.stock[k]>1e9)invalid();s.stock[k]=x.stock[k];}
 for(const k of ['ripe','pier']){if(typeof x[k]!=='boolean')invalid();s[k]=x[k];}
 if(![0,1,3].includes(x.speed)||!['fishing','olive',null].includes(x.expansion))invalid();s.speed=x.speed;s.expansion=x.expansion;
 if(x.version===1){s.businesses=x.expansion?[x.expansion]:[];s.onboarded=true;}
 else{if(!Array.isArray(x.businesses)||x.businesses.length>2||new Set(x.businesses).size!==x.businesses.length||x.businesses.some(b=>!['fishing','olive'].includes(b)))invalid();s.businesses=[...x.businesses];if(typeof x.workshopUpgrade!=='boolean'||typeof x.onboarded!=='boolean')invalid();s.workshopUpgrade=x.workshopUpgrade;s.onboarded=x.onboarded;if(!['local','materials','specialist'].includes(x.selectedOrder))invalid();s.selectedOrder=x.selectedOrder;if(!x.targets||typeof x.targets!=='object'||Array.isArray(x.targets))invalid();for(const[k,v]of Object.entries(x.targets)){if(!Object.hasOwn(RECIPES,k)||![0,6,12].includes(v))invalid();s.targets[k]=v;}}
 if((s.expansion&&!has(s,s.expansion))||(!s.expansion&&s.businesses.length)||(s.businesses.length===2&&!s.pier)||(s.pier&&(!s.expansion||s.deliveries<2))||(s.workshopUpgrade&&!s.pier)||(!s.pier&&Object.values(s.targets).some(Boolean)))invalid();
 if(x.version===4){
  if(![null,'maritime','estate'].includes(x.specialisation)||!Array.isArray(x.specialists)||x.specialists.length>2||new Set(x.specialists).size!==x.specialists.length||x.specialists.some(k=>!['boatyard','estate'].includes(k)))invalid();
  s.specialisation=x.specialisation;s.specialists=[...x.specialists];
  if(!Array.isArray(x.contractsDone)||x.contractsDone.length>4||new Set(x.contractsDone).size!==x.contractsDone.length||x.contractsDone.some(k=>!Object.hasOwn(CONTRACTS,k)))invalid();s.contractsDone=[...x.contractsDone];
  if(!Number.isSafeInteger(x.contractDeliveries)||x.contractDeliveries<0||x.contractDeliveries>1e9||typeof x.charter!=='boolean')invalid();s.contractDeliveries=x.contractDeliveries;s.charter=x.charter;
  if((s.specialisation&&!s.pier)||(s.specialists.length&&!s.specialisation)||(s.charter&&s.contractsDone.length<2)||s.specialists.some(st=>!has(s,st==='boatyard'?'fishing':'olive')))invalid();
  if(x.contract!==null){const c=x.contract,definition=c&&Object.hasOwn(CONTRACTS,c.id)?CONTRACTS[c.id]:null;if(!definition||!Number.isSafeInteger(c.shipped)||c.shipped<0||c.shipped>=definition.shipments||definition.path!==s.specialisation||!s.specialists.includes(PATHS[definition.path].station))invalid();s.contract={id:c.id,shipped:c.shipped};}
 }
 if(x.version>=3){if(!Array.isArray(x.construction)||x.construction.length>7)invalid();const seen=new Set();for(const p of x.construction){if(!p||!['olive','fishing','pier','storehouse','boatyard','estate','charter'].includes(p.type)||seen.has(p.type)||!Number.isFinite(p.left)||p.left<=0||p.left>CONSTRUCTION_SECONDS)invalid();if((['olive','fishing'].includes(p.type)&&!has(s,p.type))||(p.type==='pier'&&!s.pier)||(p.type==='storehouse'&&!s.workshopUpgrade)||(['boatyard','estate'].includes(p.type)&&!s.specialists.includes(p.type))||(p.type==='charter'&&!s.charter))invalid();seen.add(p.type);s.construction.push({type:p.type,left:p.left});}}
 if(x.jobs.length>20)invalid();
 for(const j of x.jobs){if(!j||!Object.hasOwn(RECIPES,j.key)||!unlocked(s,j.key)||!Number.isFinite(j.left)||j.left<=0||j.left>RECIPES[j.key].duration)invalid();s.jobs.push({key:j.key,left:j.left});}
 for(const station of ['field','mill','bakery','fishing','olive','boatyard','estate'])if(s.jobs.filter(j=>RECIPES[j.key].station===station).length>capacity(s,station))invalid();
 if(s.ripe&&s.jobs.some(j=>j.key==='field'))invalid();
 if(x.log.length>5||x.log.some(t=>typeof t!=='string'||t.length>250))invalid();s.log=x.log.map(t=>t.replace(/[<>]/g,''));
 return s;
}
export function restore(raw){try{return parseSave(raw);}catch{return fresh();}}

// The second chapter asks players to invest in a distinct kind of town.
export const PATHS={
 maritime:{name:'Working waterfront',station:'boatyard',building:'Boatyard',requires:'fishing',cost:{coins:160,wood:12,stone:6},chain:'Timber → planks → boat fittings',description:'Refit the coastal fleet. Timber feeds your boatyard, while fish supplies the crews.'},
 estate:{name:'Coastal estate',station:'estate',building:'Vineyard & cellar',requires:'olive',cost:{coins:160,wood:8,stone:10},chain:'Grapes → wine, alongside olive oil',description:'Supply wine merchants and restaurants. Harvest grapes, make wine, and keep oil and bread moving.'}
};
export const CONTRACTS={
 fleet:{path:'maritime',name:'The coastal fishing fleet',client:'Porto Santo cooperative',description:'Refit boats and supply the crews over three shipments.',cost:{fish:4,boatparts:2,bread:2},shipments:3,coins:90,wood:2,stone:1,bonus:240},
 refit:{path:'maritime',name:'Winter refit programme',client:'Cala Verde boat owners',description:'A heavier fitting order. Timber supply matters more than food production.',cost:{fish:2,boatparts:4},shipments:3,coins:110,wood:2,stone:2,bonus:280},
 restaurants:{path:'estate',name:'The coastal restaurant route',client:'Cala Verde kitchens',description:'Keep three restaurant deliveries supplied with oil, wine and fresh bread.',cost:{oil:2,wine:2,bread:4},shipments:3,coins:90,wood:2,stone:1,bonus:240},
 merchants:{path:'estate',name:'The island wine merchants',client:'Isola Lunga merchants',description:'Larger wine shipments need a reliable harvest and cellar queue.',cost:{oil:2,wine:4},shipments:3,coins:110,wood:2,stone:2,bonus:280}
};
export const CHARTER_COST={coins:400,wood:20,stone:12};
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
export function contractReady(s){if(!s.contract)return false;return canAfford(s,CONTRACTS[s.contract.id].cost);}
export function dispatchContract(s){if(!contractReady(s))return false;const c=CONTRACTS[s.contract.id];spend(s,c.cost);s.coins+=c.coins;s.stock.wood+=c.wood;s.stock.stone+=c.stone;s.contract.shipped++;s.contractDeliveries++;if(s.contract.shipped===c.shipments){const first=!s.contractsDone.includes(s.contract.id);if(first)s.contractsDone.push(s.contract.id);s.coins+=c.bonus;note(s,'Contract complete · '+c.name+' · +'+c.bonus+' coins'+(first?' · new partnership':''));s.contract=null;}else note(s,c.name+' · shipment '+s.contract.shipped+'/'+c.shipments+' delivered');return true;}
export function abandonContract(s){if(!s.contract)return false;s.contract=null;note(s,'Contract released. Previous shipments remain delivered.');return true;}
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
