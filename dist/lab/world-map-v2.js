import {WORLD_LAYOUT,worldEntities} from '../world-model.js?v=0.20.1';
import {createWorldArt,renderWorldBuildings} from './world-art-v2.js?v=0.2';
// One persistent camera and one illustrated world. Locations use world pixels.
export const WORLD_REGIONS=WORLD_LAYOUT.regions;
export const WORLD_SIZE=WORLD_LAYOUT.size;
export function cameraBounds(camera,width,height){
 const z=Math.max(.1,Math.min(1.6,camera.z)),w=WORLD_SIZE.w*z,h=WORLD_SIZE.h*z;
 return {z,x:w<width?(width-w)/2:Math.max(width-w,Math.min(0,camera.x)),y:h<height?(height-h)/2:Math.max(height-h,Math.min(0,camera.y))};
}
export function cameraZoom(camera,factor,point){const z=Math.max(.1,Math.min(1.6,camera.z*factor)),r=z/camera.z;return {z,x:point.x-(point.x-camera.x)*r,y:point.y-(point.y-camera.y)*r};}
export function createWorldMap(root,onRegionChange=()=>{}){
 const viewport=root.querySelector('.map-scroller'),track=root.querySelector('.district-track');
 root.classList.add('unified-map');viewport.tabIndex=0;viewport.setAttribute('aria-label','Town map. Drag to explore; use plus and minus to zoom, arrow keys to pan.');
 track.style.width=WORLD_SIZE.w+'px';track.style.height=WORLD_SIZE.h+'px';
 track.insertAdjacentHTML('afterbegin',createWorldArt());
 for(const[id,r]of Object.entries(WORLD_REGIONS)){
  const el=document.getElementById(id+'Stage');el.dataset.region=id;
  Object.assign(el.style,{left:r.x+'px',top:r.y+'px',width:r.w+'px',height:r.h+'px'});
  el.insertAdjacentHTML('beforeend',`<button class="world-region-label" data-world-region="${id}"><strong>${r.name}</strong><small></small></button>`);
 }
 root.insertAdjacentHTML('beforeend',`<div class="world-camera-tools" aria-label="Map camera"><button data-camera="in" aria-label="Zoom in">+</button><button data-camera="out" aria-label="Zoom out">−</button><button data-camera="home">Home</button><button data-camera="fit">Whole town</button><span id="worldZoom"></span></div><nav class="world-minimap" aria-label="Jump to an area"><svg viewBox="0 0 1800 2700" aria-hidden="true">${Object.entries(WORLD_REGIONS).map(([id,r])=>`<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" class="mini-${id}"/>`).join('')}<rect class="mini-camera"/></svg>${Object.entries(WORLD_REGIONS).map(([id,r])=>`<button data-world-region="${id}" aria-label="Go to ${r.name}" style="left:${(r.x+r.w/2)/WORLD_SIZE.w*100}%;top:${(r.y+r.h/2)/WORLD_SIZE.h*100}%">${id==='harbour'?'H':id==='market'?'M':id==='inland'?'I':id==='coast'?'C':'N'}</button>`).join('')}</nav><p class="world-touch-hint">Drag to explore · Pinch or + / − to zoom · Tap a building</p>`);
 let lastEntitySnapshot='';let camera={x:0,y:0,z:.6},drag=null,moved=false,suppressUntil=0,activeRegion='harbour';const pointers=new Map();let pinch=null;
 // Reparent existing buttons onto the unified world; all game actions stay bound.
 const pins=[
  ['.field-pin','field'],['.mill-pin','mill'],['.bakery-pin','bakery'],
  ['.expansion-pin','olive'],['.fishing-pin','fishing'],['.harbour-pin','pier'],
  ['.specialist-pin','specialist'],['.waterfront-pin','waterfront']
 ].map(([selector,id])=>{const site=WORLD_LAYOUT.sites[id];return [selector,site.zone,site.x,site.y+95];});
 if(document.createElement&&track.appendChild){
  // A positioned HTML hit layer sits directly above the world illustration.
  // SVG paint and transparent stage overlays cannot swallow building taps.
  const hitLayer=document.createElement('div');
  hitLayer.className='world-art-hit-layer';
  track.appendChild(hitLayer);
  const layer=document.createElement('div');layer.className='world-primary-hotspots';track.appendChild(layer);const extra=document.createElement('div');extra.className='world-entity-hotspots';track.appendChild(extra);
  for(const [selector,zone,x,y] of pins){
   const button=root.querySelector(selector);if(!button)continue;
   button.classList.add('world-hotspot');button.dataset.hotspotZone=zone;
   button.style.left=x+'px';button.style.top=y+'px';layer.appendChild(button);
  }
 }
 function draw(){camera=cameraBounds(camera,viewport.clientWidth,viewport.clientHeight);track.style.transform=`translate(${camera.x}px,${camera.y}px) scale(${camera.z})`;root.style.setProperty('--map-label-scale',String(Math.min(10,1/camera.z)));root.classList.toggle('world-overview',camera.z<.22);if(root.dataset)root.dataset.activeRegion=activeRegion;
 for(const[id]of Object.entries(WORLD_REGIONS)){const el=document.getElementById(id+'Stage');el?.classList?.toggle('world-current',id===activeRegion);}
 root.querySelectorAll?.('.world-hotspot,.world-entity-button')?.forEach?.(button=>button.classList.toggle('active-zone',button.dataset.hotspotZone===activeRegion));document.getElementById('worldZoom').textContent=Math.round(camera.z*100)+'%';const rect=root.querySelector('.mini-camera');rect.setAttribute('x',Math.max(0,-camera.x/camera.z));rect.setAttribute('y',Math.max(0,-camera.y/camera.z));rect.setAttribute('width',Math.min(WORLD_SIZE.w,viewport.clientWidth/camera.z));rect.setAttribute('height',Math.min(WORLD_SIZE.h,viewport.clientHeight/camera.z));}

 let animation=0;
 function stopAnimation(){if(animation)cancelAnimationFrame(animation);animation=0;}
 function navigate(target){
  stopAnimation();
  const from={...camera};
  const duration=240,begin=performance.now();
  function frame(now){
   const u=Math.min(1,(now-begin)/duration),t=1-Math.pow(1-u,3);
   camera={x:from.x+(target.x-from.x)*t,y:from.y+(target.y-from.y)*t,z:from.z+(target.z-from.z)*t};
   draw();
   if(u<1)animation=requestAnimationFrame(frame);else animation=0;
  }
  animation=requestAnimationFrame(frame);
 }
 function focus(id){const r=WORLD_REGIONS[id];if(!r)return;activeRegion=id;onRegionChange(id);document.querySelectorAll?.('#v3ZoneNav [data-action="district"]')?.forEach?.(b=>b.setAttribute('aria-pressed',String(b.dataset.key===id)));const place=root.querySelector('#v2MapPlace');if(place)place.textContent=r.name;const z=Math.min(.9,Math.max(.27,Math.min(viewport.clientWidth/r.w,viewport.clientHeight/r.h)*.95));navigate({z,x:viewport.clientWidth/2-(r.x+r.w/2)*z,y:viewport.clientHeight/2-(r.y+r.h/2)*z});}
 function fit(){activeRegion='all';onRegionChange('all');document.querySelectorAll?.('#v3ZoneNav [data-action="district"]')?.forEach?.(b=>b.setAttribute('aria-pressed','false'));const place=root.querySelector('#v2MapPlace');if(place)place.textContent='Whole town';navigate({z:Math.min(viewport.clientWidth/WORLD_SIZE.w,viewport.clientHeight/WORLD_SIZE.h)*.96,x:0,y:0});}
 function zoom(factor,point={x:viewport.clientWidth/2,y:viewport.clientHeight/2}){camera=cameraZoom(camera,factor,point);draw();}
 function point(e){const r=viewport.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top};}

 // All gestures operate in world pixels. Background drag never hijacks an
 // actual button tap; two-finger zoom preserves the point beneath the fingers.
 let pointerGesture=null;
 const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
 const midpoint=(a,b)=>({x:(a.x+b.x)/2,y:(a.y+b.y)/2});
 function beginGesture(){
  const entries=[...pointers.values()];
  if(entries.length===2){
   const center=midpoint(entries[0],entries[1]);
   pointerGesture={type:'pinch',start:distance(...entries),world:{x:(center.x-camera.x)/camera.z,y:(center.y-camera.y)/camera.z},moved:true};
   moved=true;
  }else if(entries.length===1){pointerGesture={type:'pan',start:entries[0],from:{...camera},moved:false};}
 }
 viewport.addEventListener('pointerdown',e=>{
  if(e.pointerType==='mouse'&&e.button!==0)return;
  if(e.target.closest('button,a,input,select'))return;
  stopAnimation();
  pointers.set(e.pointerId,point(e));
  try{viewport.setPointerCapture(e.pointerId);}catch{}
  beginGesture();
 });
 viewport.addEventListener('pointermove',e=>{
  if(!pointers.has(e.pointerId))return;
  pointers.set(e.pointerId,point(e));
  if(!pointerGesture)return;
  if(pointers.size===2){
   if(pointerGesture.type!=='pinch')beginGesture();
   const [a,b]=[...pointers.values()],center=midpoint(a,b);
   const nextZ=Math.max(.1,Math.min(1.6,pointerGesture.start?camera.z*distance(a,b)/pointerGesture.start:camera.z));
   // Rebase pinch as fingers move; this avoids cumulative zoom instability.
   const w=pointerGesture.world;
   camera={z:nextZ,x:center.x-w.x*nextZ,y:center.y-w.y*nextZ};
   pointerGesture.start=distance(a,b);
   draw();moved=true;
  }else if(pointerGesture.type==='pan'){
   const p=[...pointers.values()][0];
   const dx=p.x-pointerGesture.start.x,dy=p.y-pointerGesture.start.y;
   if(distance(p,pointerGesture.start)>7)pointerGesture.moved=true;
   if(pointerGesture.moved){
    moved=true;
    camera={...pointerGesture.from,x:pointerGesture.from.x+dx,y:pointerGesture.from.y+dy};
    draw();
   }
  }
 });
 function release(e){
  if(!pointers.has(e.pointerId))return;
  pointers.delete(e.pointerId);
  if(moved)suppressUntil=performance.now()+180;
  try{if(viewport.hasPointerCapture(e.pointerId))viewport.releasePointerCapture(e.pointerId);}catch{}
  pointerGesture=null;
  if(pointers.size)beginGesture();else moved=false;
 }
 viewport.addEventListener('pointerup',release);
 viewport.addEventListener('pointercancel',release);
 root.addEventListener('click',e=>{
  const button=e.target.closest('button');
  if(performance.now()<suppressUntil&&!button?.dataset.camera&&!button?.dataset.worldRegion){
   e.preventDefault();e.stopImmediatePropagation();return;
  }
  if(button?.dataset.camera){
   e.preventDefault();e.stopPropagation();
   const a=button.dataset.camera;
   if(a==='fit')fit();else if(a==='home')focus('harbour');
   else zoom(a==='in'?1.3:1/1.3);
   return;
  }
  if(button?.dataset.worldRegion){focus(button.dataset.worldRegion);e.preventDefault();e.stopPropagation();return;}
  const region=e.target.closest('[data-region]');
  if(region&&camera.z<.22){focus(region.dataset.region);e.preventDefault();e.stopPropagation();}
 },true);

 // Artwork is itself a hit target: tapping a mill, bakery, or other rendered
 // building performs the same validated action as its accessible map pin.
 root.addEventListener('click',e=>{
  const sprite=e.target.closest?.('[data-world-building]');
  if(!sprite||performance.now()<suppressUntil)return;
  const id=sprite.dataset.worldBuilding;
  const primary={field:'.field-pin',mill:'.mill-pin',bakery:'.bakery-pin',olive:'.expansion-pin',fishing:'.fishing-pin',pier:'.harbour-pin',specialist:'.specialist-pin',waterfront:'.waterfront-pin'};
  const button=primary[id]?root.querySelector(primary[id]):root.querySelector('.world-entity-button[data-key="'+id+'"]');
  if(button){e.preventDefault();button.click();}
 });
 viewport.addEventListener('wheel',e=>{e.preventDefault();if(e.shiftKey){camera.x-=e.deltaX||e.deltaY;camera.y-=e.deltaY;draw();}else zoom(Math.exp(-e.deltaY*.0025),point(e));},{passive:false});
 viewport.addEventListener('keydown',e=>{if(e.target!==viewport)return;const shifts={ArrowLeft:[80,0],ArrowRight:[-80,0],ArrowUp:[0,80],ArrowDown:[0,-80]};if(shifts[e.key]){e.preventDefault();camera.x+=shifts[e.key][0];camera.y+=shifts[e.key][1];draw();}else if(['+','=','-','Home'].includes(e.key)){e.preventDefault();if(e.key==='Home')focus('harbour');else zoom(e.key==='-'?1/1.35:1.35);}});
 new ResizeObserver(draw).observe(viewport);focus('harbour');
 return {focus,fit,zoom,update(locks,state){
 if(state){const entities=worldEntities(state),snapshot=JSON.stringify(entities);if(snapshot!==lastEntitySnapshot){const layer=document.getElementById('worldBuildings');if(layer)layer.innerHTML=renderWorldBuildings(entities);
 const artHits=root.querySelector('.world-art-hit-layer');
 if(artHits)artHits.innerHTML=entities.map(e=>`<button class="world-art-hit" data-action="world-site" data-key="${e.id}" data-hotspot-zone="${e.zone}" style="left:${e.x}px;top:${e.y}px" aria-label="Open ${e.label}"></button>`).join('');
 const extra=root.querySelector('.world-entity-hotspots');
 if(extra)extra.innerHTML=entities.filter(e=>!['field','mill','bakery','olive','fishing','pier','specialist','waterfront'].includes(e.id)&&(!['terrace0','terrace1','claypit','kiln'].includes(e.id)||state.inland.access)).map(e=>`<button class="world-entity-button" data-hotspot-zone="${e.zone}" data-action="world-site" data-key="${e.id}" style="left:${e.x}px;top:${e.y+80}px" aria-label="${e.label} · ${e.stage}">${e.label}<small>${e.stage==='unbuilt'?'Plan construction':e.stage==='building'?'Work in progress':'Open'}</small></button>`).join('');
 lastEntitySnapshot=snapshot;}}
 for(const[id,r]of Object.entries(WORLD_REGIONS)){const el=document.getElementById(id+'Stage'),reason=locks[id];el.hidden=false;el.classList.toggle('world-locked',!!reason);el.querySelector('.world-region-label small').textContent=reason||'Tap buildings to manage';el.querySelectorAll('button:not(.world-region-label)').forEach(b=>{b.inert=!!reason;});}draw();}};
}
