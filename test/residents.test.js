import test from 'node:test';
import assert from 'node:assert/strict';
import * as e from '../dist/engine.js';
import {sampleTown} from '../dist/demo-town.js';
import {projectPlan} from '../dist/project-planning.js';
import {residentsPanelView,residentsEntryView,neighbourhoodMapView} from '../dist/neighbourhood-ui.js';

function town(){
 const s=sampleTown();
 assert(e.selectOrder(s,'inland'));
 assert(e.dispatch(s));
 s.coins=12000;
 for(const item of Object.keys(s.stock))s.stock[item]=200;
 assert(e.buyBoat(s,0,'cutter'));
 for(let i=0;i<3;i++){assert(e.startVoyage(s,0,'quarry'));e.tick(s,30);}
 assert(e.openNeighbourhood(s));
 assert.equal(s.residents.delivered,0);
 return s;
}
const view={
 costs:c=>Object.entries(c).map(([k,n])=>n+' '+k).join(' · '),
 ingredients:(c,g)=>'<p data-goal="'+g+'">'+Object.keys(c).join(', ')+'</p>',
 goalTools:g=>'<button data-goal="'+g+'">Reserve supplies</button>'
};
function complete(s,proposal){
 assert(e.chooseResidentsProposal(s,proposal));
 for(let i=0;i<3;i++)assert(e.deliverResidentsSupplies(s,proposal,i));
 assert(e.residentsComplete(s,proposal));
}

test('Selection can change for free, but the first delivery commits the proposal and prevents stale deliveries',()=>{
 const s=town(),before=s.coins;
 assert(e.chooseResidentsProposal(s,'garden'));
 assert(e.chooseResidentsProposal(s,'square'));
 assert(e.chooseResidentsProposal(s,'garden'));
 assert.equal(s.coins,before);
 assert.equal(s.residents.delivered,0);
 assert(!e.deliverResidentsSupplies(s,'square',0));
 assert(e.deliverResidentsSupplies(s,'garden',0));
 assert.equal(s.residents.delivered,1);
 const snapshot=JSON.stringify(s);
 assert(!e.chooseResidentsProposal(s,'square'));
 assert(!e.deliverResidentsSupplies(s,'garden',0));
 assert(!e.deliverResidentsSupplies(s,'garden',2));
 assert.equal(JSON.stringify(s),snapshot);
 assert.equal(e.residentsComplete(s),false);
});

test('The public garden needs three different supply deliveries and adds one workshop queue slot only when complete',()=>{
 const s=town(),start=e.capacity(s,'carpenter');
 assert(e.chooseResidentsProposal(s,'garden'));
 const p=e.RESIDENT_PROPOSALS.garden.stages;
 assert.notDeepEqual(p[0].cost,p[1].cost);
 assert.notDeepEqual(p[1].cost,p[2].cost);
 for(let i=0;i<3;i++){
  const stock={...s.stock};
  assert(e.deliverResidentsSupplies(s,'garden',i));
  for(const [key,n] of Object.entries(p[i].cost))assert.equal(s.stock[key],stock[key]-n);
  assert.equal(e.capacity(s,'carpenter'),start+(i===2?1:0));
 }
 assert(e.residentsComplete(s,'garden'));
 assert.deepEqual(e.parseSave(JSON.stringify(s)),s);
 assert(!e.deliverResidentsSupplies(s,'garden',2));
});

test('The commercial square boosts only local-market and neighbourhood order earnings, stacking with the existing town direction',()=>{
 const s=town();
 s.townFocus='community';
 const marketBefore=e.marketOrder(s,'fishmonger').coins;
 const localBefore=e.neighbourhoodOrder(s).reward.coins;
 const tradeBefore=e.order(s);
 assert(e.chooseResidentsProposal(s,'square'));
 for(let i=0;i<2;i++)assert(e.deliverResidentsSupplies(s,'square',i));
 assert.equal(e.marketOrder(s,'fishmonger').coins,marketBefore);
 assert.equal(e.neighbourhoodOrder(s).reward.coins,localBefore);
 assert(e.deliverResidentsSupplies(s,'square',2));
 assert.equal(e.marketOrder(s,'fishmonger').coins,Math.round(marketBefore*1.35));
 assert.equal(e.neighbourhoodOrder(s).reward.coins,Math.round(localBefore*1.35));
 assert.deepEqual(e.order(s),tradeBefore);
 assert.equal(e.capacity(s,'carpenter'),2);
 assert.deepEqual(e.parseSave(JSON.stringify(s)),s);
});

test('Reservations belong to the chosen proposal, survive while valid, and release on a switch or delivery',()=>{
 const s=town(),first='residents:garden:0';
 assert(e.chooseResidentsProposal(s,'garden'));
 assert.deepEqual(e.goalCost(s,first),e.RESIDENT_PROPOSALS.garden.stages[0].cost);
 assert(e.reserveFor(s,first));
 assert(s.reservations[first]);
 assert(e.available(s,'wood')<s.stock.wood);
 assert(e.chooseResidentsProposal(s,'square'));
 assert.equal(e.goalCost(s,first),null);
 assert.equal(Object.keys(s.reservations).length,0);
 assert(e.chooseResidentsProposal(s,'garden'));
 assert(e.reserveFor(s,first));
 assert(e.deliverResidentsSupplies(s,'garden',0));
 assert(!s.reservations[first]);
 assert.equal(e.goalCost(s,first),null);
 assert.equal(e.goalCost(s,'residents:garden:1').cloth,4);
 assert.equal(e.goalTitle(s,'residents:garden:1'),'Public garden · delivery 2 of 3');
});

test('Version 12 saves migrate to the new civic state, while malformed version 13 states are rejected',()=>{
 const s=town(),old=structuredClone(s);
 old.version=12;delete old.residents;
 const migrated=e.parseSave(JSON.stringify(old));
 assert.equal(migrated.version,13);
 assert.deepEqual(migrated.residents,{proposal:null,delivered:0});
 assert.deepEqual(e.parseSave(JSON.stringify(migrated)),migrated);
 for(const patch of [
  r=>{r.proposal='invalid';},
  r=>{r.proposal=null;r.delivered=1;},
  r=>{r.proposal='garden';r.delivered=-1;},
  r=>{r.proposal='garden';r.delivered=4;},
  r=>{r.proposal='garden';r.delivered=1.5;}
 ]){
  const bad=structuredClone(s);patch(bad.residents);
  assert.throws(()=>e.parseSave(JSON.stringify(bad)));
 }
});

test('UI links the civic plot, staged delivery controls and full project comparison without embedded artwork data',()=>{
 const s=town();
 const entry=residentsEntryView(s);
 assert(entry.includes('data-action="residents-open"'));
 const choice=residentsPanelView(s,view);
 assert(choice.includes('Public garden'));
 assert(choice.includes('Commercial square'));
 assert(choice.includes('data-action="residents-select" data-key="garden"'));
 assert(!choice.includes('data:image/png;base64'));
 assert(e.chooseResidentsProposal(s,'garden'));
 const first=residentsPanelView(s,view);
 assert(first.includes('data-action="residents-deliver"'));
 assert(first.includes('residents:garden:0'));
 const map0=neighbourhoodMapView(s,{plot:0,section:'overview',moveFrom:null});
 assert(map0.includes('Residents’ plot'));
 assert(map0.includes('data-action="residents-open"'));
 assert(e.deliverResidentsSupplies(s,'garden',0));
 const map1=neighbourhoodMapView(s,{plot:0,section:'overview',moveFrom:null});
 assert(map1.includes('Delivery 1 / 3'));
 assert.notEqual(map0,map1);
 assert(!residentsPanelView(s,view).includes('data-action="residents-select"'));
});

test('Production planning accepts the active residents delivery and completed projects have no stale goals',()=>{
 const s=town();
 assert(e.chooseResidentsProposal(s,'square'));
 for(let i=0;i<3;i++){
  const id='residents:square:'+i;
  const p=projectPlan(s,id);
  assert(p.valid);
  assert.equal(p.title,'Commercial square · delivery '+(i+1)+' of 3');
  assert.equal(p.requirements.length,Object.keys(e.RESIDENT_PROPOSALS.square.stages[i].cost).length);
  assert(e.deliverResidentsSupplies(s,'square',i));
  assert.equal(e.goalCost(s,id),null);
 }
 assert(!projectPlan(s,'residents:square:2').valid);
 assert(e.residentsComplete(s,'square'));
});
