// Individual supplementary architecture for both charter-owned specialist plots.
// Shares the existing palette, 320-unit frame, sunlight and isometric projection.
import {painterlyBuilding} from '../../dist/lab/painterly-assets.js';
export function nativeBuilding(e){
 if(!['boatyard','estate'].includes(e.kind))return painterlyBuilding(e);
 const base=painterlyBuilding({...e,kind:e.kind==='boatyard'?'carpenter':'home'});
 if(e.stage==='unbuilt')return base;
 let details='';
 if(e.kind==='boatyard'){
  details='<path d="M-112 60Q-73 90-34 60L-46 82Q-74 102-101 83Z" fill="#916245" stroke="#e9c49a" stroke-width="4"/><path d="M-109 58Q-72 78-36 58M-98 61l5 22m10-19v27m12-26v25m11-28-4 23" fill="none" stroke="#e9c49a" stroke-width="3"/><path d="M-111 90v17m74-18v15M75 25v-104l46 21v79m-46-91 45 21" stroke="#876c50" stroke-width="6" fill="none"/><path d="M102-57v70m-6-2q6 14 13 0" fill="none" stroke="#344f4c" stroke-width="3"/>';
 }else{
  details='<path d="M-120 49-52 13m-61 57 68-36m-61 57 68-36" stroke="#88724f" stroke-width="4"/>';
  for(let i=0;i<12;i++){const x=-111+i%4*17,y=43+Math.floor(i/4)*21-i%4*9;details+=`<path d="M${x} ${y+12}v-18" stroke="#856745" stroke-width="3"/><ellipse cx="${x}" cy="${y-6}" rx="12" ry="7" fill="#6a8055"/><circle cx="${x-2}" cy="${y}" r="3" fill="#79657b"/>`;}
  details+='<ellipse cx="83" cy="59" rx="18" ry="11" fill="#aa7a50" stroke="#654b39" stroke-width="3"/><path d="M65 59v22q17 19 36 0V59m-34 9 32 0m-31 10h30" fill="#b68a59" stroke="#74513b" stroke-width="3"/>';
 }
 return base+`<g opacity="${e.stage==='building'?'.45':'1'}">${details}</g>`;
}
