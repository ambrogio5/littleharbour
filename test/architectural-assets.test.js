import test from 'node:test';
import assert from 'node:assert/strict';
import {painterlyBuilding} from '../dist/lab/painterly-assets.js';
import {renderWorldBuildings} from '../dist/lab/world-art-v2.js';

const base={stage:'built',x:850,y:1200,level:1,label:'Building',ripe:false};
const draw=(kind,stage='built',level=1)=>painterlyBuilding({...base,id:kind,kind,stage,level});
test('important playable buildings have distinct sprites',()=>{
 const kinds=['mill','bakery','olive','fishing','pier','ferry','waterfront','lighthouse','kiln','market','square','home','sailmaker','weaver','carpenter','field','orchard','garden','clay'];
 const outputs=kinds.map(k=>draw(k));
 assert.equal(new Set(outputs).size,kinds.length,'each playable type must have individual recognizable artwork');
 for(const svg of outputs)assert(svg.length>200,'no empty art objects');
});
test('each construction stage is an actual distinct state for all major sites',()=>{
 const kinds=['mill','bakery','olive','fishing','pier','ferry','lighthouse','kiln','market','home'];
 for(const kind of kinds){
  assert.notEqual(draw(kind,'unbuilt'),draw(kind,'building'),kind+' unbuilt and building');
  assert.notEqual(draw(kind,'building'),draw(kind,'built'),kind+' building and built');
 }
});
test('upgrades create visual changes rather than only changing a number',()=>{
 for(const kind of ['mill','bakery','olive','pier','lighthouse','home']){
  assert.notEqual(draw(kind,'built',1),draw(kind,'built',2),kind+' level one vs two');
 }
});
test('built site markup retains real interaction and accessibility keys',()=>{
 const world=renderWorldBuildings([{...base,id:'bakery',kind:'bakery'}]);
 assert.match(world,/data-world-building="bakery"/);
 assert.match(world,/data-stage="built"/);
 assert.match(world,/data-kind="bakery"/);
 assert.match(world,/<title>Building — built<\/title>/);
});
test('crop state is visible from actual ripe state',()=>{
 const ripe=painterlyBuilding({...base,id:'field',kind:'field',ripe:true});
 const growing=painterlyBuilding({...base,id:'field',kind:'field',ripe:false});
 assert.notEqual(ripe,growing);
});
