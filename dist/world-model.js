import {underConstruction,neighbourhoodReady,residentsComplete} from './engine.js';

export const WORLD_LAYOUT={
 size:{w:1800,h:2700},
 regions:{
  inland:{x:130,y:120,w:1230,h:700,name:'Hillside & fields'},
  neighbourhood:{x:100,y:870,w:800,h:690,name:'Neighbourhood'},
  market:{x:920,y:930,w:690,h:660,name:'Market quarter'},
  harbour:{x:260,y:1660,w:960,h:620,name:'Home harbour'},
  coast:{x:1130,y:1660,w:620,h:850,name:'Working coast'}
 },
 sites:{
  field:{x:500,y:400,zone:'inland',kind:'field',select:'field',label:'Wheat field'},
  mill:{x:930,y:590,zone:'inland',kind:'mill',select:'mill',label:'Stone mill'},
  bakery:{x:1110,y:795,zone:'inland',kind:'bakery',select:'bakery',label:'Bakery'},
  olive:{x:360,y:760,zone:'inland',kind:'olive',select:'olive',label:'Olive workshop'},
  fishing:{x:530,y:2080,zone:'harbour',kind:'fishing',select:'fishing',label:'Fishing jetty'},
  pier:{x:900,y:1980,zone:'harbour',kind:'pier',select:'trade',label:'Working quay'},
  specialist:{x:1110,y:1400,zone:'market',kind:'workshop',select:'build',label:'Specialist workshop'},
  waterfront:{x:1090,y:2200,zone:'harbour',kind:'waterfront',select:'waterfront',label:'Waterfront'},
  lighthouse:{x:1450,y:1900,zone:'coast',kind:'lighthouse',tab:'fleet',label:'Lighthouse'},
  ferry:{x:1450,y:2280,zone:'coast',kind:'ferry',tab:'ferry',label:'Ferry terminal'}
 }
};
// Pure snapshots let art, interaction and tests share exactly the same coordinates.
export function worldEntities(s){
 const entities=Object.entries(WORLD_LAYOUT.sites).map(([id,site])=>{
  let stage='unbuilt',level=0;
  if(['field','mill','bakery'].includes(id)){stage='built';level=1;}
  if(['olive','fishing'].includes(id)&&s.businesses.includes(id)){stage=underConstruction(s,id)?'building':'built';level=1;}
  if(id==='pier'){stage=s.pier?(underConstruction(s,'pier')?'building':'built'):'unbuilt';level=s.pier?2:0;}
  if(id==='specialist'&&s.specialisation){const st=s.specialisation==='maritime'?'boatyard':'estate';if(s.specialists.includes(st)){stage=underConstruction(s,st)?'building':'built';level=1;}}
  if(id==='waterfront'){level=s.waterfront.stage;stage=s.waterfront.left?'building':level?'built':'unbuilt';}
  if(id==='lighthouse'){level=s.fleet.lighthouse.stage;stage=s.fleet.lighthouse.left?'building':level?'built':'unbuilt';}
  if(id==='ferry'){level=s.ferry.stage;stage=s.ferry.funded?'building':level?'built':'unbuilt';}
  return {id,...site,stage,level,ripe:id==='field'&&s.ripe};
 });
 const region=WORLD_LAYOUT.regions.neighbourhood;
 for(let i=0;i<6;i++){
  const p=s.neighbourhood.plots[i];
  entities.push({id:'plot'+i,x:region.x+170+i%2*350,y:region.y+160+Math.floor(i/2)*200,zone:'neighbourhood',kind:p?.type||'home',label:p?.type||'Town plot',plot:i,stage:p?.type?'built':'unbuilt',level:p?.type==='home'?1+p.level:p?.type?1:0});
 }
 for(const [type,b]of Object.entries(s.market.businesses))entities.push({id:type,x:type==='kitchen'?1450:1150,y:1150,zone:'market',kind:'market',label:type==='kitchen'?'Harbour kitchen':'Fishmonger',tab:'market',stage:b.left?'building':'built',level:1});
 for(let i=0;i<2;i++){const t=s.inland.terraces[i];entities.push({id:'terrace'+i,x:550+i*380,y:200,zone:'inland',kind:t?.type||'field',label:t?.type==='garden'?'Kitchen garden':'Fruit terrace',tab:'inland',stage:t?(t.left?'building':'built'):'unbuilt',level:t?1:0});}
 entities.push({id:'civic',x:690,y:1510,zone:'neighbourhood',kind:s.residents.proposal||'garden',label:'Residents’ plot',tab:'residents',stage:residentsComplete(s)?'built':s.residents.delivered?'building':'unbuilt',level:s.residents.delivered});
 return entities;
}
