// Little Harbour — original layered 2.5D architecture sprites, version 1.
// All geometry is site-local in a 220x220 coordinate frame and built from
// independent SVG elements so construction and upgrade states remain real.
const f=n=>Math.round(n*10)/10;
const path=(d,fill,stroke='',width=1)=>'<path d="'+d+'" fill="'+fill+'"'+(stroke?' stroke="'+stroke+'" stroke-width="'+width+'" stroke-linejoin="round"':'')+'/>';
const P={
 limestone:'#ead9b8',sun:'#f6e6c8',shade:'#b9a88d',stone:'#918c7a',
 roofs:['#b26e4d','#bd7955','#995b42','#c58a61'],roofLight:'#d69a70',
 wood:'#956844',dark:'#344f4c',olive:'#697e5a',lightOlive:'#9baa7e',
 sea:'#286b76',cloth:'#f2e9d8',gold:'#dfb878'
};
function ground(kind='stone'){
 const color=kind==='grass'?'#a0a77d':kind==='sand'?'#d6c09b':'#d6c3a2';
 let s='<ellipse cx="8" cy="59" rx="111" ry="42" fill="#1e3938" opacity=".18"/>';
 s+=path('M-100 20L-15 -33 105 13 18 70Z',color,'#eee0c2',3);
 s+=path('M-100 20L18 70v12L-100 31Z','#ac9a7b');
 s+=path('M18 70L105 13v13L18 82Z','#998973');
 for(let i=0;i<10;i++){const x=-80+i*17,y=16+Math.sin(i*2.1)*15;s+=path('M'+f(x)+' '+f(y)+'l8 4', 'none','#f1ddba',1.3);}
 return s;
}
function potted(x,y,flower=false){
 let s='<g transform="translate('+x+' '+y+')">';
 s+=path('M-13 4l4 21h18l4 -21Z','#bd8c68','#815f4a',2);
 s+=path('M-16 1Q0 -7 16 1L11 7Q0 1 -11 7Z','#e0b68b');
 for(let i=0;i<8;i++){const a=i*6.283/8,cx=f(Math.cos(a)*12),cy=f(Math.sin(a)*10-9);s+='<ellipse cx="'+cx+'" cy="'+cy+'" rx="7" ry="4" fill="'+(i%2?'#71855a':'#9aab70')+'" transform="rotate('+f(a*57)+','+cx+','+cy+')"/>';}
 if(flower)for(let i=0;i<5;i++){const a=i*6.283/5;s+='<circle cx="'+f(Math.cos(a)*12)+'" cy="'+f(Math.sin(a)*8-13)+'" r="4" fill="#c36b85"/>';}
 return s+'</g>';
}
function roofTiles(){
 let s='';
 for(let row=0;row<5;row++){
  for(let col=0;col<9;col++){
   const x=-65+col*13+row*4,y=-56+row*8-col*4;
   s+=path('M'+x+' '+y+'q7 -3 12 4', 'none',col%3===0?'#f0b18a':'#d08b63',1.6);
  }
 }
 return s;
}
function vine(x,y){
 let s='<g transform="translate('+x+' '+y+')">';
 s+=path('M0 21Q-12 -5 0 -34T-7 -89','none','#64784e',4);
 for(let i=0;i<11;i++){
  const px=Math.sin(i*1.9)*11,py=17-i*10;
  s+='<ellipse cx="'+f(px)+'" cy="'+py+'" rx="7" ry="4" fill="'+(i%3?'#687c51':'#a0ab74')+'" transform="rotate('+(i%2?35:-35)+','+f(px)+','+py+')"/>';
 }
 for(let i=0;i<5;i++)s+='<circle cx="'+(i%2?5:-6)+'" cy="'+(-20-i*11)+'" r="3" fill="#c06e84"/>';
 return s+'</g>';
}
function walls(level=1,variant=0){
 const h=level>=3?105:level===2?92:75,w=74;
 let s=path('M-73 -15L0 25v'+h+'L-73 '+(h-15)+'Z',P.limestone,'#aa997f',2.5);
 s+=path('M0 25L76 -20V'+(h-20)+'L0 '+(h+25)+'Z',P.shade,'#938673',2.5);
 for(let y=4;y<h;y+=18){
  s+=path('M-73 '+(y-15)+'L0 '+(y+25),'none','#c9b99c',1.2);
  s+=path('M0 '+(y+25)+'L76 '+(y-20),'none','#a39a84',1);
 }
 for(let i=0;i<6;i++){
  s+=path('M'+(-65+i*11)+' '+(h-13+i%3*3)+'l6 3','none','#f6e8cb',1.2);
 }
 const roof=P.roofs[variant%P.roofs.length];
 s+=path('M-82 -22L-1 -74L86 -26L0 31Z',roof,'#8b5744',3);
 s+=path('M-82 -22L0 31L0 38L-83 -14Z','#8f5140');
 s+=path('M0 31L86 -26L86 -17L0 38Z','#9e614c');
 s+=path('M-75 -17L-1 -64L78 -22','none','#e2a37a',2.5);
 s+=roofTiles();
 s+=path('M-55 24l23 13v24l-23 -12ZM-13 48l17 9v32l-17 -9Z',P.dark,'#ebd2ac',2);
 s+=path('M19 48l23 -13v27L19 74ZM51 30l17 -11v20L51 50Z','#456362','#edd9b9',2);
 s+=path('M-45 29v26M27 49v20','none','#efe1c4',1.4);
 s+=path('M-3 66l17 10v'+(h-51)+'l-17 -10Z','#705d4a','#e7d2b0',2);
 if(level>=2){
  s+=path('M-55 -15l19 10v19l-19 -10ZM24 2l19 -10v18L24 23Z','#4c6967','#e7d2b0',2);
  s+=path('M-60 17l28 16M17 24l31 -17','none','#e3c6a5',3);
 }
 if(level>=3){
  s+=path('M10 -75v-31h20v25','#efe0bf','#91775f',2);
  s+=path('M-47 4l23 12','none','#9d775d',4);
 }
 return s;
}
function chimney(x=-40,y=-61){
 return '<g transform="translate('+x+' '+y+')">'+path('M0 1v-45l18 5v45Z','#c6a68c','#947a66',2)+path('M-2 -45l11 -7 13 7-11 5Z','#a6634b')+
 path('M7 -53q-14 -24 8 -32q-14 -13 -5 -24','none','#c8c8bf',7)+'</g>';
}
function wheel(x=70,y=39){
 let s='<g transform="translate('+x+' '+y+')"><circle r="32" fill="#4e645e" opacity=".25"/><circle r="29" fill="#865d40" stroke="#d0aa77" stroke-width="7"/><circle r="21" fill="#9e7550" stroke="#6c543e" stroke-width="2"/>';
 for(let i=0;i<10;i++){const a=i*Math.PI/5;s+=path('M0 0L'+f(Math.cos(a)*25)+' '+f(Math.sin(a)*25),'none','#ebce97',3);}
 return s+'<circle r="7" fill="#665541" stroke="#d7b27c" stroke-width="3"/></g>';
}
function mills(level){
 let s=ground('stone')+walls(level,2);
 s+=wheel(83,56)+path('M40 67Q67 52 106 69','none','#4a8f9e',7)+path('M48 74Q81 61 106 79','none','#b8dbe0',3);
 s+=path('M-90 59l-20 16m17 -27l-21 3','none','#b8a17e',5);
 s+=potted(-74,62);
 return s;
}
function bakery(level){
 let s=ground('stone')+walls(level,1)+chimney(25,-65);
 s+=path('M-78 38l59 32v15l-59 -32Z','#e7c9a1','#946f53',2);
 for(let i=0;i<5;i++)s+=path('M'+(-77+i*10)+' '+(38+i*5)+'l8 4','none',i%2?'#bc805c':'#f8e4c6',7);
 s+=path('M-63 66l28 14v10l-28 -14Z','#a96e48');
 s+='<ellipse cx="-41" cy="78" rx="15" ry="7" fill="#e4b36c"/><ellipse cx="-65" cy="67" rx="13" ry="6" fill="#e9c386"/>';
 s+=path('M-56 77l7 -4m-16 -5l8 -3m13 14l6 -6','none','#f7dda7',2);
 s+=potted(79,50,true);
 return s;
}
function olivePress(level){
 let s=ground('grass')+walls(level,0);
 s+=path('M65 31l19 13v27L65 58Z','#9d734e','#5f5845',2)+path('M66 35l44 -23','none','#886b4a',7);
 s+='<ellipse cx="83" cy="61" rx="24" ry="13" fill="#aa9e79" stroke="#d7c8a0" stroke-width="6"/>';
 s+='<ellipse cx="83" cy="58" rx="14" ry="7" fill="#6d7651"/>';
 for(let i=0;i<5;i++)s+='<circle cx="'+(61+i*10)+'" cy="'+(72+i%2*2)+'" r="6" fill="#647349"/>';
 s+=potted(-90,38);
 s+=path('M-90 67h32v16h-32Z','#a87b53','#6f5542',3);
 return s;
}
function boat(x,y,scale=1){
 let s='<g transform="translate('+x+' '+y+') scale('+scale+')">';
 s+=path('M-45 10Q-5 26 42 8L31 24Q-1 38 -36 22Z','#76513d','#e8d7b7',3);
 s+=path('M-5 -47v60','none','#765e46',5)+path('M-8 -44L-37 7H-8Z','#eee5ce','#cbb18a',1.5);
 s+=path('M0 -35L31 7H0Z','#f6e9d1','#cdb896',1.5);
 s+=path('M-20 18h39','none','#d0af86',2);
 return s+'</g>';
}
function dock(level=1,variant='pier'){
 let s=ground('sand');
 s+=path('M-99 25L-13 -14L95 25L14 68Z','#aa8f6c','#ead5ab',4);
 s+=path('M-85 16L-2 -20L115 17L29 59Z','#cbb38a','#f2e4bf',3);
 for(let i=0;i<8;i++){
  const x=-84+i*24,y=23+i%2*4;
  s+=path('M'+x+' '+y+'l42 -19','none','#f4dfb9',2);
  s+=path('M'+x+' '+(y+2)+'v24','none','#705b45',4);
 }
 if(variant==='fishing'){
  s+=boat(-42,73,.9)+path('M-72 -13l34 -16 41 18 -34 16Z','#bb9870','#7e634e',2);
  s+=path('M-65 -12l2 -37m30 20l3 -36m-30 13h29','none','#8d7259',5);
  s+=path('M48 17q28 -22 53 8l-8 27h-38Z','#d8cda7','#6b8b80',3);
  for(let i=0;i<5;i++)s+=path('M'+(52+i*10)+' 15l25 41','none','#79978d',2);
 }
 if(variant==='ferry'){
  s+=boat(-45,78,1.1)+path('M28 -16h62v10H28Z','#b68e64','#e7d1aa',2);
  s+=path('M31 -16v-42m55 42v-42m-60 -41h67l-12 36h-44Z','#af7250','#7c5d4b',3);
  s+=path('M49 -53l25 12','none','#f0d7ac',4);
 }
 if(variant==='pier'){
  for(let i=0;i<level+2;i++){
   const x=-60+i*30;
   s+=path('M'+x+' '+(10+i%2*7)+'h24v27h-24Z','#ac8560','#6b5b49',2);
   s+=path('M'+x+' '+(10+i%2*7)+'l11 -9 24 9 -11 9Z','#d5b288');
  }
 }
 if(variant==='waterfront')s+=potted(-40,-24,true)+potted(50,-10,true)+path('M-40 -22l60 -34 58 23','none','#e8dbbe',8);
 return s;
}
function beacon(level){
 let s=ground('sand');
 s+=path('M-32 71L-21 -73H16L33 71Z','#e9dfcb','#a49a88',4);
 s+=path('M-21 -72L0 -83 16 -72Z','#d1c5ae');
 for(let i=0;i<6;i++)s+=path('M'+(-31+i*3)+' '+(69-i*25)+'h'+(60-i*7),'none','#c5bca7',1.2);
 s+=path('M-26 -39h50v13h-50Z','#b36d51','#7b6250',2);
 s+=path('M-35 -76h71v14h-71Z','#e8dcc2','#9f937d',3);
 s+=path('M-38 -91L0 -113 38 -91Z','#b66c4c','#805749',3);
 s+=path('M-26 -94h52v18h-52Z','#ebcc89','#7a6656',3);
 s+=path('M-5 25v46h15V25Z','#466665','#e8dbbc',2);
 if(level>=2)s+='<ellipse cy="-81" rx="40" ry="16" fill="#f5d88d" opacity=".2"/>';
 return s;
}
function kiln(level){
 let s=ground('stone')+walls(level,3);
 s+=path('M-35 -59v-83l24 9v79Z','#c47e5e','#8c6758',3);
 s+=path('M-39 -143l15 -11 24 12-15 11Z','#dc9870','#895d50',2);
 s+=path('M-21 -161q-12 -26 3 -39','none','#bfc2bb',8);
 for(let i=0;i<7;i++){const x=45+i%3*20,y=39+Math.floor(i/3)*18;s+=path('M'+x+' '+y+'l16 -10 18 8 -15 11Z','#c98a69','#a46e59',2);}
 return s;
}
function market(level,kind){
 let s=ground('stone');
 for(let i=0;i<(kind==='square'?2:3+Math.min(2,level));i++){
  const x=-70+(i%3)*62,y=-14+Math.floor(i/3)*31;
  s+='<g transform="translate('+x+' '+y+')">'+path('M-31 4L-20 -26H18L34 4Z',i%2?'#d4a16b':'#b97055','#8e5f4b',2);
  for(let k=0;k<5;k++)s+=path('M'+(-25+k*11)+' '+(-19)+'l8 23','none','#f4e4c8',5);
  s+=path('M-23 3v29m49 -30v28','none','#7c604a',5)+path('M-27 30h58','none','#ae8159',6)+'</g>';
 }
 if(kind==='square'){
  s+='<ellipse cx="50" cy="30" rx="24" ry="14" fill="#d3c9ad" stroke="#f2e3bd" stroke-width="5"/>';
  s+='<ellipse cx="50" cy="27" rx="13" ry="7" fill="#85b3b8"/>';
  s+=path('M50 26v-39','none','#dbcfb1',5);
 }
 return s;
}
function field(kind,ripe){
 let s=ground('grass');
 const color=ripe?'#e0c37f':kind==='orchard'?'#879c6b':kind==='garden'?'#8dad76':'#9aaa73';
 s+=path('M-94 8L-10 -41 98 9L17 60Z',color,'#e2cba1',4);
 for(let i=0;i<8;i++){const x=-92+i*25;s+=path('M'+x+' 10L'+(x+83)+' 52','none',ripe?'#c19a4b':'#738b5d',5);}
 if(kind==='orchard'||kind==='olive'){
  for(let i=0;i<5;i++){
   const x=-55+(i%3)*40,y=-10+Math.floor(i/3)*34;
   s+='<g transform="translate('+x+' '+y+')"><path d="M0 8v-33" stroke="#786547" stroke-width="5"/><ellipse cy="-30" rx="23" ry="13" fill="#71855c"/><ellipse cx="-9" cy="-36" rx="12" ry="8" fill="#a3af7d"/><ellipse cx="9" cy="-29" rx="13" ry="8" fill="#526d52"/></g>';
  }
 }
 return s;
}
function home(level,kind){
 let s=ground('stone')+walls(level,level%4);
 s+=potted(-75,63,true)+vine(75,48);
 if(kind==='weaver')s+=path('M-90 42l34 -16v18l-34 19Z','#98a9a0')+path('M-84 41l35 -12','none','#e2d7bf',4);
 if(kind==='sailmaker')s+=path('M-95 49L-91 -40-40 39Z','#eee5d1','#d8c6a4',3);
 if(kind==='carpenter')for(let i=0;i<4;i++)s+=path('M'+(-82+i*9)+' 75l35 -18','none','#9d734e',7);
 return s;
}
function excavation(){
 let s=ground('sand');
 s+=path('M-81 5L-16 -30L78 5L14 46Z','#9c8666','#e5cba5',4);
 s+=path('M-65 9L-10 -17L59 9L5 36Z','#715f4c','#c0a582',2);
 s+=path('M-62 11L5 43L59 12','none','#d7be95',4);
 for(let i=0;i<5;i++)s+='<circle cx="'+(-70+i*30)+'" cy="'+(49+i%2*5)+'" r="7" fill="#b7a58c"/>';
 s+=path('M-80 -19v50m150 -40v50M-82 -20l17 -11m133 5l15 12','none','#986d49',5);
 return s;
}
function construction(base,level){
 let s='<g opacity=".46">'+base+'</g>';
 s+=path('M-92 55v-157M93 55v-149M-92 -98H93M-92 -63H93M-92 -28H93M-92 8H93M-92 -98L93 8M93 -94L-92 11','none','#907454',6);
 s+=path('M-101 56H106','none','#bd9a68',9);
 s+=path('M-90 -106h39l-19 -24Z','#e3b070','#936d4b',3);
 s+=path('M83 -111h41l-21 -24Z','#e3b070','#936d4b',3);
 s+='<g transform="translate(59 67)"><circle r="13" fill="#b79b78"/><path d="M-9 2h18m-9 -9v18" stroke="#785d47" stroke-width="3"/></g>';
 return s;
}
export function painterlyBuilding(e){
 let art='',kind=e.kind||'home',level=Number.isFinite(e.level)?e.level:1;
 if(e.id==='specialist')kind='specialist';
 if(e.id==='kiln')kind='kiln';
 if(e.id==='claypit')kind='clay';
 if(e.id==='courtyard')kind='square';
 if(e.id==='civic')kind='square';
 switch(kind){
  case 'mill':art=mills(level);break;
  case 'bakery':art=bakery(level);break;
  case 'olive':art=olivePress(level);break;
  case 'pier':case 'fishing':case 'ferry':case 'waterfront':art=dock(level,kind);break;
  case 'lighthouse':art=beacon(level);break;
  case 'kiln':art=kiln(level);break;
  case 'market':case 'square':art=market(level,kind);break;
  case 'field':case 'garden':case 'orchard':case 'flaxgarden':art=field(kind,!!e.ripe);break;
  case 'clay':art=ground('sand')+path('M-73 2L-10 -53 87 -14L25 54Z','#b9a98c','#e2cda8',4);break;
  case 'boat':art=boat(0,12,1.7);break;
  case 'home':case 'carpenter':case 'weaver':case 'sailmaker':art=home(level,kind);break;
  case 'workshop':case 'specialist':art=home(level,kind)+wheel(78,35);break;
  default:art=home(level,kind);break;
 }
 if(e.stage==='unbuilt')return excavation();
 if(e.stage==='building')return construction(art,level);
 return art;
}
