import {openingGuide,chapterTwo,chapterThree,marketGuide,inlandGuide,fleetGuide,neighbourhoodGuide,ferryGuide,neighbourhoodEligible,neighbourhoodReady,residentsComplete,ferryEligible,underConstruction} from './engine.js?v=0.20.1';

export const CHAPTERS=['A working harbour','A town of your own','From hillside to market','A living coast','Connect the harbour'];
// One source for the persistent objective, overview and next-action routing.
// Group the existing saved systems; no unlocked building or paid work is removed.
export function currentObjective(s){
 let chapter=1,g=openingGuide(s),target=g.tab||'produce',section=null;
 if(s.pier){chapter=2;g=chapterTwo(s);target=g.target;
  if(s.charter&&!underConstruction(s,'charter')){g=chapterThree(s);target='waterfront';}
 }
 if(s.waterfront.stage===3){chapter=3;g=marketGuide(s);target='market';
  if(s.market.access&&Object.values(s.market.businesses).some(b=>b.deliveries>=3)){g=inlandGuide(s);target='inland';}
 }
 if(s.inland.shipments){chapter=4;g=fleetGuide(s);target='fleet';section=[2,4].includes(g.step)?'lighthouse':'voyages';
  // Do not let neighbourhood unlocks hide unfinished lighthouse work.
  if(s.fleet.lighthouse.stage===3){
   if(!neighbourhoodReady(s)){g={step:0,title:'Make room for a living town',description:'Open the neighbourhood with your coastal partnership. Build homes, a flax garden, weaving studio, carpenter and sail loft.',label:'Plan the neighbourhood'};target='neighbourhood';}
   else {g=neighbourhoodGuide(s);target=g.target;}
  }
 }
 if(ferryEligible(s)&&neighbourhoodGuide(s).step>=6){chapter=5;g=ferryGuide(s);target='ferry';}
 return {...g,chapter,chapterName:CHAPTERS[chapter-1],target,section,complete:chapter===5&&s.ferry.runs>0};
}
