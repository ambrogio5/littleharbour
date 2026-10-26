const HARBOUR_PATHS={
 harvest:[[250,250],[330,280],[410,310],[500,365]],
 mill:[[530,385],[610,405],[700,435],[815,449]],
 bakery:[[835,451],[940,454],[1045,493],[1180,520]],
 olives:[[1160,300],[1040,360],[860,420],[670,490],[450,560],[335,585]],
 press:[[340,585],[490,535],[675,478],[850,448],[1035,490],[1180,520]],
 fish:[[1165,570],[1210,530],[1280,499]],
 cargo:[[1195,594],[1120,650],[1020,742],[865,860],[685,1045]],
 fishing:[[1110,600],[1020,665],[900,790],[990,855],[1080,740],[1110,600]],
 village:[[760,240],[700,315],[610,370],[680,415],[830,450]]
};
export function routePoint(points,t){
 const lengths=points.slice(1).map((p,i)=>Math.hypot(p[0]-points[i][0],p[1]-points[i][1]));
 const total=lengths.reduce((a,b)=>a+b,0);let distance=Math.max(0,Math.min(1,t))*total;
 for(let i=0;i<lengths.length;i++){if(distance<=lengths[i]||i===lengths.length-1){const f=lengths[i]?distance/lengths[i]:0,a=points[i],b=points[i+1];return {x:a[0]+(b[0]-a[0])*f,y:a[1]+(b[1]-a[1])*f,angle:Math.atan2(b[1]-a[1],b[0]-a[0])};}distance-=lengths[i];}
 return {x:points[0][0],y:points[0][1],angle:0};
}
export function constructionStage(left,duration=8){return left>duration*2/3?'foundation':left>duration/3?'frame':'finishing';}
export function createHarbourScene(canvas,getState,isPaused){
 const ctx=canvas.getContext('2d');if(!ctx)return {emit(){},reset(){}};
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let clock=getState().seconds,lastFrame=performance.now(),lastPaint=0,frameId,trips=[],flashes=[],width=0,height=0;
 function resize(){const box=canvas.parentElement.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);width=box.width;height=box.height;canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);}
 const observer=new ResizeObserver(resize);observer.observe(canvas.parentElement);resize();
 function emit(type,detail){
  if(type==='shipment'){trips.push({kind:'cargo',start:clock,duration:18,detail});flashes.push({text:'Shipment departing',x:1190,y:580,start:clock});}
  else if(type==='harvest'){trips.push({kind:'harvest',start:clock,duration:8});flashes.push({text:'+6 wheat',x:270,y:230,start:clock});}
  else if(type==='produced'){
   const kind=({flour:'mill',bread:'bakery',olives:'olives',oil:'press',fish:'fish',wheat:'harvest'})[detail];
   if(kind&&trips.filter(t=>t.kind===kind).length<3)trips.push({kind,start:clock,duration:kind==='press'||kind==='olives'?12:8});
   const point=kind?HARBOUR_PATHS[kind][0]:[840,460];if(kind)flashes.push({text:'Goods ready',x:point[0],y:point[1]-25,start:clock});
  }
  if(trips.length>18)trips=trips.slice(-18);if(flashes.length>8)flashes=flashes.slice(-8);
 }
 function reset(){clock=getState().seconds;trips=[];flashes=[];}
 function person(point,time,carrying=false,shirt='#d8d0b8',scale=1){
  ctx.save();ctx.translate(point.x,point.y);ctx.scale(scale,scale);const stride=reduced.matches?0:Math.sin(time*8)*3.2;
  ctx.fillStyle='#152b2740';ctx.beginPath();ctx.ellipse(3,6,11,4,-.25,0,Math.PI*2);ctx.fill();
  ctx.lineCap='round';ctx.lineWidth=3;ctx.strokeStyle='#3c4745';ctx.beginPath();ctx.moveTo(-3,0);ctx.lineTo(-4+stride,6);ctx.moveTo(3,0);ctx.lineTo(4-stride,6);ctx.stroke();
  ctx.fillStyle=shirt;ctx.beginPath();ctx.ellipse(0,-9,6,10,-.1,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#aa8063';ctx.beginPath();ctx.arc(0,-21,4,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#7c725d';ctx.beginPath();ctx.ellipse(0,-24,6,2.3,0,0,Math.PI*2);ctx.fill();
  if(carrying){ctx.fillStyle='#a78b5d';ctx.strokeStyle='#746747';ctx.lineWidth=1;ctx.fillRect(3,-14,12,10);ctx.strokeRect(3,-14,12,10);ctx.beginPath();ctx.moveTo(7,-14);ctx.lineTo(7,-4);ctx.moveTo(3,-9);ctx.lineTo(15,-9);ctx.stroke();}
  ctx.restore();
 }
 function boat(point,time,loaded=false){
  ctx.save();ctx.translate(point.x,point.y);ctx.rotate(point.angle);ctx.strokeStyle='#d4ebe56a';ctx.lineWidth=2;
  for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(-31-i*12,-7-i*4);ctx.quadraticCurveTo(-40-i*11,0,-31-i*12,7+i*4);ctx.stroke();}
  ctx.fillStyle='#183f5040';ctx.beginPath();ctx.ellipse(-2,5,33,14,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#dfdfcd';ctx.beginPath();ctx.moveTo(33,0);ctx.quadraticCurveTo(11,-16,-26,-12);ctx.lineTo(-29,10);ctx.quadraticCurveTo(7,16,33,0);ctx.fill();
  ctx.fillStyle='#365b6b';ctx.beginPath();ctx.moveTo(27,0);ctx.quadraticCurveTo(5,-10,-24,-8);ctx.lineTo(-25,7);ctx.quadraticCurveTo(6,11,27,0);ctx.fill();
  ctx.fillStyle='#d4d1b8';ctx.fillRect(3,-7,12,12);ctx.fillStyle='#3b5355';ctx.fillRect(6,-6,7,4);
  ctx.fillStyle=loaded?'#a58b61':'#a7b7ac';ctx.fillRect(-20,-6,16,11);ctx.strokeStyle='#6e735b';ctx.lineWidth=1;ctx.strokeRect(-20,-6,16,11);
  if(loaded){ctx.beginPath();ctx.moveTo(-13,-6);ctx.lineTo(-13,5);ctx.stroke();}
  ctx.restore();
 }
 function scaffold(project){
  const positions={olive:[350,590],fishing:[1110,610],pier:[1300,610],storehouse:[1300,460]};
  const [x,y]=positions[project.type],stage=constructionStage(project.left),progress=1-project.left/8;
  ctx.save();ctx.translate(x,y);ctx.fillStyle='#343c2a35';ctx.beginPath();ctx.ellipse(0,10,65,17,-.2,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#bdb49c';ctx.beginPath();ctx.moveTo(-55,0);ctx.lineTo(0,-24);ctx.lineTo(59,-3);ctx.lineTo(0,22);ctx.closePath();ctx.fill();
  ctx.strokeStyle='#8b7757';ctx.lineWidth=3;
  if(stage!=='foundation'){
   for(const p of [-44,0,46]){ctx.beginPath();ctx.moveTo(p,3);ctx.lineTo(p,-47);ctx.stroke();}
   ctx.beginPath();ctx.moveTo(-45,-43);ctx.lineTo(0,-59);ctx.lineTo(47,-40);ctx.moveTo(-45,-20);ctx.lineTo(0,-34);ctx.lineTo(47,-17);ctx.moveTo(-43,2);ctx.lineTo(0,-41);ctx.lineTo(45,4);ctx.stroke();
  }
  if(stage==='finishing'){ctx.fillStyle='#a78c71';ctx.beginPath();ctx.moveTo(-46,-44);ctx.lineTo(0,-65);ctx.lineTo(48,-42);ctx.lineTo(0,-24);ctx.closePath();ctx.fill();}
  ctx.fillStyle='#e6d4a6';ctx.fillRect(-47,16,26,11);ctx.fillStyle='#947d54';ctx.fillRect(31,9,18,10);
  person({x:-33,y:23},clock,true,'#d1b77c',.85);person({x:40,y:-2},clock+1,false,'#bdbaa0',.85);
  ctx.fillStyle='#f6f2e6f2';ctx.fillRect(-58,-92,116,26);ctx.fillStyle='#3a524b';ctx.font='500 12px system-ui';ctx.textAlign='center';ctx.fillText(stage==='foundation'?'Laying foundations':stage==='frame'?'Raising the frame':'Finishing',0,-75);
  ctx.fillStyle='#d6d9c7';ctx.fillRect(-53,-63,106,4);ctx.fillStyle='#69856b';ctx.fillRect(-53,-63,106*progress,4);ctx.restore();
 }
 function smoke(s){
  const baking=s.jobs.some(j=>j.key==='bakery');if(!baking)return;
  const phase=reduced.matches?0:clock;
  for(let i=0;i<4;i++){const p=((phase*.22+i*.25)%1);ctx.fillStyle=`rgba(231,232,214,${.26*(1-p)})`;ctx.beginPath();ctx.ellipse(836+Math.sin(p*5)*7,308-p*70,5+p*15,7+p*12,0,0,Math.PI*2);ctx.fill();}
 }
 function paint(){
  const s=getState();ctx.setTransform(canvas.width/1536,0,0,canvas.height/1024,0,0);ctx.clearRect(0,0,1536,1024);
  // Small residents continue their routes independently of the production queue.
  for(let i=0;i<2;i++){const phase=reduced.matches?.25:((clock/(30+i*9)+i*.43)%1);const p=routePoint(HARBOUR_PATHS.village,phase<.5?phase*2:2-phase*2);person(p,clock+i,false,i?'#aaa48a':'#c2c2ad',.9);}
  smoke(s);
  const fishing=s.jobs.find(j=>j.key==='fishing');if(fishing)boat(routePoint(HARBOUR_PATHS.fishing,1-fishing.left/14),clock,false);
  if(s.jobs.some(j=>j.key==='mill')){
   ctx.save();ctx.translate(410,365);ctx.rotate(reduced.matches?0:clock*.8);ctx.strokeStyle='#6f604a8a';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,17,0,Math.PI*2);for(let i=0;i<8;i++){const a=i*Math.PI/4;ctx.moveTo(0,0);ctx.lineTo(Math.cos(a)*17,Math.sin(a)*17);}ctx.stroke();ctx.restore();
  }
  for(const trip of trips){const phase=(clock-trip.start)/trip.duration;if(phase<0||phase>1)continue;const point=routePoint(HARBOUR_PATHS[trip.kind],reduced.matches?.3:phase);ctx.save();ctx.globalAlpha=Math.min(1,phase*8,(1-phase)*8);if(trip.kind==='cargo')boat(point,clock,true);else person(point,clock,true,trip.kind==='bakery'?'#d9d4bd':'#b4bda6',1.1);ctx.restore();}
  for(const project of s.construction)scaffold(project);
  if(!reduced.matches)for(const flash of flashes){const age=clock-flash.start;if(age<0||age>3)continue;ctx.save();ctx.globalAlpha=Math.min(1,3-age);ctx.font='500 15px system-ui';ctx.textAlign='center';const w=ctx.measureText(flash.text).width+20;ctx.fillStyle='#f6f4e8ed';ctx.fillRect(flash.x-w/2,flash.y-20-age*8,w,27);ctx.fillStyle='#3d5e50';ctx.fillText(flash.text,flash.x,flash.y-age*8);ctx.restore();}
  trips=trips.filter(t=>clock-t.start<t.duration);flashes=flashes.filter(f=>clock-f.start<3);
 }
 function frame(now){const dt=Math.min((now-lastFrame)/1000,.25);lastFrame=now;if(!isPaused())clock+=dt*getState().speed;if(Math.abs(clock-getState().seconds)>.75)clock=getState().seconds;if(!document.hidden&&now-lastPaint>=(reduced.matches?200:33)){paint();lastPaint=now;}frameId=requestAnimationFrame(frame);}
 frameId=requestAnimationFrame(frame);
 return {emit,reset,destroy(){cancelAnimationFrame(frameId);observer.disconnect();}};
}
