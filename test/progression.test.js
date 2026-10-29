import test from 'node:test';
import assert from 'node:assert/strict';
import {fresh,RECIPES,PATHS,CONTRACTS,CHARTER_COST,has,harvest,start,tick,order,dispatch,build,upgrade,selectOrder,canAfford,specialise,invest,acceptContract,dispatchContract,abandonContract,establishCharter,parseSave,unlocked,chapterTwo,pathBlocker,WATERFRONT_STAGES,fundWaterfront,supplyWaterfront,waterfrontSupplies,orders,openingGuide,MARKET_ACCESS_COST,MARKET_BUSINESSES,marketAccess,marketReady,marketBusiness,buildMarketBusiness,dispatchMarket,setMarketAuto,inlandAccess,inlandEligible,inlandReady,buildTerrace,buildKiln,buildCourtyard,INLAND_ACCESS_COST,TERRACE_TYPES,KILN_COST,COURTYARD_COST,FLEET_BOATS,FLEET_UPGRADES,LIGHTHOUSE_STAGES,LIGHTHOUSE_SECONDS,buyBoat,voyagePlan,startVoyage,buildLighthouseStage,berthCount,installBoatUpgrade,setRepeatVoyage,cancelVoyage} from '../dist/engine.js';
const run=(s,n)=>{for(let i=0;i<n;i++)tick(s,1);};
const source={flour:'mill',bread:'bakery',fish:'fishing',olives:'olives',oil:'press',planks:'saw',boatparts:'fittings',grapes:'grapes',wine:'wine',provisions:'provisions'};
function ensure(s,item,n){let steps=0;while(s.stock[item]<n){assert(++steps<100,'Supply loop cannot stall');if(item==='wheat'){if(s.ripe)harvest(s);else {if(!s.jobs.some(j=>j.key==='field'))assert(start(s,'field'));run(s,12);}continue;}if(['wood','stone'].includes(item)){fund(s,{[item]:n});continue;}const key=source[item]||Object.keys(RECIPES).find(k=>RECIPES[k].output[item]&&unlocked(s,k)),r=RECIPES[key];assert(r,'Known source for '+item);for(const[k,v]of Object.entries(r.cost))ensure(s,k,v);assert(start(s,key),'Can produce '+key);run(s,r.duration);}}
function trade(s){selectOrder(s,'materials');const o=order(s);for(const[k,v]of Object.entries(o.cost))ensure(s,k,v);assert(dispatch(s));}
function fund(s,cost){let trips=0;while(!canAfford(s,cost)){assert(++trips<30);trade(s);}}
function town(first){const s=fresh();ensure(s,'bread',4);assert(dispatch(s));assert(build(s,first));run(s,8);trade(s);assert(upgrade(s));run(s,8);return s;}
function prepare(s,path){assert(specialise(s,path));const p=PATHS[path];if(!has(s,p.requires)){fund(s,{coins:110,wood:10,stone:4});assert(build(s,p.requires));run(s,8);}fund(s,p.cost);assert(invest(s));assert(!start(s,path==='maritime'?'saw':'grapes'));run(s,8);}
function fulfil(s,id){assert(acceptContract(s,id));const c=CONTRACTS[id];for(let i=0;i<c.shipments;i++){for(const[k,v]of Object.entries(c.cost))ensure(s,k,v);assert(dispatchContract(s));assert.deepEqual(parseSave(JSON.stringify(s)),s);}}
for(const path of ['maritime','estate'])test(path+' reaches the charter using actual production and earned resources',()=>{const s=town(path==='maritime'?'fishing':'olive');prepare(s,path);assert.equal(chapterTwo(s).step,2);for(const[id,c]of Object.entries(CONTRACTS).filter(([,c])=>c.path===path))fulfil(s,id);assert.equal(s.contractsDone.length,2);assert.equal(chapterTwo(s).step,5);fund(s,CHARTER_COST);assert(establishCharter(s));assert.equal(chapterTwo(s).step,6);assert(s.charter);assert.equal(order(s).coins,120);assert(Object.values(s.stock).every(v=>v>=0));assert.deepEqual(parseSave(JSON.stringify(s)),s);});
test('Contracts consume exactly one shipment and award completion once',()=>{const s=town('fishing');prepare(s,'maritime');assert(acceptContract(s,'fleet'));const c=CONTRACTS.fleet;assert(!dispatchContract(s));for(let i=0;i<3;i++){for(const[k,v]of Object.entries(c.cost))ensure(s,k,v);const before=s.coins;assert(dispatchContract(s));assert.equal(s.coins-before,c.coins+(i===2?c.bonus:0));}assert.equal(s.contract,null);assert.deepEqual(s.contractsDone,['fleet']);assert(!dispatchContract(s));});
test('Replaying a contract earns goods rewards but cannot duplicate a partnership',()=>{const s=town('olive');prepare(s,'estate');fulfil(s,'restaurants');fulfil(s,'restaurants');assert.deepEqual(s.contractsDone,['restaurants']);assert(!establishCharter(s));});
test('Specialist plot prevents parallel paths until charter; old investments survive switching',()=>{const s=town('fishing');prepare(s,'maritime');ensure(s,'wood',2);assert(start(s,'saw'));assert(!specialise(s,'estate'));run(s,12);assert(specialise(s,'estate'));assert(s.specialists.includes('boatyard'));assert(!unlocked(s,'saw'));assert(specialise(s,'maritime'));assert(unlocked(s,'saw'));assert(acceptContract(s,'fleet'));assert(!specialise(s,'estate'));assert(pathBlocker(s,'estate').includes('contract'));assert(abandonContract(s));assert(specialise(s,'estate'));});
test('Players can cross from their first business to the other town direction',()=>{const s=town('fishing');prepare(s,'estate');assert(has(s,'olive'));assert(s.specialists.includes('estate'));assert(unlocked(s,'wine'));assert(!acceptContract(s,'fleet'));assert(acceptContract(s,'merchants'));});
test('Saved contracts preserve shipment progress and reject fabricated states',()=>{const s=town('olive');prepare(s,'estate');assert(acceptContract(s,'restaurants'));for(const[k,v]of Object.entries(CONTRACTS.restaurants.cost))ensure(s,k,v);assert(dispatchContract(s));const resumed=parseSave(JSON.stringify(s));assert.equal(resumed.contract.shipped,1);assert.deepEqual(resumed.stock,s.stock);for(const mutation of [x=>x.contract.shipped=3,x=>x.contract.id='not-a-contract',x=>x.contractsDone=['restaurants','restaurants'],x=>x.specialists=['boatyard'],x=>x.charter=true]){const bad=structuredClone(s);mutation(bad);assert.throws(()=>parseSave(JSON.stringify(bad)));}});
test('Version 3 saves preserve old goods and jobs while gaining new zero stocks',()=>{const s=town('fishing');s.version=3;for(const k of ['specialisation','specialists','contract','contractsDone','contractDeliveries','charter'])delete s[k];for(const k of ['planks','boatparts','grapes','wine'])delete s.stock[k];s.stock.wheat=4;assert(start(s,'mill'));run(s,2);const loaded=parseSave(JSON.stringify(s));assert.equal(loaded.version,13);assert.equal(loaded.stock.wheat,s.stock.wheat);assert.equal(loaded.jobs[0].left,6);assert.equal(loaded.stock.wine,0);assert.equal(loaded.specialisation,null);});

for(const path of ['maritime','estate'])test(path+' restores the waterfront with earned funds and real supply chains',()=>{
 let s=town(path==='maritime'?'fishing':'olive');prepare(s,path);
 for(const[id,c]of Object.entries(CONTRACTS).filter(([,c])=>c.path===path))fulfil(s,id);
 fund(s,CHARTER_COST);assert(establishCharter(s));assert(!fundWaterfront(s,0));run(s,8);
 assert.equal(openingGuide(s).tab,'waterfront');assert(!selectOrder(s,'waterfront'));
 for(let stage=0;stage<3;stage++){
  const p=WATERFRONT_STAGES[stage];fund(s,p.cost);const before=s.coins;assert(fundWaterfront(s,stage));assert.equal(s.coins,before-p.cost.coins);assert(!fundWaterfront(s,stage));
  s=parseSave(JSON.stringify(s));
  for(let delivery=0;delivery<2;delivery++){
   let passes=0;while(!canAfford(s,waterfrontSupplies(s))){assert(++passes<10);for(const[k,n]of Object.entries(waterfrontSupplies(s)))ensure(s,k,n);}
   const stock={...s.stock};assert(supplyWaterfront(s,stage,delivery));
   for(const[k,n]of Object.entries(p[path]))assert.equal(s.stock[k],stock[k]-n);
   const saved=JSON.stringify(s);assert(!supplyWaterfront(s,stage,delivery));assert.equal(JSON.stringify(s),saved);
   s=parseSave(saved);
  }
  s.speed=0;tick(s,60);assert.equal(s.waterfront.left,12);s.speed=3;tick(s,2);assert.equal(s.waterfront.left,6);
  s=parseSave(JSON.stringify(s));tick(s,2);s.speed=1;assert.equal(s.waterfront.stage,stage+1);assert.equal(s.waterfront.left,0);assert(!s.waterfront.funded);
  assert.deepEqual(parseSave(JSON.stringify(s)),s);assert.equal(orders(s).length,stage===2?4:3);
 }
 assert(!fundWaterfront(s,3));assert(!supplyWaterfront(s,3,0));assert(selectOrder(s,'waterfront'));
 const o=order(s);assert.equal(o.coins,384);assert.equal(o.wood,22);assert.equal(o.stone,12);
 while(!canAfford(s,o.cost))for(const[k,n]of Object.entries(o.cost))ensure(s,k,n);
 // Material replenishment inside ensure may select its ordinary route.
 assert(selectOrder(s,'waterfront'));const before={coins:s.coins,wood:s.stock.wood,stone:s.stock.stone};assert(dispatch(s));
 assert.equal(s.coins,before.coins+384);assert.equal(s.stock.wood,before.wood+22);assert.equal(s.stock.stone,before.stone+12);
 assert.deepEqual(parseSave(JSON.stringify(s)),s);assert(Object.values(s.stock).every(n=>n>=0));
 // Continue into the market with the same earned town: no injected funds or goods.
 assert.equal(openingGuide(s).tab,'market');fund(s,MARKET_ACCESS_COST);assert(marketAccess(s));assert(!marketAccess(s));assert(!marketReady(s));
 s=parseSave(JSON.stringify(s));run(s,12);assert(marketReady(s));
 for(const [type,definition]of Object.entries(MARKET_BUSINESSES)){
  if(!has(s,definition.requires)){fund(s,{coins:110,wood:10,stone:4});assert(build(s,definition.requires));run(s,8);}
  fund(s,definition.cost);assert(buildMarketBusiness(s,type,definition.plot));assert(!dispatchMarket(s,type));s=parseSave(JSON.stringify(s));run(s,8);
  for(const [item,n]of Object.entries(definition.order))ensure(s,item,n);
  const coins=s.coins;assert(dispatchMarket(s,type));assert.equal(s.coins,coins+definition.coins);assert.equal(marketBusiness(s,type).auto,false);
  s=parseSave(JSON.stringify(s));assert.equal(marketBusiness(s,type).deliveries,1);
 }
 // Ordinary trade remains a source of construction materials after both stalls open.
 trade(s);assert.equal(s.specialisation,path);assert.deepEqual(parseSave(JSON.stringify(s)),s);
 // The same earned town establishes an inland chain and finishes civic paving.
 const business=path==='maritime'?'fishmonger':'kitchen';
 for(let n=0;n<2;n++){for(const[item,count]of Object.entries(MARKET_BUSINESSES[business].order))ensure(s,item,count);assert(dispatchMarket(s,business));}
 assert(inlandEligible(s));fund(s,INLAND_ACCESS_COST);assert(inlandAccess(s));s=parseSave(JSON.stringify(s));run(s,12);assert(inlandReady(s));
 const crop=path==='maritime'?'orchard':'garden';fund(s,TERRACE_TYPES[crop].cost);assert(buildTerrace(s,0,crop));run(s,10);
 fund(s,KILN_COST);assert(buildKiln(s));run(s,12);ensure(s,'preserves',4);assert(selectOrder(s,'inland'));
 const inland=order(s),beforeInland={coins:s.coins,wood:s.stock.wood,stone:s.stock.stone};assert(dispatch(s));assert.equal(s.inland.shipments,1);assert.equal(s.coins,beforeInland.coins+inland.coins);assert.equal(s.stock.wood,beforeInland.wood+8);assert.equal(s.stock.stone,beforeInland.stone+6);
 ensure(s,'tiles',12);fund(s,COURTYARD_COST);assert(buildCourtyard(s));run(s,12);assert.equal(s.inland.courtyardLeft,0);
 // Either identical or mixed terrace layouts use their own queues without path switching.
 fund(s,TERRACE_TYPES.orchard.cost);assert(buildTerrace(s,1,'orchard'));run(s,10);assert(start(s,'orchard1'));run(s,12);
 // Continue through the fleet and lighthouse without injected goods or money.
 const supplyCost=cost=>{let attempts=0;while(!canAfford(s,cost)){assert(++attempts<20,'Fleet supply plan makes progress');fund(s,Object.fromEntries(Object.entries(cost).filter(([k])=>['coins','wood','stone'].includes(k))));for(const[k,n]of Object.entries(cost))if(k!=='coins')ensure(s,k,n);}};
 const role=path==='maritime'?'cutter':'coaster';fund(s,FLEET_BOATS[role].cost);assert(buyBoat(s,0,role));
 const sail=(route,tier=1,slot=0)=>{const plan=voyagePlan(s,slot,route,tier);supplyCost(plan.cost);assert(startVoyage(s,slot,route,tier));s=parseSave(JSON.stringify(s));run(s,plan.duration);assert.equal(s.fleet.boats[slot].trip,null);assert.deepEqual(parseSave(JSON.stringify(s)),s);};
 const buildLight=stage=>{supplyCost(LIGHTHOUSE_STAGES[stage].cost);assert(buildLighthouseStage(s,stage));s=parseSave(JSON.stringify(s));run(s,LIGHTHOUSE_SECONDS);assert.equal(s.fleet.lighthouse.stage,stage+1);};
 sail('quarry');buildLight(0);sail('quarry');sail('quarry');sail('island');buildLight(1);sail('island');sail('island');buildLight(2);assert.equal(berthCount(s),2);
 const second=role==='cutter'?'coaster':'cutter';fund(s,FLEET_BOATS[second].cost);assert(buyBoat(s,1,second));
 fund(s,FLEET_UPGRADES.speed.cost);assert(installBoatUpgrade(s,0,'speed'));sail('quarry',3,0);sail('island',2,1);
 assert.equal(s.fleet.boats[0].repeat,null);assert.equal(s.fleet.boats[1].repeat,null);
 const repeat=voyagePlan(s,1,'island',1);supplyCost(repeat.cost);assert(setRepeatVoyage(s,1,'island',1));tick(s,1);assert(s.fleet.boats[1].trip);assert(cancelVoyage(s,1));assert.equal(s.fleet.boats[1].repeat,null);
 assert.equal(s.specialisation,path);assert.deepEqual(parseSave(JSON.stringify(s)),s);assert(Object.values(s.stock).every(n=>n>=0));
});
