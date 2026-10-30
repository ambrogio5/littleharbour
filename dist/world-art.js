// One original, continuous SVG landscape shared by every district.
// Geometry is in world coordinates (2680 x 1840), with no stitched map screenshots.
export const WORLD_ART_SIZE={width:2680,height:1840};
const f=n=>Math.round(n*10)/10;
function rng(seed){let a=seed>>>0;return()=>{a=(1664525*a+1013904223)>>>0;return a/4294967296;};}
const rand=rng(1373),rr=(a,b)=>a+(b-a)*rand();
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
 let svg='<svg id="newWorldArt" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2680 1840" preserveAspectRatio="xMidYMid meet" aria-hidden="true">';
 svg+='<defs><linearGradient id="sea" x1="0" y1="0" x2=".8" y2="1"><stop stop-color="#4d7b81"/><stop offset=".55" stop-color="#2d6876"/><stop offset="1" stop-color="#174859"/></linearGradient><linearGradient id="land" x1="0" y1="0" x2=".4" y2="1"><stop stop-color="#8f9b83"/><stop offset=".43" stop-color="#8e9a76"/><stop offset="1" stop-color="#b2a18b"/></linearGradient><linearGradient id="hills" x1="0" y1="0" x2=".8" y2="1"><stop stop-color="#5a7c5b"/><stop offset="1" stop-color="#a6a06f"/></linearGradient><linearGradient id="shallow" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#68b8a7" stop-opacity=".8"/><stop offset="1" stop-color="#58b6b2" stop-opacity="0"/></linearGradient><radialGradient id="meadow"><stop stop-color="#b5af70"/><stop offset="1" stop-color="#b3a268"/></radialGradient><filter id="shadow" x="-25%" y="-25%" width="150%" height="150%"><feGaussianBlur stdDeviation="13"/></filter><linearGradient id="cliff" x1="0" y1="0" x2=".9" y2="1"><stop stop-color="#c7c4ae"/><stop offset=".42" stop-color="#a0a49a"/><stop offset="1" stop-color="#777f7e"/></linearGradient><pattern id="paper" width="72" height="68" patternUnits="userSpaceOnUse"><path d="M4 17l14 -6M38 42l8 -3M23 57l7 -1" stroke="#f0e4cd" stroke-width="1" opacity=".35"/><circle cx="17" cy="39" r="1.2" fill="#ede1cb" opacity=".4"/></pattern><filter id="pigment" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".17" numOctaves="2" seed="14" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope=".10"/></feComponentTransfer></filter></defs>';
 svg+='<path fill="url(#sea)" d="M0 0H2680V1840H0Z"/>';
 // Variegated water bands and waves, without duplicated or stitched image tiles.
 for(let i=0;i<68;i++){const x=rr(60,2690),y=rr(550,1820),a=rr(12,45);svg+='<path d="M'+f(x)+' '+f(y)+'q'+f(a)+' -9 '+f(a*2)+' -2" fill="none" stroke="'+(i%4?'#9dd4c9':'#f4e1be')+'" opacity="'+f(rr(.06,.17))+'" stroke-width="'+f(rr(1.4,3.6))+'"/>';}
 const coast='M-80 -60H2180Q2350 120 2260 300Q2430 480 2240 630Q2350 850 2090 1020Q2010 1120 1890 1100Q1820 1270 1650 1230Q1480 1150 1300 1280Q1190 1440 990 1360Q620 1480 360 1390L-80 1470Z';
 svg+='<path d="'+coast+'" fill="#061f2d" opacity=".27" transform="translate(34 47)" filter="url(#shadow)"/>';
 svg+='<path d="'+coast+'" fill="#d6d0bd" stroke="#b4cfb1" stroke-width="26" opacity=".9"/>';
 svg+='<path d="'+coast+'" fill="url(#land)" stroke="#e2dac9" stroke-width="9"/>';
 svg+='<path d="'+coast+'" fill="url(#paper)" opacity=".56"/>';
 svg+='<path d="'+coast+'" fill="#c4bba4" filter="url(#pigment)" opacity=".18"/>';
 for(let i=0;i<24;i++){const x=f(rr(120,1850)),y=f(rr(160,1100)),w=f(rr(90,220));svg+='<path d="M'+x+' '+y+'q'+f(w/2)+' -18 '+w+' 9" fill="none" stroke="#d8d6bd" stroke-width="'+f(rr(2,5))+'" opacity=".17"/>';}

 svg+='<path d="M1690 1190Q1920 1220 1960 1100T2180 790L2260 650Q2230 910 2050 1160T1620 1290Z" fill="url(#shallow)"/>';
 svg+='<path d="M-60 -20Q750 140 1330 95T2220 60L2050 190Q1690 310 1180 225T-80 250Z" fill="#527653" opacity=".50"/>';
 svg+='<path d="M-40 75Q610 205 1050 270T2090 175L2130 305Q1560 465 1260 395T-80 420Z" fill="url(#hills)" opacity=".5"/>';
 svg+='<path d="M-40 590Q350 340 800 520Q1100 650 1390 540T2220 440L2180 690Q1840 880 1430 730T650 740L-40 920Z" fill="#708c5d" opacity=".37"/>';
 // Hills, terraces and fields. Strong paths share the same horizon/perspective.
 svg+='<path d="M175 492Q480 260 1080 310Q1390 330 1570 560" stroke="#ded2a8" stroke-width="37" fill="none" opacity=".6"/>';
 svg+='<path d="M80 690Q490 700 810 820T1510 920Q1700 960 1830 1100" stroke="#5a6a50" stroke-width="31" fill="none" opacity=".53"/>';
 svg+='<path d="M80 690Q490 700 810 820T1510 920Q1700 960 1830 1100" stroke="#d9c7a0" stroke-width="19" fill="none"/>';
 svg+='<path d="M400 1280Q720 1070 1060 1140Q1340 1140 1540 1270" stroke="#755f48" stroke-width="31" fill="none" opacity=".55"/>';
 svg+='<path d="M400 1280Q720 1070 1060 1140Q1340 1140 1540 1270" stroke="#e1ca9f" stroke-width="20" fill="none"/>';
 svg+='<path d="M580 370Q700 200 950 285L1170 480Q940 620 670 535Z" fill="#aeae65" stroke="#d6c78e" stroke-width="10"/>';
 svg+='<ellipse cx="790" cy="443" rx="246" ry="127" fill="url(#meadow)" stroke="#d9bc79" stroke-width="10"/>';
 for(let j=0;j<15;j++){const y=360+j*11;svg+='<path d="M'+f(590+j%4*9)+' '+y+'Q775 '+(y-53)+' '+f(985-j%3*8)+' '+(y+22)+'" fill="none" stroke="'+(j%2?'#e3be6f':'#eacb7e')+'" stroke-width="8" opacity=".84"/>';}
 // Vineyards north-east.
 svg+='<path d="M1170 340Q1350 250 1590 365L1750 505Q1520 605 1220 500Z" fill="#8d9553" stroke="#c1bc7b" stroke-width="9"/>';
 for(let i=0;i<13;i++){svg+='<path d="M'+(1210+i*27)+' '+(338-i*2)+'q155 102 195 157" stroke="'+(i%2?'#4d6a42':'#667a45')+'" stroke-width="9" opacity=".88" fill="none"/>';}
 // Quarry and stone ridge, all integrated into the same terrain.
 svg+='<path d="M1470 360Q1550 155 1780 160Q1960 205 2030 410L1870 515 1590 460Z" fill="#8f9480" opacity=".88"/>';
 svg+='<path d="M1460 340L1600 210 1770 165 1930 290 2020 405 1810 450 1700 365 1520 460Z" fill="#b8b09d"/>';
 svg+='<path d="M1600 210 1730 310 1770 165 1930 290 1810 450 1700 365Z" fill="#7d8274" opacity=".82"/>';
 for(let i=0;i<25;i++)svg+=rock(rr(1500,1940),rr(210,460),rr(.35,.83));
 // Forrest and planted tree clusters: no separate rendered district rectangles.
 for(let i=0;i<115;i++){const x=rr(80,580),y=rr(100,650);svg+=tree(x,y,rr(.65,1.75),i);}
 for(let i=0;i<75;i++){let x=rr(500,2060),y=rr(70,1020);if(x>1460&&x<2000&&y<500)continue;svg+=tree(x,y,rr(.65,1.3),i+1);}
 // Urban hamlets in coherent compact neighbourhoods and the market district.
 for(let i=0;i<58;i++){let x=rr(420,1140),y=rr(775,1150);if((x-700)**2/190000+(y-920)**2/59000<.13)continue;svg+=house(x,y,rr(.63,1.35),i);}
 for(let i=0;i<28;i++)svg+=house(rr(1200,1810),rr(660,965),rr(.65,1.35),i+2);
 for(let i=0;i<22;i++)svg+=house(rr(800,1410),rr(1130,1350),rr(.65,1.25),i+1);
 // Civic garden and central street piazza.
 svg+='<ellipse cx="670" cy="952" rx="138" ry="80" fill="#d4c49b" stroke="#eee2b9" stroke-width="10"/><ellipse cx="670" cy="952" rx="73" ry="44" fill="#7c9c65" stroke="#f5e2b8" stroke-width="5"/>';
 svg+='<path d="M635 956q35 -42 68 0q-33 36 -68 0" fill="#5da6a1" stroke="#e9e3cc" stroke-width="6"/>';
 for(let i=0;i<16;i++)svg+=tree(560+rr(0,220),870+rr(0,166),rr(.48,.95),i+1);
 // Market square and coastal arcades.
 svg+='<path d="M1325 850 1650 774 1790 897 1463 1008Z" fill="#d9c7a3" stroke="#eee0b9" stroke-width="11"/>';
 for(let i=0;i<9;i++)svg+=stall(1395+(i%3)*116,850+Math.floor(i/3)*53,i);
 // Coastal rock ledges and integrated bay forms.
 svg+='<path d="M215 1270Q420 1150 650 1310L1050 1440Q650 1590 350 1460Z" fill="#a4a78c" stroke="#e7d8b5" stroke-width="13"/>';
 for(let i=0;i<25;i++)svg+=rock(rr(155,810),rr(1320,1480),rr(.5,1.35));
 // Grand harbour and ferry wharves, openly connected via shared water.
 svg+=pier(1015,1420,375)+pier(1210,1530,300)+pier(1760,1330,370);
 for(let i=0;i<12;i++)svg+=rock(rr(1650,2130),rr(1150,1390),rr(.5,1.3));
 svg+=lighthouse(1940,1275);
 for(let i=0;i<9;i++)svg+=house(rr(1720,2000),rr(1160,1320),rr(.57,1.08),i);
 // Offshore island and its small village.
 svg+='<path d="M2120 1468Q2300 1372 2520 1487L2635 1700Q2505 1820 2290 1760L2080 1640Z" fill="#17576a" opacity=".45" transform="translate(14 27)"/>';
 svg+='<path d="M2120 1468Q2300 1372 2520 1487L2635 1700Q2505 1820 2290 1760L2080 1640Z" fill="#b5b18b" stroke="#e5d9b4" stroke-width="13"/>';
 svg+='<path d="M2170 1510Q2370 1450 2510 1520L2570 1680Q2470 1740 2300 1680Z" fill="#7b9b64"/>';
 for(let i=0;i<25;i++)svg+=tree(rr(2170,2520),rr(1490,1690),rr(.55,1.16),i);
 for(let i=0;i<9;i++)svg+=house(rr(2230,2490),rr(1540,1690),rr(.72,1.06),i);
 svg+=pier(2140,1600,130);
 // Boats, fishing and sea routes.
 for(const [x,y,s] of [[1400,1470,1.1],[1130,1680,.85],[1630,1520,.78],[2060,1440,.9],[2250,1790,.67]])svg+=boat(x,y,s);
 svg+='<path d="M1320 1580Q1610 1720 1930 1430T2280 1580" stroke="#e1eacb" opacity=".55" stroke-width="6" stroke-dasharray="16 21" fill="none"/>';
 svg+='</svg>';
 return svg;
}
