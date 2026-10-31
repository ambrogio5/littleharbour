// One original, continuous SVG landscape shared by every district.
// Portrait geography uses shared coordinates and state-driven physical structures.
export const WORLD_ART_SIZE={width:1800,height:2700};
const f=n=>Math.round(n*10)/10;
function rng(seed){let a=seed>>>0;return()=>{a=(1664525*a+1013904223)>>>0;return a/4294967296;};}
let rand=rng(1373);const rr=(a,b)=>a+(b-a)*rand();
function tree(x,y,s=1,t=0){
 const species=t%9,dark=['#30483a','#405842','#344b3f','#506349'][t%4],light=['#71806a','#859176','#677e67','#93977a'][t%4];
 if(species===0||species===5) return `<g transform="translate(${f(x)} ${f(y)}) scale(${f(s)})"><ellipse cy="8" rx="9" ry="4" fill="#23352e" opacity=".25"/><path d="M0 4 1 -37" stroke="#685e47" stroke-width="3"/><path d="M-7 -13Q-11 -29 -4 -51Q0 -66 4 -51Q12 -28 7 -14L2 5Z" fill="${dark}" stroke="#36493c" stroke-width="1.5"/><path d="M-2 -48Q-6 -30 -3 -12" stroke="${light}" opacity=".6" stroke-width="3" fill="none"/></g>`;
 const lobes=Array.from({length:7},(_,i)=>{const a=i*Math.PI*2/7;return `<ellipse cx="${f(Math.cos(a)*12)}" cy="${f(Math.sin(a)*7-15)}" rx="${10+i%3*2}" ry="${8+i%2*3}" fill="${i%2?dark:light}" opacity=".92"/>`;}).join('');
 return `<g transform="translate(${f(x)} ${f(y)}) scale(${f(s)})"><ellipse cx="8" cy="10" rx="24" ry="9" fill="#1d302a" opacity=".27"/><path d="M0 5v-25M0 -12l-14 -10M0 -17L11 -26" stroke="#78674e" stroke-width="3" fill="none"/>${lobes}<path d="M-17 -17Q0 -31 16 -17" fill="none" stroke="#abb092" opacity=".37" stroke-width="3"/></g>`;
}
function house(x,y,s=1,variant=0){
 const wall=['#d9c9ae','#e7d7be','#cbbba4','#e4d6bf','#cfc5ae'][variant%5],roof=['#b07150','#975c45','#bd7a54','#a65c44'][variant%4],shade=['#a69d8c','#b1a58d','#a79a85'][variant%3];
 return `<g transform="translate(${f(x)} ${f(y)}) scale(${f(s)})"><path d="M-30 16 3 35 40 14 9 -7Z" fill="#24392e" opacity=".22" transform="translate(9 8)"/><path d="M-29 -11L4 -30 40 -9 7 9Z" fill="${roof}" stroke="#865a46" stroke-width="2"/><path d="M-29 -11 7 9v27l-36 -19Z" fill="${wall}"/><path d="M7 9 40 -9v26L7 36Z" fill="${shade}"/><path d="M-29 -11 4 -30 40 -9M-29 -4 7 16 40 -1" fill="none" stroke="#e8ad7e" stroke-width="2" opacity=".7"/><path d="M-22 6 -12 11v12l-10 -5ZM18 17l9 -5v11l-9 4Z" fill="#385653"/><path d="M-21 6 -13 10M18 17l8 -4" stroke="#c9b499" stroke-width="1.5"/><path d="M-2 15 6 19v17l-8 -3Z" fill="#85694f"/><path d="M20 -23v-10h7v15" fill="#c8b79a" stroke="#a0785e" stroke-width="2"/><path d="M-33 18Q-24 13 -21 23M35 19Q41 12 47 25" stroke="#6d805f" stroke-width="3" fill="none"/></g>`;
}
function rock(x,y,s=1){
 return `<g transform="translate(${f(x)} ${f(y)}) scale(${f(s)})"><ellipse cy="18" rx="29" ry="9" fill="#17313a" opacity=".19"/><path d="M-27 13 -14 -17 2 -29 19 -16 29 10 11 22Z" fill="#868d86"/><path d="M-27 13 -14 -17 2 -29 0 16Z" fill="#bbb7a3"/><path d="M2 -29 19 -16 29 10 0 16Z" fill="#747f7c"/><path d="M-18 -4 -5 -18 1 -18M8 -20l7 12" fill="none" stroke="#e0d6be" opacity=".6" stroke-width="2.5"/><path d="M-12 17Q-1 7 10 19" stroke="#a0aa93" opacity=".6" fill="none" stroke-width="4"/></g>`;
}
function boat(x,y,s=1){
 return '<g transform="translate('+f(x)+' '+f(y)+') scale('+f(s)+')"><ellipse cy="17" rx="42" ry="12" fill="#d7eee1" opacity=".20"/><path d="M-43 9Q-7 30 37 9L25 21Q-3 37 -33 22Z" fill="#704e39" stroke="#d8b990" stroke-width="2"/><path d="M-5 -36V16" stroke="#634e38" stroke-width="4"/><path d="M-9 -31L-9 8 -34 9Z" fill="#f2e5c5"/><path d="M-1 -28L24 9 -1 9Z" fill="#e7cfa9"/></g>';
}
function pier(x,y,l=260){
 let str='<g transform="translate('+x+' '+y+')"><path d="M0 0L'+l+' -60" stroke="#132f34" stroke-width="47" opacity=".4"/><path d="M0 -6L'+l+' -66" stroke="#b18d65" stroke-width="39"/><path d="M0 -6L'+l+' -66" stroke="#d8b38b" stroke-width="29"/>';
 for(let i=0;i<=l;i+=42){str+='<path d="M'+i+' '+f(-6-60*i/l)+'v35" stroke="#4d493d" stroke-width="7"/><path d="M'+i+' '+f(-6-60*i/l)+'l11 12" stroke="#efd9ad" stroke-width="3" opacity=".6"/>';}
 return str+'</g>';
}
function stall(x,y,variant=0){
 const roof=variant%2?'#c8784d':'#ddaa6f';
 return '<g transform="translate('+x+' '+y+')"><path d="M-28 6L-17 -23 27 -23 40 5Z" fill="'+roof+'" stroke="#8c5343" stroke-width="3"/><path d="M-22 2L-16 -18M-8 2L-4 -19M7 2L9 -19M21 2L25 -17" stroke="#f8e9cf" stroke-width="8"/><path d="M-23 5v23M32 5v22" stroke="#735942" stroke-width="5"/><path d="M-23 25h55" stroke="#d2a77a" stroke-width="8"/></g>';
}
function lighthouse(x,y){
 return '<g transform="translate('+x+' '+y+')"><ellipse cx="10" cy="29" rx="58" ry="25" fill="#0f3036" opacity=".25"/><path d="M-19 21L-10 -79H10L21 21Z" fill="#ebdfc7" stroke="#978e80" stroke-width="3"/><path d="M-14 -38H14L17 -27H-17Z" fill="#a85b45"/><path d="M-21 -78H21V-65H-21Z" fill="#d1c4a6"/><path d="M-23 -89L0 -104 23 -89Z" fill="#b86b4b"/><path d="M-12 -91H13V-78H-12Z" fill="#ffda9c"/><path d="M-10 -92V-77M11 -92V-77" stroke="#675845" stroke-width="4"/><path d="M-5 -5v26h13V-5Z" fill="#587271"/><rect x="-9" y="-53" width="16" height="24" rx="5" fill="#6d8a82"/></g>';
}
export function createWorldArt(){
 rand=rng(1373);
 let svg='<svg id="newWorldArt" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1800 2700" aria-hidden="true"><defs><linearGradient id="sea" x2="1" y2="1"><stop stop-color="#7caeae"/><stop offset="1" stop-color="#275e71"/></linearGradient><linearGradient id="land" x2=".4" y2="1"><stop stop-color="#a7b28d"/><stop offset="1" stop-color="#c8bb95"/></linearGradient><pattern id="worldGrain" width="42" height="38" patternUnits="userSpaceOnUse"><path d="M4 7l9 -2m19 20 5 -2" stroke="#f5edda" opacity=".16"/></pattern></defs>';
 svg+='<path d="M0 0H1800V2700H0Z" fill="url(#sea)"/>';
 const shore='M0 0H1650Q1520 230 1640 470Q1730 700 1590 900Q1760 1150 1640 1460Q1530 1590 1580 1730L1410 1850Q1370 2020 1150 2110L1030 2330Q850 2440 700 2230L430 2190Q140 2130 0 2270Z';
 svg+='<path d="'+shore+'" fill="#8ac2b2" stroke="#8ac2b2" stroke-width="90"/><path d="'+shore+'" fill="url(#land)" stroke="#e5d7b4" stroke-width="24"/>';
 svg+='<path d="M30 60Q720 -140 1440 160L1310 340Q800 200 90 350Z" fill="#708b70"/><path d="M0 390Q350 230 710 370T1510 490L1530 650Q860 530 60 640Z" fill="#8f9e78" opacity=".6"/>';
 for(let i=0;i<8;i++)svg+='<path d="M80 '+(120+i*28)+'Q490 '+(i*24)+' 1370 '+(250+i*20)+'" stroke="#d3ccb0" stroke-width="3" opacity=".25" fill="none"/>';
 // One winding road joins the hillside, civic plots, market and working quay.
 const road='M590 390Q1350 560 1160 850T550 1140Q560 1400 1160 1440Q1350 1620 1000 1870L870 2080';
 svg+='<path d="'+road+'" stroke="#8f8b70" stroke-width="46" fill="none"/><path d="'+road+'" stroke="#e5d8b8" stroke-width="32" fill="none"/>';
 svg+='<path d="M1000 1870Q1300 1680 1450 1920L1450 2270M560 1400 360 1520" stroke="#dfcba3" stroke-width="19" fill="none"/>';
 // Trees remain scenery; every gameplay structure is rendered from state below.
 for(let i=0;i<210;i++){let x=rr(45,1450),y=rr(70,1650);if(x>280&&x<1250&&y>310&&y<1530)continue;svg+=tree(x,y,rr(.65,1.3),i);}
 for(let i=0;i<95;i++)svg+=tree(rr(20,250),rr(150,1950),rr(.7,1.4),i);
 for(let i=0;i<20;i++)svg+=rock(rr(1300,1590),rr(1580,1790),rr(.6,1.1));
 for(let i=0;i<55;i++){const x=rr(80,1750),y=rr(2340,2670);svg+='<path d="M'+f(x)+' '+f(y)+'q22 -8 46 0" stroke="#dbebdb" stroke-width="2" fill="none" opacity=".25"/>';}
 svg+='<path d="M0 0H1800V2700H0Z" fill="url(#worldGrain)"/><g id="worldBuildings"></g></svg>';
 return svg;
}



// Enhanced site-specific visual grammar. These are original drawn SVG
// elements, not a claim to be final painterly production assets.
function isoGround(color='#d4c09c',depth=22){
  return `<path d="M-99 14L-18 -36 104 11 21 64Z" fill="${color}" stroke="#f4e8cb" stroke-width="5"/><path d="M-99 14L21 64v${depth}L-99 ${14+depth}Z" fill="#968b76"/><path d="M21 64L104 11v${depth}L21 ${64+depth}Z" fill="#a99a7d"/>`;
}
function isoWorkshop(kind,level=1){
 const colors={mill:['#e7d7b8','#b9b1a0','#a97757'],bakery:['#f0dac0','#b8a391','#bd7851'],olive:['#d6c4a9','#a39b81','#8c7052'],specialist:['#e3d3b6','#b8a88d','#a66b4d'],kiln:['#d7bea2','#af9480','#ae6749']};
 const [a,b,roof]=colors[kind]||colors.specialist;
 let out=isoGround('#caba9a');
 out+=`<path d="M-63 -28L0 -63 65 -32 3 4Z" fill="${roof}" stroke="#7b5543" stroke-width="3"/><path d="M-63 -28L3 4v75L-63 43Z" fill="${a}" stroke="#b49f87" stroke-width="2"/><path d="M3 4L65 -32v72L3 79Z" fill="${b}" stroke="#8f8579" stroke-width="2"/><path d="M-51 -3l18 10v24l-18 -10ZM-18 15l12 7v22l-12 -7ZM24 13l21 -12v25L24 38Z" fill="#44605c" stroke="#f5e2bd" stroke-width="3"/><path d="M-63 -28L3 4L65 -32M-35 -43L32 -7" fill="none" stroke="#efb88c" stroke-width="2.5" opacity=".7"/>`;
 if(kind==='mill') out+=`<g transform="translate(37 21)"><circle r="31" fill="#a98459" stroke="#6c5e4d" stroke-width="7"/><circle r="23" fill="none" stroke="#e8d4ae" stroke-width="3"/><path d="M-28 0H28M0 -28V28M-20 -20L20 20M20 -20L-20 20" stroke="#e7c89c" stroke-width="4"/><circle r="7" fill="#5f5546"/></g><path d="M-31 -25v-27h14v31" fill="#f1ddbc" stroke="#9b8c78" stroke-width="3"/>`;
 if(kind==='bakery') out+=`<path d="M-31 -48v-43h16v45Z" fill="#dec2a4" stroke="#947a67" stroke-width="3"/><path d="M-24 -97q-20 -19 -5 -34" fill="none" stroke="#d9d6c9" stroke-width="8" opacity=".7"/><path d="M-64 22l42 21v16l-42 -20Z" fill="#b4714a"/><path d="M-48 28q9 -15 18 7m-5 -5q6 -9 11 10" stroke="#f4d1a0" stroke-width="4" fill="none"/><path d="M46 -10l16 -12v22l-16 11Z" fill="#eed59b"/>`;
 if(kind==='olive') out+=`<g transform="translate(-83 -26)">${tree(0,0,1.6,2)}${tree(42,-30,1.1,3)}</g><path d="M22 46l30 -16v22L22 68Z" fill="#8f6648"/><ellipse cx="39" cy="32" rx="17" ry="7" fill="#c9a875"/><path d="M20 28v14m35-26v18" stroke="#76543e" stroke-width="5"/>`;
 if(kind==='kiln') out+=`<path d="M36 -8v-69h18v56" fill="#bf7650" stroke="#8b604d" stroke-width="3"/><path d="M-57 25q16 -21 34 10v17h-34Z" fill="#8b644e"/><path d="M-49 37q6 -10 16 4" fill="none" stroke="#efbd7e" stroke-width="5"/>`;
 if(kind==='specialist') out+=`<path d="M-91 45q-25 -19 -30 3m18 -33q-25 -12 -24 2" stroke="#718366" stroke-width="11" fill="none"/><g transform="translate(73 39)">${stall(0,0,1)}</g>`;
 if(level>1)out+=`<path d="M-10 -45l27 -15 27 15" stroke="#f7e7c9" stroke-width="7" fill="none"/><rect x="-30" y="41" width="12" height="9" fill="#c79555"/>`;
 return out;
}
function planted(kind,ripe=false){
 const orchard=['orchard','olive'].includes(kind);
 let out=isoGround(ripe?'#c9ad66':orchard?'#77936a':'#87a56d',6);
 for(let i=0;i<7;i++)out+=`<path d="M${-80+i*18} 11L${5+i*17} 53" stroke="${ripe?'#e4c986':'#afbc82'}" stroke-width="5" opacity=".8"/>`;
 if(orchard)for(let i=0;i<6;i++)out+=tree(-57+(i%3)*52,-11+Math.floor(i/3)*30,.76,i+2);
 if(kind==='garden')out+=`<path d="M-65 10L24 48M-42 0L51 39" stroke="#477c5a" stroke-width="9"/>`;
 if(kind==='flaxgarden')for(let i=0;i<14;i++)out+=`<path d="M${-59+(i%7)*17} ${15+Math.floor(i/7)*18}v-25" stroke="#6b895c" stroke-width="3"/><circle cx="${-59+(i%7)*17}" cy="${-12+Math.floor(i/7)*18}" r="4" fill="#9aaec8"/>`;
 return out;
}
function harbourStructure(kind,level){
 let out=pier(-70,21,level>1?180:130);
 if(kind==='fishing')out+=`<g transform="translate(-45 -32)">${boat(0,0,.9)}</g><path d="M-105 26q34 -24 70 0l-8 40h-50Z" fill="#d0c3a2" stroke="#8b8c7a" stroke-width="3"/><path d="M-85 31l28 37M-60 26l-30 44" stroke="#8e9e95" stroke-width="4"/><circle cx="-93" cy="17" r="10" fill="#c6885e"/><circle cx="-67" cy="10" r="8" fill="#d1a265"/>`;
 if(kind==='pier')out+=`<g transform="translate(-53 -60)">${isoWorkshop('specialist',level)}</g>`;
 if(kind==='ferry')out+=`<g transform="translate(80 25)">${boat(0,0,1.8)}</g>${stall(-80,-60,0)}<path d="M55 -51v55" stroke="#6e6355" stroke-width="6"/><path d="M55 -51q35 6 45 37h-45Z" fill="#eee5c8"/>`;
 if(kind==='waterfront')out+=`<path d="M-120 48L10 -10 130 39" fill="none" stroke="#f3dbc0" stroke-width="22"/>${stall(-75,-35,0)}${stall(70,-30,1)}`;
 return out;
}
function residence(kind,level=1){
 let out=house(0,0,1.3+Math.min(level,3)*.12,level);
 if(kind==='weaver')out+=`<path d="M-58 43l-17 14v23l17 -8Z" fill="#e6d5b4"/><path d="M-72 49v29m8-34v29" stroke="#81735b" stroke-width="4"/><path d="M-75 48l24 17" stroke="#7e9d9c" stroke-width="7"/>`;
 if(kind==='carpenter')out+=`<path d="M-64 38l-25 14m16 -25l30 15" stroke="#9c7048" stroke-width="11"/>`;
 if(kind==='sailmaker')out+=`<path d="M-62 51L-64 -29l-47 80Z" fill="#efe8d4" stroke="#c6aa89" stroke-width="2"/>`;
 if(kind==='home')out+=`<path d="M37 32q20 -11 27 7" stroke="#638064" stroke-width="9" fill="none"/><path d="M46 21q25 -17 39 8" stroke="#88a076" stroke-width="6" fill="none"/>`;
 return out;
}
function stageSpecific(e){
 let obj=e.kind;
 if(e.id==='specialist')obj='specialist';
 if(e.id==='courtyard')obj='square';
 if(e.id==='claypit')obj='clay';
 if(e.id==='kiln')obj='kiln';
 if(e.id==='civic')obj='civic';
 switch(obj){
  case 'field':case 'garden':case 'orchard':case 'flaxgarden':return planted(obj,e.ripe);
  case 'mill':case 'bakery':case 'olive':case 'kiln':case 'specialist':case 'workshop':return isoWorkshop(obj==='workshop'?'specialist':obj,e.level);
  case 'fishing':case 'pier':case 'ferry':case 'waterfront':return harbourStructure(obj,e.level);
  case 'lighthouse':return lighthouse(0,0)+`<path d="M-35 18h70" stroke="#d9b98e" stroke-width="5"/>`;
  case 'clay':return `<path d="M-90 30L-25 -38 89 -4 25 70Z" fill="#b57d5c" stroke="#ddc2a2" stroke-width="6"/>${rock(-25,0,1.3)}${rock(52,19,.7)}<path d="M-70 40l55 -53" stroke="#93684f" stroke-width="9"/>`;
  case 'boat':return boat(0,0,1.55+(e.level||0)*.1);
  case 'square':case 'civic':return `<path d="M-90 13L-13 -39 95 8 18 58Z" fill="#cdb995" stroke="#efe0bd" stroke-width="4"/><ellipse cy="6" rx="24" ry="13" fill="#8cad91"/><path d="M0 -11V22" stroke="#dfd5ba" stroke-width="6"/>${stall(-40,0,0)}${tree(77,15,.95,4)}`;
  case 'market':return `${stall(-47,-21,0)}${stall(37,22,1)}<path d="M-57 35l23 12m55 0l25 14" stroke="#e8c9a6" stroke-width="7"/>`;
  default:return residence(obj,e.level);
 }
}
export function renderWorldBuildings(entities){
 return entities.map(e=>{
  const base=stageSpecific(e);
  let art=base;
  if(e.stage==='unbuilt'){
   art=`${isoGround('#c7bb9c',4)}<path d="M-75 6L-18 -24 78 9 20 43Z" fill="#bba989" stroke="#e9dac0" stroke-width="3" stroke-dasharray="8 8"/><path d="M-36 -1l58 28" stroke="#99866b" stroke-width="8"/><circle cx="54" cy="22" r="10" fill="#dec18b"/>`;
  }else if(e.stage==='building'){
   art=`<g opacity=".48">${base}</g><path d="M-80 30v-105M77 31v-101M-80 -55H77M-80 -18H77M-80 20H77M-80 -75L77 19M77 -70L-80 26" stroke="#896f4e" stroke-width="7" fill="none"/><path d="M-92 -82h38l-19 -31Z" fill="#d5a25f"/><path d="M-72 -75h132" stroke="#e9cda4" stroke-width="7"/>`;
  }
  const safeLabel=String(e.label).replaceAll('&','&amp;').replaceAll('<','&lt;');
  return `<g data-world-building="${e.id}" data-stage="${e.stage}" data-level="${e.level}" transform="translate(${e.x} ${e.y})"><title>${safeLabel} — ${e.stage}</title>${art}</g>`;
 }).join('');
}
