import {WORLD_LAYOUT} from '../world-model.js?v=0.20.1';
import {createEvolution,applyChoice,advanceSeason,currentEvent,resolveEvent,deriveWorldStyle,ACTIONS,serializeEvolution,restoreEvolution} from './evolution.js';
const {size:WORLD,sites:SITES,regions:REGIONS}=WORLD_LAYOUT;
const $=id=>document.getElementById(id);
const map=$('map'),overlay=$('overlay');let surface=$('surface');
const scene=document.createElement('canvas');scene.width=900;scene.height=1350;
const atlas=document.createElement('canvas');atlas.width=256;atlas.height=64;
const renderMode=$('renderer');
const STAGES=['unbuilt','building','built','upgraded'];
const STAGE_LABELS={unbuilt:'Open plot',building:'Under construction',built:'Working building',upgraded:'Expanded building'};
const PICKABLE=['field','mill','bakery','olive','fishing','pier','specialist','waterfront','lighthouse','ferry'];
let evolution=createEvolution(), construction={field:2,mill:2,bakery:2}, selected='pier';
let camera={scale:.24,x:0,y:0},pointerStates=new Map(),drag=null,pinch=null,didMove=false;
let renderer=null,glFailure='',spriteCount=0,frameTimes=[],drawCount=0,lastTime=0,metricsAt=0;
let trees=[];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function random(seed){let s=seed>>>0;return ()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};}

const paint=(ctx,c)=>{ctx.fillStyle=c;ctx.strokeStyle=c;};
const ellipse=(ctx,x,y,rx,ry,color)=>{ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();};
const polygon=(ctx,pts,color)=>{ctx.beginPath();ctx.moveTo(...pts[0]);pts.slice(1).forEach(p=>ctx.lineTo(...p));ctx.closePath();paint(ctx,color);ctx.fill();};
function path(ctx,pts,color,width=8){ctx.beginPath();ctx.moveTo(...pts[0]);pts.slice(1).forEach(p=>ctx.lineTo(...p));ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke();}
function landPath(ctx){ctx.beginPath();ctx.moveTo(355,35);ctx.bezierCurveTo(670,20,1060,10,1330,160);ctx.bezierCurveTo(1530,360,1580,640,1530,830);ctx.bezierCurveTo(1725,1090,1720,1390,1600,1570);ctx.bezierCurveTo(1570,1720,1730,1890,1600,2060);ctx.bezierCurveTo(1705,2260,1560,2590,1280,2660);ctx.bezierCurveTo(1050,2630,850,2600,660,2460);ctx.bezierCurveTo(380,2380,290,2220,235,1970);ctx.bezierCurveTo(75,1810,110,1560,160,1340);ctx.bezierCurveTo(60,1010,215,850,230,640);ctx.bezierCurveTo(145,340,210,130,355,35);ctx.closePath();}
function building(ctx,x,y,scale=1,roof='#c46f49',body='#f1dfbe',windows=true){
  ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);
  ellipse(ctx,5,20,69,21,'#4f655032');
  polygon(ctx,[[-43,-18],[0,-42],[54,-20],[11,2]],'#ebdebc');
  polygon(ctx,[[-43,-18],[11,2],[11,51],[-43,30]],body);
  polygon(ctx,[[11,2],[54,-20],[54,25],[11,51]],'#cdbb9f');
  polygon(ctx,[[-53,-23],[0,-60],[65,-27],[11,9]],roof);
  polygon(ctx,[[11,9],[65,-27],[65,-17],[11,18]],'#9b543d');
  if(windows){for(const xx of [-23,-2]){paint(ctx,'#657f78');ctx.fillRect(xx,0,8,12);ctx.fillRect(xx,20,8,12);}paint(ctx,'#56716a');ctx.fillRect(31,4,9,13);}
  ctx.restore();
}
function drawPlot(ctx,site,phase,style){const {x,y,kind}=site;ctx.save();ellipse(ctx,x+15,y+36,105,43,'#68744a32');
 if(phase===0){ctx.setLineDash([16,12]);ctx.strokeStyle='#b69a67';ctx.lineWidth=8;ctx.strokeRect(x-57,y-47,114,85);ctx.setLineDash([]);ellipse(ctx,x,y,18,9,'#bca078');}
 else if(phase===1){ctx.fillStyle='#d3b48b';ctx.fillRect(x-61,y-15,127,40);polygon(ctx,[[x-60,y-18],[x,y-55],[x+60,y-18],[x,y+10]],'#b7b1a0');ctx.strokeStyle='#9c653c';ctx.lineWidth=6;for(let i=-1;i<=1;i++)path(ctx,[[x+i*29-15,y-44],[x+i*29-15,y+25]],'#aa7b47',5);}
 else {const roofs=['#a96440','#c2744b','#b76745','#bb7656'];const roof=roofs[(x+y)%4|0];building(ctx,x,y,kind==='lighthouse'?.72:1.1,roof,'#eddfc3');if(kind==='lighthouse'){paint(ctx,'#f1e3c7');ctx.fillRect(x-10,y-123,26,78);polygon(ctx,[[x-22,y-125],[x+29,y-125],[x+10,y-146],[x-8,y-146]],'#b7694a');}if(kind==='pier'||kind==='ferry'){path(ctx,[[x,y+38],[x+60,y+105],[x+100,y+140]],'#e4d6b8',27);}if(phase===3){building(ctx,x+78,y+28,.55,'#b76545','#eee0c5');}}
 ctx.restore();}
function drawScene(style){const rand=random(7792);const ctx=scene.getContext('2d',{alpha:false});ctx.setTransform(.5,0,0,.5,0,0);
 const sea=ctx.createLinearGradient(0,0,1800,2300);sea.addColorStop(0,'#5b9fab');sea.addColorStop(.47,'#87c2c6');sea.addColorStop(1,'#467e9a');ctx.fillStyle=sea;ctx.fillRect(0,0,1800,2700);
 for(let i=0;i<440;i++){const x=rand()*1800,y=rand()*2700;ellipse(ctx,x,y,10+rand()*60,1+rand()*2,'#ecf5dd15');}
 ctx.save();ctx.shadowColor='#173f4f70';ctx.shadowOffsetY=22;ctx.shadowBlur=25;landPath(ctx);ctx.fillStyle='#d9c59c';ctx.fill();ctx.restore();
 ctx.save();landPath(ctx);ctx.clip();
 const soil=ctx.createLinearGradient(100,0,1500,2700);soil.addColorStop(0,'#748f65');soil.addColorStop(.4,'#aab17e');soil.addColorStop(.74,'#d0c59d');soil.addColorStop(1,'#b9b38a');ctx.fillStyle=soil;ctx.fillRect(0,0,1800,2700);
 // Hill ridges and cultivated terraces in the actual inland district.
 for(let i=0;i<11;i++){const y=60+i*66;path(ctx,[[260+i%3*9,y],[570,y+50],[990,y+36],[1450,y+160]],i%2?'#e4d29b6e':'#4c735244',15+i%3*5);}
 for(let i=0;i<10;i++){const x=320+i*116;const y=130+(i%3)*90;polygon(ctx,[[x,y],[x+90,y+12],[x+68,y+120],[x-20,y+100]],i%2?'#a6a875':'#c0b47e');}
 // Dry stone roads connect five canonical regions without loading obsolete district PNGs.
 const roads=[[[930,500],[1080,770],[1290,1020],[1250,1360],[1010,1640],[900,1950]],[[310,1140],[580,1220],[920,1290],[1250,1360]],[[900,1950],[600,2050],[450,2240]],[[900,1950],[1330,1910],[1470,2080],[1440,2330]],[[550,300],[520,710],[420,1030],[310,1140]]];
 for(const pts of roads){path(ctx,pts,'#6f765263',58);path(ctx,pts,'#e9d9b8',38);path(ctx,pts,'#ceb995',12);}
 // Organic town clusters, with emphasis on neighbourhood and market positions.
 const clusters=[{x:465,y:1210,n:26,s:120},{x:1180,y:1280,n:29,s:130},{x:665,y:1850,n:19,s:125}];
 for(const cl of clusters){for(let i=0;i<cl.n;i++){const x=cl.x+(rand()-.5)*cl.s*4,y=cl.y+(rand()-.5)*cl.s*3.2;building(ctx,x,y,.35+rand()*.27,['#ab6847','#c57d52','#cb875b','#ad7158'][i%4],['#f3e2c6','#e7d4af','#e6e0c7'][i%3]);}}
 // Agricultural fields, quay and coves are recognizable at whole-world zoom.
 polygon(ctx,[[390,375],[575,390],[590,545],[390,520]],'#d3b36c');for(let i=0;i<8;i++)path(ctx,[[395+i*23,393],[395+i*23,505]],'#e7d18d',5);
 polygon(ctx,[[350,780],[530,810],[505,900],[340,880]],'#858f5c');
 for(let i=0;i<6;i++)path(ctx,[[380,820+i*11],[495,824+i*11]],'#bac28b',4);
 path(ctx,[[400,2130],[540,2260],[1000,2320],[1330,2180],[1540,2140]],'#ecdebf',37);
 for(let i=0;i<style.marketStalls;i++)building(ctx,970+i*67,1390-i%2*35,.37,'#bd744d','#f4e1c1',false);
 for(let i=0;i<style.workshops;i++)building(ctx,1050+i*83,1460,.49,'#a9613e','#d2baa0');
 for(const [id,site]of Object.entries(SITES))drawPlot(ctx,site,construction[id]||0,style);
 // Accents linked directly to personality (not to arbitrary untracked RNG changes).
 for(let i=0;i<style.gardenBeds;i++)polygon(ctx,[[250+i*44,1435],[275+i*44,1440],[265+i*44,1470],[240+i*44,1465]],'#72965b');
 for(let i=0;i<style.lanterns;i++){const x=470+i*84,y=1990-(i%3)*34;path(ctx,[[x,y],[x,y-32]],'#675d50',4);ellipse(ctx,x,y-35,7,8,'#f7d78d');}
 // Dusty golden paths and labels are not baked into a monolithic background bitmap.
 for(let i=0;i<380;i++){const x=160+rand()*1430,y=70+rand()*2450;ellipse(ctx,x,y,1+rand()*5,1+rand()*3,i%2?'#fff2cb30':'#56785720');}
 ctx.restore();
 // Coastal islands and boat markers show the maritime extension.
 for(let i=0;i<4;i++){const x=1250+rand()*400,y=2240+rand()*400;ellipse(ctx,x,y,50+rand()*75,18+rand()*25,'#a2ad80');ellipse(ctx,x-5,y-8,31+rand()*30,9+rand()*13,'#d2c79d');}
 for(let i=0;i<style.tradeTraffic;i++){const x=900+i*112,y=2420+i%2*80;ellipse(ctx,x,y+17,44,9,'#3d747e8a');polygon(ctx,[[x-42,y],[x+37,y],[x+18,y+20],[x-21,y+20]],'#6d4d3f');path(ctx,[[x,y-4],[x,y-67]],'#5c5a4e',4);polygon(ctx,[[x+2,y-58],[x+40,y-9],[x+2,y-9]],'#e8e3d7');}
}
function createAtlas(){const c=atlas.getContext('2d');c.clearRect(0,0,256,64);const kinds=[['#607b56','#758e64'],['#3e6f5f','#507d69'],['#bb774e','#e0c9a8'],['#bd9e6e','#8ba579']];
 for(let i=0;i<4;i++){const x=i*64;c.save();c.translate(x,0);c.fillStyle='#253c3840';c.beginPath();c.ellipse(33,54,21,6,0,0,Math.PI*2);c.fill();if(i<2){c.strokeStyle='#745943';c.lineWidth=6;c.beginPath();c.moveTo(32,49);c.lineTo(30,27);c.stroke();for(let j=0;j<7;j++){const theta=j*2.4;ellipse(c,32+Math.cos(theta)*13,24+Math.sin(theta)*9,12,11,kinds[i][j%2]);}ellipse(c,29,21,13,11,'#9fac7b77');}else if(i===2){polygon(c,[[8,32],[32,17],[56,30],[33,45]],kinds[i][0]);polygon(c,[[16,37],[33,45],[33,54],[16,46]],kinds[i][1]);}else{polygon(c,[[5,41],[33,32],[58,42],[48,54],[13,51]],'#8b634c');path(c,[[32,32],[32,1]],'#776657',3);polygon(c,[[34,5],[54,35],[34,35]],'#e5e1d5');}c.restore();}
}
function generateSprites(style){const r=random(997);const list=[];const count=300+style.oliveDensity*11;for(let i=0;i<count;i++){let x,y;const zone=i%4;if(zone===0){x=275+r()*1100;y=90+r()*730;}else if(zone===1){x=170+r()*680;y=905+r()*650;}else if(zone===2){x=950+r()*550;y=925+r()*500;}else{x=260+r()*1050;y=1710+r()*530;}list.push({x,y,size:29+r()*49,type:i%7===0?1:0,phase:r()*6.28});}trees=list;spriteCount=trees.length;}
function compile(gl,type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;}
function program(gl,v,f){const p=gl.createProgram();gl.attachShader(p,compile(gl,gl.VERTEX_SHADER,v));gl.attachShader(p,compile(gl,gl.FRAGMENT_SHADER,f));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));return p;}
class WebGLRenderer{
 constructor(canvas){this.gl=canvas.getContext('webgl2',{alpha:false,antialias:true,premultipliedAlpha:false,preserveDrawingBuffer:false});if(!this.gl)throw new Error('WebGL2 unavailable');const gl=this.gl;
 this.bg=program(gl,`#version 300 es\nin vec2 a_world;in vec2 a_uv;uniform vec2 u_view;uniform vec2 u_offset;uniform float u_zoom;out vec2 v_uv;void main(){vec2 px=a_world*u_zoom+u_offset;gl_Position=vec4(px.x/u_view.x*2.0-1.0,1.0-px.y/u_view.y*2.0,0,1);v_uv=a_uv;}`,`#version 300 es\nprecision mediump float;uniform sampler2D u_texture;in vec2 v_uv;out vec4 color;void main(){color=texture(u_texture,v_uv);}`);
 this.sprites=program(gl,`#version 300 es\nin vec2 a_pos;in float a_size;in float a_type;in float a_phase;uniform vec2 u_view;uniform vec2 u_offset;uniform float u_zoom;uniform float u_time;flat out float v_type;void main(){vec2 wobble=vec2(sin(u_time*.0015+a_phase)*2.6,0.0);vec2 px=(a_pos+wobble)*u_zoom+u_offset;gl_Position=vec4(px.x/u_view.x*2.0-1.0,1.0-px.y/u_view.y*2.0,0,1);gl_PointSize=clamp(a_size*u_zoom,1.0,64.0);v_type=a_type;}`,`#version 300 es\nprecision mediump float;uniform sampler2D u_texture;flat in float v_type;out vec4 color;void main(){vec2 uv=vec2((v_type+gl_PointCoord.x)*.25,gl_PointCoord.y);color=texture(u_texture,uv);if(color.a<.15)discard;}`);
 this.bgBuffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,this.bgBuffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([0,0,0,0,WORLD.w,0,1,0,0,WORLD.h,0,1,WORLD.w,0,1,0,WORLD.w,WORLD.h,1,1,0,WORLD.h,0,1]),gl.STATIC_DRAW);
 this.spriteBuffer=gl.createBuffer();this.bgTex=this.texture(scene);this.spriteTex=this.texture(atlas);
 gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();glFailure='WebGL context lost';renderMode.value='canvas';switchRenderer();});
 }
 texture(source){const gl=this.gl,t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,source);return t;}
 updateScene(){const gl=this.gl;gl.bindTexture(gl.TEXTURE_2D,this.bgTex);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,scene);}
 updateSprites(){const gl=this.gl,points=new Float32Array(trees.length*5);trees.forEach((p,i)=>points.set([p.x,p.y,p.size,p.type,p.phase],i*5));gl.bindBuffer(gl.ARRAY_BUFFER,this.spriteBuffer);gl.bufferData(gl.ARRAY_BUFFER,points,gl.DYNAMIC_DRAW);}
 draw(time){const gl=this.gl,view=[surface.clientWidth,surface.clientHeight];gl.viewport(0,0,surface.width,surface.height);gl.clearColor(.36,.64,.69,1);gl.clear(gl.COLOR_BUFFER_BIT);
 gl.useProgram(this.bg);gl.uniform2fv(gl.getUniformLocation(this.bg,'u_view'),view);gl.uniform2fv(gl.getUniformLocation(this.bg,'u_offset'),[camera.x,camera.y]);gl.uniform1f(gl.getUniformLocation(this.bg,'u_zoom'),camera.scale);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,this.bgTex);gl.uniform1i(gl.getUniformLocation(this.bg,'u_texture'),0);gl.bindBuffer(gl.ARRAY_BUFFER,this.bgBuffer);for(const [name,n,stride,offset] of [['a_world',2,16,0],['a_uv',2,16,8]]){const a=gl.getAttribLocation(this.bg,name);gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,n,gl.FLOAT,false,stride,offset);}gl.drawArrays(gl.TRIANGLES,0,6);
 gl.useProgram(this.sprites);gl.uniform2fv(gl.getUniformLocation(this.sprites,'u_view'),view);gl.uniform2fv(gl.getUniformLocation(this.sprites,'u_offset'),[camera.x,camera.y]);gl.uniform1f(gl.getUniformLocation(this.sprites,'u_zoom'),camera.scale);gl.uniform1f(gl.getUniformLocation(this.sprites,'u_time'),time);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,this.spriteTex);gl.uniform1i(gl.getUniformLocation(this.sprites,'u_texture'),0);gl.bindBuffer(gl.ARRAY_BUFFER,this.spriteBuffer);for(const [name,offset] of [['a_pos',0],['a_size',8],['a_type',12],['a_phase',16]]){const a=gl.getAttribLocation(this.sprites,name);gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,name==='a_pos'?2:1,gl.FLOAT,false,20,offset);}gl.drawArrays(gl.POINTS,0,trees.length);drawCount=2;
 }
}
class CanvasRenderer{constructor(canvas){this.ctx=canvas.getContext('2d',{alpha:false});if(!this.ctx)throw new Error('Canvas2D unavailable');}updateScene(){}updateSprites(){}draw(time){const c=this.ctx,dpr=surface.width/surface.clientWidth;c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,surface.clientWidth,surface.clientHeight);c.fillStyle='#7aafb5';c.fillRect(0,0,surface.clientWidth,surface.clientHeight);c.save();c.translate(camera.x,camera.y);c.scale(camera.scale,camera.scale);c.drawImage(scene,0,0,WORLD.w,WORLD.h);for(const t of trees){const size=t.size;const wobble=Math.sin(time*.0015+t.phase)*2.6;c.drawImage(atlas,t.type*64,0,64,64,t.x-size/2+wobble,t.y-size/2,size,size);}c.restore();drawCount=trees.length+1;}}
function resize(){const bounds=map.getBoundingClientRect(),dpr=Math.min(2,window.devicePixelRatio||1);surface.width=Math.max(1,Math.round(bounds.width*dpr));surface.height=Math.max(1,Math.round(bounds.height*dpr));updatePins();}
function switchRenderer(){const mode=renderMode.value;const old=surface;const fresh=old.cloneNode(false);old.replaceWith(fresh); // Canvas context type cannot be switched on one element.
 renderer=null;surface=fresh;resize();try{renderer=mode==='webgl'?new WebGLRenderer(surface):new CanvasRenderer(surface);renderer.updateSprites();}catch(e){glFailure=String(e.message);renderMode.value='canvas';renderer=new CanvasRenderer(surface);renderer.updateSprites();}updatePins();}
function rebuild(){const style=deriveWorldStyle(evolution);drawScene(style);generateSprites(style);if(renderer){renderer.updateScene();renderer.updateSprites();}renderState();}
function fit(){const w=map.clientWidth,h=map.clientHeight;camera.scale=Math.min(w/WORLD.w,h/WORLD.h)*.94;camera.x=(w-WORLD.w*camera.scale)/2;camera.y=(h-WORLD.h*camera.scale)/2;updatePins();}
function constrain(){const w=map.clientWidth,h=map.clientHeight;camera.x=WORLD.w*camera.scale<w?(w-WORLD.w*camera.scale)/2:clamp(camera.x,w-WORLD.w*camera.scale,0);camera.y=WORLD.h*camera.scale<h?(h-WORLD.h*camera.scale)/2:clamp(camera.y,h-WORLD.h*camera.scale,0);}
function zoom(factor,point={x:map.clientWidth/2,y:map.clientHeight/2}){const z=clamp(camera.scale*factor,.09,1.5),r=z/camera.scale;camera.x=point.x-(point.x-camera.x)*r;camera.y=point.y-(point.y-camera.y)*r;camera.scale=z;constrain();updatePins();}
function updatePins(){overlay.replaceChildren();if(camera.scale<.2){for(const [id,region] of Object.entries(REGIONS)){const x=(region.x+region.w/2)*camera.scale+camera.x,y=(region.y+region.h/2)*camera.scale+camera.y;if(x<0||x>map.clientWidth||y<0||y>map.clientHeight)continue;const b=document.createElement('button');b.type='button';b.className='pin';b.textContent=region.name;b.style.left=x+'px';b.style.top=y+'px';b.addEventListener('click',()=>focusRegion(id));overlay.appendChild(b);}return;}
for(const id of PICKABLE){const site=SITES[id];if(!site)continue;const x=site.x*camera.scale+camera.x,y=site.y*camera.scale+camera.y;if(x<0||x>map.clientWidth||y<0||y>map.clientHeight)continue;const btn=document.createElement('button');btn.className='pin';btn.type='button';btn.setAttribute('aria-pressed',String(id===selected));btn.style.left=x+'px';btn.style.top=y+'px';btn.textContent=site.label||id;btn.dataset.id=id;btn.addEventListener('click',()=>{if(didMove)return;selected=id;renderState();updatePins();});overlay.appendChild(btn);}}
function focusRegion(id){const r=REGIONS[id];if(!r)return;camera.scale=clamp(Math.min(map.clientWidth/r.w,map.clientHeight/r.h)*.85,.2,1.5);camera.x=map.clientWidth/2-(r.x+r.w/2)*camera.scale;camera.y=map.clientHeight/2-(r.y+r.h/2)*camera.scale;constrain();updatePins();}
function renderState(){const style=deriveWorldStyle(evolution);$('townIdentity').textContent=style.identity+' · '+style.oliveDensity+' grove clusters · '+style.tradeTraffic+' trade vessels';$('season').textContent='Season '+evolution.season;
 $('axes').replaceChildren();for(const [name,value]of Object.entries(evolution.axes)){const div=document.createElement('div');div.className='axis';div.innerHTML=`<div class="axishead"><span>${name[0].toUpperCase()+name.slice(1)}</span><strong>${value}</strong></div><div class="track"><span style="width:${value}%"></span></div>`;$('axes').appendChild(div);}
 $('choices').replaceChildren();for(const [id,choice]of Object.entries(ACTIONS)){const b=document.createElement('button');b.type='button';b.textContent=choice.name;b.addEventListener('click',()=>{evolution=applyChoice(evolution,id);rebuild();});$('choices').appendChild(b);}
 const evt=currentEvent(evolution),e=$('event');e.hidden=!evt;e.replaceChildren();$('seasonNext').disabled=!!evt;if(evt){const strong=document.createElement('strong');strong.textContent=evt.title;const p=document.createElement('p');p.textContent=evt.description;e.append(strong,p);for(const option of evt.options){const b=document.createElement('button');b.textContent=option.label;b.addEventListener('click',()=>{evolution=resolveEvent(evolution,option.id);rebuild();});e.appendChild(b);}}
 const site=SITES[selected];$('selectedTitle').textContent=site?.label||selected;const phase=construction[selected]||0;$('selectedDescription').textContent=STAGE_LABELS[phase]+' · preview only, not saved to the main game';$('build').textContent=phase===3?'Reset site →':'Advance construction →';}
function renderStats(){const avg=frameTimes.reduce((a,b)=>a+b,0)/Math.max(1,frameTimes.length);$('metric').innerHTML=`<strong>${renderer instanceof WebGLRenderer?'WebGL2':'Canvas 2D'} · ${avg?Math.round(1000/avg):'—'} FPS</strong>${avg?avg.toFixed(1):'—'} ms/frame · ${drawCount} draws<br>${spriteCount} animated sprites<br>${Math.round(camera.scale*100)}% world zoom${glFailure?'<br>GPU fallback: '+glFailure:''}`;}
function tick(t){if(renderer){renderer.draw(t);if(lastTime){const dt=Math.min(200,t-lastTime);frameTimes.push(dt);if(frameTimes.length>90)frameTimes.shift();}lastTime=t;if(t-metricsAt>700){renderStats();metricsAt=t;}}requestAnimationFrame(tick);}
$('zoomIn').addEventListener('click',()=>zoom(1.3));$('zoomOut').addEventListener('click',()=>zoom(1/1.3));$('fit').addEventListener('click',fit);renderMode.addEventListener('change',switchRenderer);
$('build').addEventListener('click',()=>{construction[selected]=((construction[selected]||0)+1)%4;rebuild();});$('seasonNext').addEventListener('click',()=>{evolution=advanceSeason(evolution);rebuild();});
$('reset').addEventListener('click',()=>{evolution=createEvolution();construction={field:2,mill:2,bakery:2};selected='pier';rebuild();fit();});
$('save').addEventListener('click',()=>{const data=serializeEvolution(evolution),blob=new Blob([data],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='little-harbour-evolution-lab.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
const at=e=>{const r=map.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top};};
map.addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;map.setPointerCapture(e.pointerId);pointerStates.set(e.pointerId,at(e));didMove=false;if(pointerStates.size===1){drag={start:at(e),cam:{...camera}};}else if(pointerStates.size===2){const [a,b]=[...pointerStates.values()];pinch={dist:Math.hypot(a.x-b.x,a.y-b.y),mid:{x:(a.x+b.x)/2,y:(a.y+b.y)/2},cam:{...camera}};}});
map.addEventListener('pointermove',e=>{if(!pointerStates.has(e.pointerId))return;pointerStates.set(e.pointerId,at(e));if(pointerStates.size===2&&pinch){const [a,b]=[...pointerStates.values()],mid={x:(a.x+b.x)/2,y:(a.y+b.y)/2};camera={...pinch.cam};const z=clamp(pinch.cam.scale*Math.hypot(a.x-b.x,a.y-b.y)/Math.max(1,pinch.dist),.09,1.5),r=z/pinch.cam.scale;camera.scale=z;camera.x=mid.x-(pinch.mid.x-pinch.cam.x)*r;camera.y=mid.y-(pinch.mid.y-pinch.cam.y)*r;didMove=true;}else if(drag){const p=at(e);camera.x=drag.cam.x+p.x-drag.start.x;camera.y=drag.cam.y+p.y-drag.start.y;didMove=Math.hypot(p.x-drag.start.x,p.y-drag.start.y)>4;}constrain();updatePins();});
const up=e=>{pointerStates.delete(e.pointerId);if(pointerStates.size<2)pinch=null;if(pointerStates.size===0)drag=null;else{const p=[...pointerStates.values()][0];drag={start:p,cam:{...camera}};}if(map.hasPointerCapture(e.pointerId))map.releasePointerCapture(e.pointerId);};
map.addEventListener('pointerup',up);map.addEventListener('pointercancel',up);
map.addEventListener('wheel',e=>{e.preventDefault();zoom(Math.exp(-e.deltaY*.0015),{x:e.offsetX,y:e.offsetY});},{passive:false});
map.addEventListener('keydown',e=>{const dx={ArrowLeft:45,ArrowRight:-45,ArrowUp:0,ArrowDown:0}[e.key];if(dx!==undefined){camera.x+=dx;camera.y+=e.key==='ArrowUp'?45:e.key==='ArrowDown'?-45:0;constrain();updatePins();e.preventDefault();}else if(e.key==='+'||e.key==='-'){zoom(e.key==='+'?1.3:1/1.3);e.preventDefault();}});
const ro=new ResizeObserver(()=>{resize();constrain();updatePins();});ro.observe(map);
createAtlas();drawScene(deriveWorldStyle(evolution));generateSprites(deriveWorldStyle(evolution));resize();switchRenderer();fit();renderState();requestAnimationFrame(tick);
