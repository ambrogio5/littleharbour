import test from 'node:test';
import assert from 'node:assert/strict';
import {createSaveStore} from '../dist/save-store.js';
import {fresh,parseSave,harvest,start,installRefit} from '../dist/engine.js';
function memory(raw=null){const values=new Map(raw===null?[]:[['town',raw]]);return {values,get length(){return values.size;},key:i=>[...values.keys()][i]??null,getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)};}
for(const raw of ['', '{bad', '{"version":99,"extra":"keep me"}', JSON.stringify({...fresh(),coins:-1})])test('Failed load never writes or loses original bytes: '+raw.slice(0,25),()=>{
 const storage=memory(raw),store=createSaveStore(storage,'town');assert(store.read().error);assert(store.blocked);assert.equal(store.original,raw);
 for(let i=0;i<10;i++)assert.equal(store.write(fresh()),false);
 assert.equal(storage.getItem('town'),raw);assert.equal(storage.length,1);
 assert(store.replace(fresh()));assert.equal(store.backups()[0].raw,raw);assert.equal(store.blocked,false);
});
test('Quota, unreadable storage and failed backup verification prevent replacement',()=>{
 const raw='broken',storage=memory(raw),store=createSaveStore(storage,'town');store.read();
 storage.setItem=()=>{throw Error('Quota exceeded');};assert(!store.replace(fresh()));assert.equal(storage.getItem('town'),raw);
 const unreadable=createSaveStore(()=>{throw Error('Storage unavailable');},'town');assert(unreadable.read().error);assert(!unreadable.write(fresh()));assert(!unreadable.replace(fresh()));
 storage.setItem=()=>{};assert(!store.replace(fresh()));assert.equal(storage.getItem('town'),raw);
});
test('Migration archives exact source including whitespace and unknown metadata, then deduplicates writes',()=>{
 const legacy={...fresh(),version:1,extra:'original'};const raw=' \n'+JSON.stringify(legacy)+'\n';
 const storage=memory(raw),store=createSaveStore(storage,'town');const {state}=store.read();assert.equal(state.version,13);
 assert(store.write(state));assert.equal(store.backups()[0].raw,raw);assert(store.write(state));assert.equal(store.writes,1);
});
test('Competing tab writes stop autosave and explicit replacement archives the latest bytes',()=>{
 const storage=memory(JSON.stringify(fresh())),a=createSaveStore(storage,'town'),b=createSaveStore(storage,'town');const sa=a.read().state,sb=b.read().state;
 sa.coins=90;assert(a.write(sa));sb.coins=100;assert(!b.write(sb));assert.match(b.reason,/Another tab/);assert.equal(JSON.parse(storage.getItem('town')).coins,90);
 assert(b.replace(sb));assert(b.backups().some(x=>JSON.parse(x.raw).coins===90));
});
test('A pre-balance timer and a refit timer preserve paid work on reload',()=>{
 const s=fresh();s.expansion='fishing';s.businesses=['fishing'];s.deliveries=1;s.coins=10000;s.stock.wood=100;s.stock.stone=100;s.stock.wheat=20;
 assert(installRefit(s,'mill','speed'));assert(start(s,'mill'));const left=8;s.jobs[0].left=left;
 assert.equal(parseSave(JSON.stringify(s)).jobs[0].left,left);
 s.jobs[0].left=3600;assert.equal(parseSave(JSON.stringify(s)).jobs[0].left,3600);
 for(const left of [0,-1,Infinity,86401]){s.jobs[0].left=left;assert.throws(()=>parseSave(JSON.stringify(s)));}
});
test('Every supported schema migrates idempotently; future versions fail explicitly',()=>{
 for(let version=1;version<=13;version++){const state=parseSave(JSON.stringify({...fresh(),version}));assert.deepEqual(parseSave(JSON.stringify(state)),state);}
 assert.throws(()=>parseSave(JSON.stringify({...fresh(),version:14})),/newer version/);
});
