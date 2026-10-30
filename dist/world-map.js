import {createWorldArt} from './world-art.js';
// One persistent camera and one illustrated world. Locations use world pixels.
export const WORLD_REGIONS={
 inland:{x:335,y:125,w:1210,h:670,name:'Hillside & fields'},
 neighbourhood:{x:385,y:665,w:850,h:555,name:'Neighbourhood'},
 market:{x:1230,y:640,w:800,h:520,name:'Market quarter'},
 harbour:{x:965,y:1035,w:790,h:620,name:'Home harbour'},
 coast:{x:1690,y:1000,w:900,h:680,name:'Working coast'}
};
export const WORLD_SIZE={w:2680,h:1840};
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
 root.insertAdjacentHTML('beforeend',`<div class="world-camera-tools" aria-label="Map camera"><button data-camera="in" aria-label="Zoom in">+</button><button data-camera="out" aria-label="Zoom out">−</button><button data-camera="home">Home</button><button data-camera="fit">Whole town</button><span id="worldZoom"></span></div><nav class="world-minimap" aria-label="Jump to an area"><svg viewBox="0 0 2680 1840" aria-hidden="true">${Object.entries(WORLD_REGIONS).map(([id,r])=>`<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" class="mini-${id}"/>`).join('')}<rect class="mini-camera"/></svg>${Object.entries(WORLD_REGIONS).map(([id,r])=>`<button data-world-region="${id}" aria-label="Go to ${r.name}" style="left:${(r.x+r.w/2)/WORLD_SIZE.w*100}%;top:${(r.y+r.h/2)/WORLD_SIZE.h*100}%">${id==='harbour'?'H':id==='market'?'M':id==='inland'?'I':id==='coast'?'C':'N'}</button>`).join('')}</nav><p class="world-touch-hint">Drag to explore · Pinch or + / − to zoom · Tap a building</p>`);
 let camera={x:0,y:0,z:.6},drag=null,moved=false,suppressUntil=0,activeRegion='harbour';const pointers=new Map();let pinch=null;
 // Reparent existing buttons onto the unified world; all game actions stay bound.
 const pins=[
  ['.field-pin','inland',790,450],['.mill-pin','inland',1140,585],['.bakery-pin','inland',1655,675],
  ['.expansion-pin','neighbourhood',1010,1050],['.fishing-pin','coast',360,1340],
  ['.harbour-pin','harbour',1400,1430],['.specialist-pin','market',1455,880],
  ['.waterfront-pin','coast',1945,1335]
 ];
 if(document.createElement&&track.appendChild){
  const layer=document.createElement('div');layer.className='world-primary-hotspots';track.appendChild(layer);
  for(const [selector,zone,x,y] of pins){
   const button=root.querySelector(selector);if(!button)continue;
   button.classList.add('world-hotspot');button.dataset.hotspotZone=zone;
   button.style.left=x+'px';button.style.top=y+'px';layer.appendChild(button);
  }
 }
 function draw(){camera=cameraBounds(camera,viewport.clientWidth,viewport.clientHeight);track.style.transform=`translate(${camera.x}px,${camera.y}px) scale(${camera.z})`;root.style.setProperty('--map-label-scale',String(Math.min(4,1/camera.z)));root.classList.toggle('world-overview',camera.z<.43);if(root.dataset)root.dataset.activeRegion=activeRegion;
 for(const[id]of Object.entries(WORLD_REGIONS)){const el=document.getElementById(id+'Stage');el?.classList?.toggle('world-current',id===activeRegion);}
 root.querySelectorAll?.('.world-hotspot')?.forEach?.(button=>button.classList.toggle('active-zone',button.dataset.hotspotZone===activeRegion));document.getElementById('worldZoom').textContent=Math.round(camera.z*100)+'%';const rect=root.querySelector('.mini-camera');rect.setAttribute('x',Math.max(0,-camera.x/camera.z));rect.setAttribute('y',Math.max(0,-camera.y/camera.z));rect.setAttribute('width',Math.min(WORLD_SIZE.w,viewport.clientWidth/camera.z));rect.setAttribute('height',Math.min(WORLD_SIZE.h,viewport.clientHeight/camera.z));}
 function focus(id){const r=WORLD_REGIONS[id];if(!r)return;activeRegion=id;onRegionChange(id);document.querySelectorAll?.('#v3ZoneNav [data-action="district"]')?.forEach?.(b=>b.setAttribute('aria-pressed',String(b.dataset.key===id)));const place=root.querySelector('#v2MapPlace');if(place)place.textContent=r.name;const z=Math.min(.9,Math.max(.44,Math.min(viewport.clientWidth/r.w,viewport.clientHeight/r.h)*.95));camera={z,x:viewport.clientWidth/2-(r.x+r.w/2)*z,y:viewport.clientHeight/2-(r.y+r.h/2)*z};draw();}
 function fit(){activeRegion='all';onRegionChange('all');document.querySelectorAll?.('#v3ZoneNav [data-action="district"]')?.forEach?.(b=>b.setAttribute('aria-pressed','false'));const place=root.querySelector('#v2MapPlace');if(place)place.textContent='Whole town';camera={z:Math.min(viewport.clientWidth/WORLD_SIZE.w,viewport.clientHeight/WORLD_SIZE.h)*.96,x:0,y:0};draw();}
 function zoom(factor,point={x:viewport.clientWidth/2,y:viewport.clientHeight/2}){camera=cameraZoom(camera,factor,point);draw();}
 function point(e){const r=viewport.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top};}
 viewport.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button!==0)return;pointers.set(e.pointerId,point(e));drag={id:e.pointerId,start:point(e),camera:{...camera}};moved=false;pinch=null;if(pointers.size===2){const[a,b]=[...pointers.values()];pinch={distance:Math.hypot(a.x-b.x,a.y-b.y),camera:{...camera},center:{x:(a.x+b.x)/2,y:(a.y+b.y)/2}};}});
 viewport.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId))return;pointers.set(e.pointerId,point(e));if(pointers.size===2&&pinch){const[a,b]=[...pointers.values()],center={x:(a.x+b.x)/2,y:(a.y+b.y)/2};camera=cameraZoom(pinch.camera,Math.hypot(a.x-b.x,a.y-b.y)/Math.max(1,pinch.distance),pinch.center);camera.x+=center.x-pinch.center.x;camera.y+=center.y-pinch.center.y;moved=true;draw();}else if(drag&&drag.id===e.pointerId){const p=point(e),dx=p.x-drag.start.x,dy=p.y-drag.start.y;if(Math.hypot(dx,dy)>6)moved=true;if(moved){viewport.setPointerCapture(e.pointerId);camera={...drag.camera,x:drag.camera.x+dx,y:drag.camera.y+dy};draw();}}});
 function release(e){if(moved||pinch)suppressUntil=Date.now()+350;pointers.delete(e.pointerId);pinch=null;drag=null;if(pointers.size===1){const[id,p]=[...pointers.entries()][0];drag={id,start:p,camera:{...camera}};}if(viewport.hasPointerCapture(e.pointerId))viewport.releasePointerCapture(e.pointerId);}
 viewport.addEventListener('pointerup',release);viewport.addEventListener('pointercancel',release);
 // Suppress the click after a pan without suppressing a stationary building tap.
 root.addEventListener('click',e=>{const button=e.target.closest('button');if(Date.now()<suppressUntil&&!button?.dataset.camera&&!button?.dataset.worldRegion){e.preventDefault();e.stopImmediatePropagation();return;}if(button?.dataset.camera){e.stopPropagation();const a=button.dataset.camera;if(a==='fit')fit();else if(a==='home')focus('harbour');else zoom(a==='in'?1.35:1/1.35);return;}if(button?.dataset.worldRegion){focus(button.dataset.worldRegion);e.stopPropagation();return;}const region=e.target.closest('[data-region]');if(region&&camera.z<.43){focus(region.dataset.region);e.preventDefault();e.stopPropagation();}},true);
 viewport.addEventListener('wheel',e=>{e.preventDefault();if(e.shiftKey){camera.x-=e.deltaX||e.deltaY;camera.y-=e.deltaY;draw();}else zoom(Math.exp(-e.deltaY*.0025),point(e));},{passive:false});
 viewport.addEventListener('keydown',e=>{if(e.target!==viewport)return;const shifts={ArrowLeft:[80,0],ArrowRight:[-80,0],ArrowUp:[0,80],ArrowDown:[0,-80]};if(shifts[e.key]){e.preventDefault();camera.x+=shifts[e.key][0];camera.y+=shifts[e.key][1];draw();}else if(['+','=','-','Home'].includes(e.key)){e.preventDefault();if(e.key==='Home')focus('harbour');else zoom(e.key==='-'?1/1.35:1.35);}});
 new ResizeObserver(draw).observe(viewport);focus('harbour');
 return {focus,fit,zoom,update(locks){for(const[id,r]of Object.entries(WORLD_REGIONS)){const el=document.getElementById(id+'Stage'),reason=locks[id];el.hidden=false;el.classList.toggle('world-locked',!!reason);el.querySelector('.world-region-label small').textContent=reason||'Tap buildings to manage';el.querySelectorAll('button:not(.world-region-label)').forEach(b=>{b.inert=!!reason;});}draw();}};
}
