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

export function renderWorldBuildings(entities){
 return entities.map(e=>{
  let art='';
  if(e.stage==='unbuilt')art='<path d="M-65 0 0 -34 65 0 0 34Z" fill="#aea789" fill-opacity=".3" stroke="#e4d5af" stroke-width="3" stroke-dasharray="9 7"/>';
  else if(e.stage==='building')art='<path d="M-65 10 0 -24 65 10 0 42Z" fill="#b9aa86"/><path d="M-48 5v-64M42 8v-65M-48 -44 42 -44M-48 -20 42 -20M-48 2 42 -44M-48 -44 42 2" fill="none" stroke="#816a4e" stroke-width="7"/>'+ (e.level?house(0,20,.7,1):'');
  else if(['field','garden','orchard','olive','flaxgarden'].includes(e.kind)){
   art='<path d="M-100 -30 40 -80 110 20 -30 70Z" fill="'+(e.ripe?'#d7ba6d':'#849762')+'" stroke="#ded0a3" stroke-width="5"/>';
   for(let i=0;i<5;i++)art+='<path d="M'+(-65+i*25)+' '+(-15-i*9)+'l75 65" stroke="#e3ce8c" stroke-width="5"/>';
   if(['orchard','olive'].includes(e.kind))for(let i=0;i<4;i++)art+=tree(-50+i*30,10-i%2*25,.7,i+1);
  }
  else if(e.kind==='lighthouse')art=e.level===3?lighthouse(0,0):house(0,0,e.level===2?1.4:.9,0);
  else if(['pier','fishing','ferry','waterfront'].includes(e.kind)){
   art=pier(-70,10,90+e.level*45);
   if(e.level>1||e.kind==='fishing')art+=house(-40,-35,1+e.level*.15,1);
   if(e.level===3)art+=stall(25,-28,0)+stall(90,-10,1);
  }
  else if(e.kind==='market'||e.kind==='square')art=stall(-20,0,0)+stall(40,35,1);
  else art=house(0,0,1.2+Math.min(e.level,3)*.25,e.kind==='bakery'?2:1);
  return '<g data-world-building="'+e.id+'" data-stage="'+e.stage+'" data-level="'+e.level+'" transform="translate('+e.x+' '+e.y+')"><title>'+e.label+' · '+e.stage+'</title>'+art+'</g>';
 }).join('');
}
