// Earn both complete campaigns using only exposed player actions. No sample towns or injected goods.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as E from '../../dist/engine.js';
import {currentObjective} from '../../dist/progression.js';
const bundle = fs.readFileSync(new URL('../LittleHarbour/Resources/engine-bundle.js', import.meta.url), 'utf8');
const campaigns = [];
for (const path of ['maritime', 'estate']) {
 const context = vm.createContext({}); vm.runInContext(bundle, context); const native = context.Harbour;
 let town = E.fresh(); const steps = [];
 const parity = () => assert.deepEqual(JSON.parse(native.browserSave()), town, path + ' economy parity');
 const act = (fn, ...args) => {
  const id = JSON.stringify([fn, args]);
  assert(E[fn](town, ...args), path + ' original ' + id);
  assert(native.act(id), path + ' exposed native action ' + id);
  steps.push({action: id}); parity();
 };
 const run = seconds => {
  const ticks = Math.ceil(seconds);
  for (let i=0; i<ticks; i++) { E.tick(town, 1); native.tick(1); }
  steps.push({ticks}); parity();
 };
 const checkpoint = () => {
  town = E.parseSave(JSON.stringify(town)); const bytes = native.save(); native.load(bytes);
  assert.equal(native.save(), bytes); steps.push({reload: true}); parity();
 };
 const select = id => { if (town.selectedOrder !== id) act('selectOrder', id); };
 const supply = (item, count) => {
  for(let pass=0; town.stock[item]<count; pass++) {
   assert(pass < 150, 'Supply loop ' + item);
   if (item === 'wheat') { if(town.ripe) act('harvestReplant'); else run(12); continue; }
   if (item === 'wood' || item === 'stone') { trade(); continue; }
   const key = Object.keys(E.RECIPES).find(k => E.RECIPES[k].output[item] && E.unlocked(town, k));
   assert(key, 'Unlocked source for ' + item);
   for(const [ingredient,n] of Object.entries(E.RECIPES[key].cost)) supply(ingredient,n);
   act('start',key); run(E.recipeDuration(town,key));
  }
 };
 const trade = () => {
  const route = E.orders(town).some(o=>o.id==='materials'&&!o.locked) ? 'materials' : 'local';
  select(route); const order = E.order(town);
  for (const [item,n] of Object.entries(order.cost)) supply(item,n);
  select(route); act('dispatch');
 };
 const fund = cost => {
  for(let pass=0; !E.canAfford(town,cost); pass++) {
   assert(pass < 150, 'Funding loop ' + JSON.stringify(cost));
   if(town.coins < (cost.coins||0)) trade();
   for(const [item,n] of Object.entries(cost)) if(item!=='coins') supply(item,n);
  }
 };
 const build = business => { fund(E.buildCost(town)); act('build',business); run(8); };
 supply('bread',4); act('dispatch'); build(path==='maritime'?'fishing':'olive');
 trade(); fund(E.PIER_COST); act('upgrade'); run(8);
 act('specialise',path); if(!E.has(town,E.PATHS[path].requires)) build(E.PATHS[path].requires);
 fund(E.PATHS[path].cost); act('invest'); run(8);
 for(const [id, contract] of Object.entries(E.CONTRACTS).filter(([,c])=>c.path===path)) {
  act('acceptContract',id);
  for(let i=0;i<contract.shipments;i++) { fund(contract.cost); act('dispatchContract'); checkpoint(); }
 }
 fund(E.CHARTER_COST); act('establishCharter'); run(8);
 for(let stage=0;stage<3;stage++) {
  fund(E.WATERFRONT_STAGES[stage].cost); act('fundWaterfront',stage);
  for(let batch=0;batch<2;batch++) { fund(E.waterfrontSupplies(town)); act('supplyWaterfront',stage,batch); checkpoint(); }
  run(12);
 }
 fund(E.MARKET_ACCESS_COST); act('marketAccess'); run(12);
 for(const [type, definition] of Object.entries(E.MARKET_BUSINESSES)) {
  if(!E.has(town,definition.requires)) build(definition.requires);
  fund(definition.cost); act('buildMarketBusiness',type,definition.plot); run(8);
  for(let i=0;i<3;i++) { fund(definition.order); act('dispatchMarket',type); run(24); }
 }
 fund(E.INLAND_ACCESS_COST); act('inlandAccess'); run(12);
 const crop = path==='maritime'?'orchard':'garden';
 fund(E.TERRACE_TYPES[crop].cost); act('buildTerrace',0,crop); run(10);
 fund(E.KILN_COST); act('buildKiln'); run(12);
 select('inland'); const inlandOrder=E.order(town); fund(inlandOrder.cost); select('inland'); act('dispatch');
 fund(E.COURTYARD_COST); act('buildCourtyard'); run(12);
 const role=path==='maritime'?'cutter':'coaster'; fund(E.FLEET_BOATS[role].cost); act('buyBoat',0,role);
 const sail = route => { const plan=E.voyagePlan(town,0,route,1); fund(plan.cost); act('startVoyage',0,route,1); checkpoint(); run(plan.duration); };
 const lighthouse = stage => { fund(E.LIGHTHOUSE_STAGES[stage].cost); act('buildLighthouseStage',stage); checkpoint(); run(E.LIGHTHOUSE_SECONDS); };
 sail('quarry'); lighthouse(0); sail('quarry'); sail('quarry'); sail('island'); lighthouse(1); sail('island'); sail('island'); lighthouse(2);
 fund(E.NEIGHBOURHOOD_ACCESS_COST); act('openNeighbourhood');
 for(const [index,type] of ['carpenter','flaxgarden','weaver','sailmaker','home'].entries()) {
  fund(E.PLOT_COST); act('buyNeighbourhoodPlot',index); fund(E.NEIGHBOURHOOD_BUILDINGS[type].cost); act('buildNeighbourhood',index,type);
 }
 fund(E.HOME_UPGRADE_COST); act('upgradeNeighbourhoodHome',4);
 fund(E.SAIL_REFIT_COST); act('refitBoatSails',0);
 const proposal=path==='maritime'?'garden':'square'; act('chooseResidentsProposal',proposal);
 for(let stage=0;stage<3;stage++) { fund(E.RESIDENT_PROPOSALS[proposal].stages[stage].cost); act('deliverResidentsSupplies',proposal,stage); checkpoint(); }
 assert.equal(currentObjective(town).chapter,5);
 for(let stage=0;stage<3;stage++) {
  fund(E.FERRY_STAGES[stage].cost); act('fundFerryStage',stage);
  for(let batch=0;batch<3;batch++) { fund(E.FERRY_STAGES[stage].supplies); act('deliverFerrySupplies',stage,batch); checkpoint(); }
 }
 const ferry=E.ferryPlan(town,0,'quarry'); fund(ferry.cost); act('startFerryService',0,'quarry'); checkpoint(); run(ferry.duration);
 assert(currentObjective(town).complete); assert.equal(town.ferry.runs,1); assert(Object.values(town.stock).every(x=>x>=0)); checkpoint();
 campaigns.push({path, steps, expectedTown:town});
 console.log(`${path}: ${steps.filter(x=>x.action).length} paid/player actions, ${steps.filter(x=>x.reload).length} save/reloads, ${town.deliveries} earned deliveries; all five chapters completed.`);
}
const target = new URL('../LittleHarbourTests/earned-campaigns.json',import.meta.url);
const data = JSON.stringify(campaigns);
if(process.argv.includes('--check')) assert.equal(fs.readFileSync(target,'utf8'),data,'Regenerate earned campaign traces with node native/scripts/campaign.mjs');
else fs.writeFileSync(target,data);
