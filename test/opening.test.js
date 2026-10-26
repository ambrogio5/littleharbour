import test from 'node:test';
import assert from 'node:assert/strict';
import {fresh,openingGuide,harvestReplant,start,queueBatch,dispatch,build,upgrade,tick,parseSave} from '../dist/engine.js';
function act(s,g){if(g.action==='harvest-replant')return harvestReplant(s);if(g.action==='start')return start(s,g.key);if(g.action==='batch')return queueBatch(s,g.key,g.count);if(g.action==='dispatch')return dispatch(s);if(g.action==='upgrade')return upgrade(s);return false;}
for(const branch of ['fishing','olive'])test('Opening guide reaches the quay through real production: '+branch,()=>{
 const s=fresh();let actions=0;
 for(let time=0;time<900&&!s.pier;time++){
  const g=openingGuide(s);assert(g.title&&g.description&&g.label);
  if(g.action==='view'&&g.tab==='build'&&!s.expansion){assert(build(s,branch));actions++;}
  else if(g.action!=='view'){assert(act(s,g),JSON.stringify(g));actions++;}
  tick(s,1);
  assert(Object.values(s.stock).every(n=>n>=0));
 }
 assert(s.pier);assert(s.deliveries>=2);assert(actions<30);
 assert.deepEqual(parseSave(JSON.stringify(s)),s);
});
test('Guidance accounts for incoming goods and never spends on render',()=>{
 const s=fresh();harvestReplant(s);queueBatch(s,'mill',2);
 const before=JSON.stringify(s),g=openingGuide(s);assert.equal(g.action,'view');assert.equal(JSON.stringify(s),before);
 tick(s,8);const ready=openingGuide(s);assert.equal(ready.action,'batch');assert.equal(ready.key,'bakery');assert.equal(ready.count,1);
 queueBatch(s,'bakery',1);assert.equal(openingGuide(s).action,'view');
 tick(s,8);assert.equal(openingGuide(s).key,'bakery');
});
test('A paused production wait gives an explicit resume action',()=>{
 const s=fresh();harvestReplant(s);queueBatch(s,'mill',2);s.speed=0;
 const g=openingGuide(s);assert.equal(g.tab,'resume');assert.equal(g.label,'Resume at 1×');
});
test('Affordable quay guide respects its delivery prerequisites',()=>{
 const s=fresh();s.deliveries=1;s.expansion='fishing';s.businesses=['fishing'];s.coins=1000;
 assert.notEqual(openingGuide(s).action,'upgrade');
 s.deliveries=2;assert.equal(openingGuide(s).action,'upgrade');
});
