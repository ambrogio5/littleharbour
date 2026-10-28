const HARBOUR_PATHS={
 harvest:[[250,250],[330,280],[410,310],[500,365]],
 mill:[[530,385],[610,405],[700,435],[815,449]],
 bakery:[[835,451],[940,454],[1045,493],[1180,520]],
 olives:[[1160,300],[1040,360],[860,420],[670,490],[450,560],[335,585]],
 press:[[340,585],[490,535],[675,478],[850,448],[1035,490],[1180,520]],
 fish:[[700,655],[675,595],[720,525],[850,478],[1035,490],[1180,520]],
 cargo:[[1195,594],[1120,650],[1020,742],[865,860],[685,1045]],
 fishing:[[800,735],[965,810],[1160,890],[1080,960],[890,870],[800,735]],
 village:[[760,240],[700,315],[610,370],[680,415],[830,450]]
};
export function routePoint(points,t){
 const lengths=points.slice(1).map((p,i)=>Math.hypot(p[0]-points[i][0],p[1]-points[i][1]));
 const total=lengths.reduce((a,b)=>a+b,0);let distance=Math.max(0,Math.min(1,t))*total;
 for(let i=0;i<lengths.length;i++){if(distance<=lengths[i]||i===lengths.length-1){const f=lengths[i]?distance/lengths[i]:0,a=points[i],b=points[i+1];return {x:a[0]+(b[0]-a[0])*f,y:a[1]+(b[1]-a[1])*f,angle:Math.atan2(b[1]-a[1],b[0]-a[0])};}distance-=lengths[i];}
 return {x:points[0][0],y:points[0][1],angle:0};
}
export function constructionStage(left,duration=8){return left>duration*2/3?'foundation':left>duration/3?'frame':'finishing';}
export function createHarbourScene(canvas,getState,isPaused,getDuration=()=>14){
 const ctx=canvas.getContext('2d');if(!ctx)return {emit(){},reset(){}};
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let clock=getState().seconds,lastFrame=performance.now(),lastPaint=0,frameId,trips=[],flashes=[],width=0,height=0;
 function resize(){const box={width:canvas.parentElement.clientWidth,height:canvas.parentElement.clientHeight},dpr=Math.min(devicePixelRatio||1,2);width=box.width;height=box.height;canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);}
 const observer=new ResizeObserver(resize);observer.observe(canvas.parentElement);resize();
 function emit(type,detail){
  if(type==='milestone'){flashes.push({text:detail==='delivery'?'First trade complete':detail==='pier'?'New routes open':'Business open',x:detail==='olive'?360:detail==='fishing'?720:1190,y:detail==='olive'?565:detail==='fishing'?650:500,start:clock});}
  else if(type==='shipment'){trips.push({kind:'cargo',start:clock,duration:18,detail});flashes.push({text:'Shipment departing',x:1190,y:580,start:clock});}
  else if(type==='harvest'){trips.push({kind:'harvest',start:clock,duration:8});flashes.push({text:'+6 wheat',x:270,y:230,start:clock});}
  else if(type==='produced'){
   const kind=({flour:'mill',bread:'bakery',olives:'olives',oil:'press',fish:'fish',wheat:'harvest',planks:'mill',boatparts:'fish',grapes:'olives',wine:'press'})[detail];
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
 function scaffold(project,point,duration=8){
  const positions={olive:[350,565],fishing:[700,650],pier:[1340,625],storehouse:[1300,460],boatyard:[1300,470],estate:[1130,260],charter:[770,220]};
  const [x,y]=point||positions[project.type],stage=constructionStage(project.left,duration),progress=1-project.left/duration;
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
  for(let i=0;i<4;i++){const p=((phase*.22+i*.25)%1);ctx.fillStyle=`rgba(231,232,214,${.26*(1-p)})`;ctx.beginPath();ctx.ellipse(895+Math.sin(p*5)*7,276-p*70,5+p*15,7+p*12,0,0,Math.PI*2);ctx.fill();}
 }
 function water(s){
  if(reduced.matches)return;
  ctx.save();ctx.beginPath();
  const edge=[[1536,735],[1440,728],[1350,695],[1335,650],[1400,600],[1270,587],[1040,575],[1030,505],[950,515],[845,570],[770,630],[742,690],[765,740],[708,820],[780,875],[840,980],[855,1024],[1536,1024]];
  edge.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.clip();
  for(let i=0;i<40;i++){const x=760+(i*127%800),y=540+(i*83%500),phase=clock*.45+i*.63,drift=Math.sin(phase)*10;if(s.waterfront?.stage>=2&&x<1050&&y<600)continue;ctx.strokeStyle=`rgba(218,237,221,${.025+.055*(.5+.5*Math.sin(phase))})`;ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(x+drift,y);ctx.quadraticCurveTo(x+17+drift,y-3,x+36+drift,y+1);ctx.stroke();}
  ctx.restore();
 }
 function paint(){
  const s=getState();ctx.setTransform(canvas.width/1536,0,0,canvas.height/1024,0,0);ctx.clearRect(0,0,1536,1024);
  water(s);
  // Small residents continue their routes independently of the production queue.
  for(let i=0;i<2;i++){const phase=reduced.matches?.25:((clock/(30+i*9)+i*.43)%1);const p=routePoint(HARBOUR_PATHS.village,phase<.5?phase*2:2-phase*2);person(p,clock+i,false,i?'#aaa48a':'#c2c2ad',.9);}
  smoke(s);
  const fishing=s.jobs.find(j=>j.key==='fishing');if(fishing)boat(routePoint(HARBOUR_PATHS.fishing,1-fishing.left/getDuration(s,'fishing')),clock,false);
  if(s.jobs.some(j=>j.key==='mill')){
   ctx.save();ctx.translate(428,346);ctx.scale(.69,1);ctx.rotate(reduced.matches?0:clock*.8);ctx.strokeStyle='#a6906c75';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,35,0,Math.PI*2);for(let i=0;i<8;i++){const a=i*Math.PI/4;ctx.moveTo(0,0);ctx.lineTo(Math.cos(a)*35,Math.sin(a)*35);}ctx.stroke();ctx.restore();
  }
  for(const trip of trips){const phase=(clock-trip.start)/trip.duration;if(phase<0||phase>1)continue;const point=routePoint(HARBOUR_PATHS[trip.kind],reduced.matches?.3:phase);ctx.save();ctx.globalAlpha=Math.min(1,phase*8,(1-phase)*8);if(trip.kind==='cargo')boat(point,clock,true);else person(point,clock,true,trip.kind==='bakery'?'#d9d4bd':'#b4bda6',1.1);ctx.restore();}
  for(const project of s.construction)scaffold(project);
  if(s.waterfront?.left>0)scaffold({left:s.waterfront.left},[[900,450],[850,520],[1370,480]][s.waterfront.stage],12);
  if(!reduced.matches)for(const flash of flashes){const age=clock-flash.start;if(age<0||age>3)continue;ctx.save();ctx.globalAlpha=Math.min(1,3-age);ctx.font='500 15px system-ui';ctx.textAlign='center';const w=ctx.measureText(flash.text).width+20;ctx.fillStyle='#f6f4e8ed';ctx.fillRect(flash.x-w/2,flash.y-20-age*8,w,27);ctx.fillStyle='#3d5e50';ctx.fillText(flash.text,flash.x,flash.y-age*8);ctx.restore();}
  trips=trips.filter(t=>clock-t.start<t.duration);flashes=flashes.filter(f=>clock-f.start<3);
 }
 function frame(now){const dt=Math.min((now-lastFrame)/1000,.25);lastFrame=now;if(!isPaused())clock+=dt*getState().speed;if(Math.abs(clock-getState().seconds)>.75)clock=getState().seconds;if(!document.hidden&&now-lastPaint>=(reduced.matches?200:33)){paint();lastPaint=now;}frameId=requestAnimationFrame(frame);}
 frameId=requestAnimationFrame(frame);
 return {emit,reset,destroy(){cancelAnimationFrame(frameId);observer.disconnect();}};
}


// District-local activity follows actual construction, cooking and deliveries.
export function createMarketScene(canvas,getState,isPaused,plots){
 const ctx=canvas.getContext('2d');if(!ctx)return {emit(){},reset(){}};
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');let frameId,lastPaint=0,trips=[],seen={};
 const anchors=Object.fromEntries(plots.filter(p=>p.business).map(p=>[p.business,p.roadPoint]));
 function resize(){const box={width:canvas.parentElement.clientWidth,height:canvas.parentElement.clientHeight},dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.max(1,Math.round(box.width*dpr));canvas.height=Math.max(1,Math.round(box.height*dpr));}
 const observer=new ResizeObserver(resize);observer.observe(canvas.parentElement);resize();
 function reset(){trips=[];seen=Object.fromEntries(Object.entries(getState().market.businesses).map(([key,b])=>[key,b.deliveries]));}
 function emit(type){if(!anchors[type])return;seen[type]=getState().market.businesses[type]?.deliveries||0;trips.push({type,start:getState().seconds});trips=trips.slice(-6);}
 function worker(x,y,time,carrying=false){ctx.save();ctx.translate(x,y);ctx.fillStyle='#334b3f35';ctx.beginPath();ctx.ellipse(3,5,10,4,0,0,Math.PI*2);ctx.fill();const stride=reduced.matches?0:Math.sin(time*6)*3;ctx.strokeStyle='#4e5145';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-3,-1);ctx.lineTo(-4+stride,7);ctx.moveTo(3,-1);ctx.lineTo(4-stride,7);ctx.stroke();ctx.fillStyle='#b7b19b';ctx.fillRect(-5,-16,10,17);ctx.fillStyle='#ac896b';ctx.beginPath();ctx.arc(0,-21,4,0,Math.PI*2);ctx.fill();ctx.fillStyle='#8e805c';ctx.fillRect(-6,-26,12,3);if(carrying){ctx.fillStyle='#a98e60';ctx.fillRect(5,-12,13,11);ctx.strokeStyle='#716344';ctx.lineWidth=1;ctx.strokeRect(5,-12,13,11);}ctx.restore();}
 function paint(){const s=getState(),time=s.seconds;ctx.setTransform(canvas.width/1536,0,0,canvas.height/1024,0,0);ctx.clearRect(0,0,1536,1024);if(!s.market.access)return;
  if(s.market.left>0){worker(245,520,time,true);worker(300,535,time+1);ctx.fillStyle='#aa926d';for(let i=0;i<4;i++)ctx.fillRect(250+i*13,550-i*3,12,7);}
  for(const p of plots){if(!p.business)continue;const b=s.market.businesses[p.business];if(!b)continue;if(b.left){worker(p.construction.x-25,p.construction.y+25,time,true);worker(p.construction.x+30,p.construction.y+15,time+1);}
   if(b.deliveries>(seen[p.business]||0))emit(p.business);seen[p.business]=b.deliveries;
  }
  for(const trip of trips){const age=time-trip.start;if(age<0||age>8)continue;const a=anchors[trip.type],t=reduced.matches?.5:age/8;worker(786+(a.x-786)*t,413+(a.y-413)*t,time,true);}
  trips=trips.filter(t=>time-t.start<8);
  if(s.jobs.some(j=>j.key==='provisions'))for(let i=0;i<3;i++){const t=reduced.matches?.4:(time*.18+i/3)%1;ctx.fillStyle=`rgba(238,236,217,${.28*(1-t)})`;ctx.beginPath();ctx.ellipse(1237+Math.sin(t*4)*7,214-t*55,5+t*9,5+t*11,0,0,Math.PI*2);ctx.fill();}
 }
 function frame(now){if(!document.hidden&&now-lastPaint>(reduced.matches?200:40)){if(!isPaused())paint();lastPaint=now;}frameId=requestAnimationFrame(frame);}
 reset();frameId=requestAnimationFrame(frame);return {emit,reset,destroy(){cancelAnimationFrame(frameId);observer.disconnect();}};
}
