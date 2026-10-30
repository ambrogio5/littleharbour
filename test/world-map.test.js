import test from 'node:test';
import assert from 'node:assert/strict';
import {cameraBounds,cameraZoom,WORLD_SIZE,WORLD_REGIONS} from '../dist/world-map.js';
import {townTasks,townTaskView} from '../dist/world-guide.js';
import {fresh,parseSave,setTownFocus,townFocusBlocker,order,dispatch,marketOrder,neighbourhoodOrder,available} from '../dist/engine.js';
import {sampleTown} from '../dist/demo-town.js';

test('Camera keeps zoom anchored under the finger and clamps all world edges',()=>{
 const c={x:-100,y:-80,z:.5},p={x:150,y:200},z=cameraZoom(c,2,p);
 assert.equal((p.x-c.x)/c.z,(p.x-z.x)/z.z);assert.equal((p.y-c.y)/c.z,(p.y-z.y)/z.z);
 assert.deepEqual(cameraBounds({x:100,y:100,z:1},400,600),{x:0,y:0,z:1});
 assert.deepEqual(cameraBounds({x:-9000,y:-9000,z:1},400,600),{x:400-WORLD_SIZE.w,y:600-WORLD_SIZE.h,z:1});
 const fit=cameraBounds({x:100,y:-999,z:.1},400,600);assert.equal(fit.x,(400-WORLD_SIZE.w*.1)/2);assert.equal(fit.y,(600-WORLD_SIZE.h*.1)/2);
 assert.equal(cameraZoom(c,100,p).z,1.6);assert.equal(cameraZoom(c,.0001,p).z,.1);
 for(const r of Object.values(WORLD_REGIONS)){assert(r.x>=0&&r.y>=0&&r.x+r.w<=WORLD_SIZE.w&&r.y+r.h<=WORLD_SIZE.h);}
});
test('Town tasks distinguish ready stock from reserved stock and never mutate a town',()=>{
 const s=fresh(),before=JSON.stringify(s);assert.equal(townTasks(s)[0].id,'harvest');assert.equal(JSON.stringify(s),before);
 s.stock.bread=4;assert(townTasks(s).some(t=>t.id==='trade'));
 s.reservations={'other':{bread:4}};assert.equal(available(s,'bread'),0);assert(!townTasks(s).some(t=>t.id==='trade'));
 assert(!townTaskView(s).includes('undefined'));assert(townTasks(s).length<=3);
});
test('Direction choice is gated, first choice free, switches paid and held coins protected',()=>{
 const s=fresh();assert(!setTownFocus(s,'trade'));s.pier=true;s.expansion='fishing';s.businesses=['fishing'];s.deliveries=2;
 const coins=s.coins;assert(setTownFocus(s,'trade'));assert.equal(s.coins,coins);assert(!setTownFocus(s,'trade'));assert(!setTownFocus(s,'evil'));
 s.coins=150;s.reservations={held:{coins:100}};assert(!setTownFocus(s,'builders'));assert.equal(s.townFocus,'trade');s.reservations={};assert(setTownFocus(s,'builders'));assert.equal(s.coins,50);assert.match(townFocusBlocker(s,'community'),/100/);
 const loaded=parseSave(JSON.stringify(s));assert.equal(loaded.townFocus,'builders');delete s.townFocus;assert.equal(parseSave(JSON.stringify(s)).townFocus,null);s.townFocus='invalid';assert.throws(()=>parseSave(JSON.stringify(s)));
});
test('Trade direction previews and pays exact bonus, builders favours material returns',()=>{
 const s=sampleTown(),base=order(s);s.townFocus='trade';const boosted=order(s);assert.equal(boosted.coins,Math.round(base.coins*1.35));for(const[k,n]of Object.entries(boosted.cost))s.stock[k]+=n;const money=s.coins;assert(dispatch(s));assert.equal(s.coins-money,boosted.coins);
 s.townFocus='builders';const material=order(s);assert.equal(material.wood,Math.round(base.wood*1.5));assert.equal(material.stone,Math.round(base.stone*1.5));assert.equal(material.coins,base.coins);
});
test('Local life boosts local order previews without changing trade fares or requirements',()=>{
 const s=sampleTown();s.market.access=true;s.market.left=0;s.market.businesses.fishmonger={left:0,demand:3,deliveries:3,replenish:0};
 const m=marketOrder(s,'fishmonger'),n=neighbourhoodOrder(s),o=order(s);s.townFocus='community';assert.equal(marketOrder(s,'fishmonger').coins,Math.round(m.coins*1.5));assert.equal(neighbourhoodOrder(s).reward.coins,Math.round(n.reward.coins*1.5));assert.deepEqual(neighbourhoodOrder(s).cost,n.cost);assert.deepEqual(order(s),o);
});

test('Camera controller preserves building taps, suppresses drag clicks and supports pinch zoom',async()=>{
 const {createWorldMap}=await import('../dist/world-map.js');
 const originals={document:globalThis.document,ResizeObserver:globalThis.ResizeObserver};
 const events={},rootEvents={},captures=new Set(),classes=new Set(),rect={setAttribute(){}};
 const style={setProperty(){}},track={style:{},insertAdjacentHTML(){}},viewport={clientWidth:600,clientHeight:500,style:{},setAttribute(){},addEventListener(n,f){events[n]=f;},getBoundingClientRect(){return {left:0,top:0};},setPointerCapture(id){captures.add(id);},hasPointerCapture(id){return captures.has(id);},releasePointerCapture(id){captures.delete(id);}};
 const nodes=Object.fromEntries(Object.keys(WORLD_REGIONS).map(id=>[id+'Stage',{dataset:{},style:{},insertAdjacentHTML(){}}]));nodes.worldZoom={textContent:''};
 globalThis.document={getElementById(id){return nodes[id];}};globalThis.ResizeObserver=class{observe(){}};
 const root={classList:{add(c){classes.add(c);},toggle(c,on){on?classes.add(c):classes.delete(c);}},style,querySelector(s){return s==='.map-scroller'?viewport:s==='.district-track'?track:rect;},insertAdjacentHTML(){},addEventListener(n,f){rootEvents[n]=f;}};
 const pointer=(x,y,id=1)=>({clientX:x,clientY:y,pointerId:id,pointerType:'touch'});
 try{
  createWorldMap(root);events.pointerdown(pointer(100,100));assert.equal(captures.size,0,'a tap must not be retargeted to the viewport');events.pointerup(pointer(100,100));
  let stopped=false;const click={target:{closest(){return null;}},preventDefault(){stopped=true;},stopImmediatePropagation(){stopped=true;}};rootEvents.click(click);assert(!stopped);
  events.pointerdown(pointer(100,100));events.pointermove(pointer(140,130));assert(captures.has(1));events.pointerup(pointer(140,130));rootEvents.click(click);assert(stopped);
  const before=nodes.worldZoom.textContent;events.pointerdown(pointer(100,100));events.pointerdown(pointer(200,100,2));events.pointermove(pointer(300,100,2));assert.notEqual(nodes.worldZoom.textContent,before);events.pointerup(pointer(300,100,2));events.pointerup(pointer(100,100));assert.equal(captures.size,0);
 }finally{globalThis.document=originals.document;globalThis.ResizeObserver=originals.ResizeObserver;}
});
