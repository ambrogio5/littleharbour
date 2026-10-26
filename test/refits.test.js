import test from 'node:test';
import assert from 'node:assert/strict';
import {fresh,REFITS,installRefit,refitBlocker,recipeDuration,start,tick,capacity,queueBatch,cancel,parseSave} from '../dist/engine.js';
function town(){const s=fresh();s.expansion='fishing';s.businesses=['fishing'];s.deliveries=1;s.coins=1000;s.stock.wood=100;s.stock.stone=100;s.stock.wheat=100;s.stock.flour=100;return s;}
test('Speed refits charge once, shorten time, and keep input and output unchanged',()=>{
 for(const st of Object.keys(REFITS)){
  const s=town(),item={mill:'flour',bakery:'bread',fishing:'fish'}[st],before=s.stock[item];
  assert(installRefit(s,st,'speed'));assert.equal(s.coins,1000-REFITS[st].speed.cost.coins);
  assert(!installRefit(s,st,'speed'));assert(start(s,st));
  const duration=recipeDuration(s,st);assert.equal(duration,{mill:6,bakery:9,fishing:10.5}[st]);
  tick(s,duration-.5);assert.equal(s.stock[item],before);tick(s,.5);assert.equal(s.stock[item],before+2);
  assert.deepEqual(parseSave(JSON.stringify(s)),s);
 }
});
test('Queue refits combine with the storehouse, refund waiting work and preserve active work',()=>{
 const s=town();s.pier=true;s.deliveries=2;s.workshopUpgrade=true;
 assert(installRefit(s,'mill','queue'));assert.equal(capacity(s,'mill'),6);assert.equal(queueBatch(s,'mill',99),6);
 assert.equal(s.stock.wheat,88);assert.equal(queueBatch(s,'mill',1),0);assert(cancel(s,5));assert.equal(s.stock.wheat,90);
 assert(!installRefit(s,'mill','speed'));assert.match(refitBlocker(s,'mill','speed'),/active work/);
 assert.deepEqual(parseSave(JSON.stringify(s)),s);
 tick(s,40);assert.equal(s.jobs.length,0);assert(installRefit(s,'mill','speed'));assert.equal(capacity(s,'mill'),4);assert.equal(recipeDuration(s,'mill'),6);
});
test('Refits cannot strand the first expansion or purchase an unowned business improvement',()=>{
 const s=fresh();s.coins=1000;s.deliveries=1;
 assert(!installRefit(s,'mill','speed'));assert.equal(s.coins,1000);
 s.expansion='olive';s.businesses=['olive'];assert(!installRefit(s,'fishing','queue'));assert(!installRefit(s,'constructor','speed'));assert(!installRefit(s,'mill','constructor'));
 s.coins=0;assert(!installRefit(s,'mill','queue'));
});
test('Refit saves migrate old towns and reject malformed or inconsistent upgrades',()=>{
 const legacy=town();legacy.version=4;delete legacy.refits;start(legacy,'mill');tick(legacy,2);
 const loaded=parseSave(JSON.stringify(legacy));assert.equal(loaded.version,5);assert.deepEqual(loaded.refits,{});assert.equal(loaded.jobs[0].left,6);
 for(const refits of [null,[],{mill:'free'},{field:'speed'},{unknown:'queue'}]){const s=town();s.refits=refits;assert.throws(()=>parseSave(JSON.stringify(s)));}
 const s=fresh();s.refits={mill:'speed'};assert.throws(()=>parseSave(JSON.stringify(s)));
});
test('Speed refits preserve pause and serial queue carryover',()=>{
 const s=town();installRefit(s,'bakery','speed');queueBatch(s,'bakery',2);s.speed=0;tick(s,60);assert.equal(s.jobs[0].left,9);
 s.speed=1;tick(s,12);assert.equal(s.stock.bread,2);assert.equal(s.jobs[0].left,6);
 const loaded=parseSave(JSON.stringify(s));tick(loaded,6);assert.equal(loaded.stock.bread,4);assert.equal(loaded.jobs.length,0);
});
