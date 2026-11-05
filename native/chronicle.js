// Native-only harbour year. No wall-clock catch-up, random rewards or browser mutations.
import * as E from '../dist/engine.js';
import * as F from './festival.js';
import * as Y from './city-port.js';
export const SEASONS=['Spring','Summer','Autumn','Winter'];
export const PARTNERS={matteo:{name:'Matteo',role:'Mason of Pietra Cove',line:'A landing should belong to the people who use it.'},lucia:{name:'Lucia',role:'Chandler of Olive Island',line:'Give a good craftsperson a reason to try something new.'},sofia:{name:'Sofia',role:'Market steward',line:'A visiting family needs more than a full storehouse.'},nico:{name:'Nico',role:'Neighbourhood organiser',line:'Let us make a place we will still enjoy next year.'},ada:{name:'Captain Ada',role:'Ferry captain',line:'Two boats can connect people as well as move cargo.'}};
export const STEPS=[1,3,6,10,15];
export const PROJECTS=[
 {id:'restoration',title:'A coast for everyone',partner:'matteo',branches:['Public waterfront','Working landing'],items:[['tiles','furniture','cloth'],['planks','boatparts','sails']],outcomes:['A shaded promenade welcomes visiting families.','A restored landing hosts travelling craftspeople.'],art:'restoration'},
 {id:'exhibition',title:'The shipwright’s exhibition',partner:'lucia',branches:['Living workshop','Seafaring collection'],items:[['planks','boatparts','cloth'],['sails','furniture','jars']],outcomes:['Artisans demonstrate their craft beside the boats.','Coastal keepsakes have a permanent home.'],art:'exhibition'},
 {id:'seawall',title:'The living sea wall',partner:'matteo',branches:['Rock pools','Working steps'],items:[['stone','tiles','jars'],['stone','planks','boatparts']],outcomes:['Tide pools turn the waterfront into a place to explore.','Broad steps connect the workshops to the shore.'],art:'seawall'},
 {id:'belltower',title:'A bell for Porto Lume',partner:'nico',branches:['Garden square','Market square'],items:[['stone','tiles','furniture'],['planks','tiles','cloth']],outcomes:['A quiet gathering place surrounds the new tower.','A gathering place for visiting makers surrounds the tower.'],art:'belltower'},
 {id:'garden',title:'The keeper’s garden',partner:'sofia',branches:['Kitchen garden','Coastal sanctuary'],items:[['jars','planks','preserves'],['tiles','jars','cloth']],outcomes:['The keeper shares seasonal recipes with visitors.','A shelter for native coastal plants welcomes explorers.'],art:'garden'},
 {id:'school',title:'The harbour school',partner:'nico',branches:['Navigation school','Craft school'],items:[['planks','furniture','sails'],['tiles','furniture','cloth']],outcomes:['Ada teaches the next generation to read the coast.','Lucia teaches the next generation to make and mend.'],art:'school'},
 {id:'regatta',title:'A regatta for the coast',partner:'ada',branches:['Sailing celebration','Coastal discovery'],items:[['sails','boatparts','provisions'],['planks','cloth','preserves']],outcomes:['A lasting sailing pavilion welcomes the coastal crews.','A coastal expedition pavilion welcomes curious travellers.'],art:'regatta'},
 {id:'wintermarket',title:'The winter gathering',partner:'sofia',branches:['Shared table','Makers’ market'],items:[['furniture','preserves','bread'],['cloth','jars','tiles']],outcomes:['A sheltered communal table brings the coast together.','A covered makers’ arcade gives the town a new meeting place.'],art:'wintermarket'}
];
// The branch changes how the fleet is used, not merely the final building picture.
// Existing cargo/ferry prices and durations remain authoritative.
export const PROJECT_TRANSPORT={
 restoration:[['cargo','passengers'],['cargo','cargo']],exhibition:[['cargo','passengers'],['passengers','cargo']],
 seawall:[['cargo','cargo'],['cargo','cargo']],belltower:[['passengers','passengers'],['cargo','passengers']],
 garden:[['cargo','passengers'],['passengers','passengers']],school:[['passengers','passengers'],['cargo','passengers']],
 regatta:[['passengers','cargo'],['passengers','passengers']],wintermarket:[['passengers','passengers'],['cargo','passengers']]
};
const PROJECT_CREWS={restoration:['Supply the landing crews','Welcome the first visiting families'],exhibition:['Bring the shipwrights together','Welcome the exhibition’s guests'],seawall:['Bring back stoneworking supplies','Supply the island work crew'],belltower:['Welcome the neighbourhood gathering','Bring the market makers'],garden:['Supply the keeper’s planting work','Welcome the coastal garden visitors'],school:['Bring the teaching crews','Welcome the first students'],regatta:['Welcome the sailing crews','Prepare the coastal gathering'],wintermarket:['Welcome the shared-table guests','Bring the winter-market makers']};
export function projectMissions(c,id){const p=c.projects[id];if(!p)return [];return ['quarry','island'].map((route,i)=>({route,passengers:PROJECT_TRANSPORT[id][p.branch][i]==='passengers',complete:p.routes.includes(route),title:PROJECT_CREWS[id][i]}));}
function projectTripMatches(c,id,route,passengers){return projectMissions(c,id).some(m=>m.route===route&&m.passengers===!!passengers);}
const THEMES=[
 {title:'Repair the spring landing',partner:'matteo',items:['planks','tiles'],event:'The first visiting makers',choices:['Equip a workshop','Prepare their shared table'],alternatives:['cloth','bread']},
 {title:'A summer by the water',partner:'sofia',items:['bread','preserves'],event:'A place for the visitors',choices:['Welcome families','Welcome sailing crews'],alternatives:['furniture','sails']},
 {title:'Keep the autumn harvest',partner:'lucia',items:['preserves','oil'],event:'The harvest exchange',choices:['Share the pantry','Demonstrate local crafts'],alternatives:['jars','cloth']},
 {title:'Warm rooms for winter',partner:'nico',items:['cloth','furniture'],event:'A winter meeting place',choices:['Set a shared table','Open the makers’ hall'],alternatives:['bread','tiles']}
];
function theme(o){if(o.theme===null)return THEMES[o.season%4];const d=PROJECTS.find(p=>p.id===o.theme);return {partner:d.partner,title:d.title+' · visiting neighbours',event:d.title+' · the next gathering',choices:['Host a practical workshop','Host a shared gathering']};}
const copy=x=>JSON.parse(JSON.stringify(x));
const keys=(x,w)=>x&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).sort().join()===w.split(',').sort().join();
const integer=(n,max=1000000)=>Number.isSafeInteger(n)&&n>=0&&n<=max;
const note=(s,t)=>{s.log.unshift(t);s.log=s.log.slice(0,5);};
export function freshChronicle(){return {pin:null,started:false,elapsed:0,serial:0,offers:[],partners:Object.fromEntries(Object.keys(PARTNERS).map(k=>[k,0])),projects:{},standing:0,ledger:[],reservations:{},partnerWork:{},specialist:null,festivalTickets:null,coast:'harbour',townName:'Porto Lume',awning:'terracotta',city:Y.freshCity()};}
export function enableFestival(c,f){if(f.stage===4&&!c.festivalTickets)c.festivalTickets={next:f.orders+1,slots:[0,1].map(i=>({epoch:f.orders,template:(f.orders*2+i)%4}))};}
export function canMake(s,item){return ['wood','stone'].includes(item)||Object.entries(E.RECIPES).some(([k,r])=>r.output[item]&&E.unlocked(s,k));}
function size(s){const n=new Set(Object.entries(E.RECIPES).filter(([k])=>E.unlocked(s,k)).map(([,r])=>r.station)).size;return n>=12?18:n>=7?12:6;}
function offer(s,c,kind){
 const season=Math.floor(c.elapsed/1200),seasonTheme=THEMES[season%4],completed=PROJECTS.filter(d=>c.projects[d.id]?.stage===4),followup=kind===2&&completed.length&&c.serial%2===0?completed[c.serial%completed.length]:null;
 const preferred=followup?(c.projects[followup.id].branch===0?['furniture','bread']:['boatparts','cloth']):kind===0?seasonTheme.items:seasonTheme.alternatives;
 return {id:'request-'+(++c.serial),kind,season,theme:followup?.id||null,size:size(s),items:preferred.map(i=>c.coast==='rocky'&&kind===0?'stone':c.coast==='marsh'&&kind===0?(canMake(s,'preserves')?'preserves':'bread'):canMake(s,i)?i:'bread'),accepted:false,choice:null,boats:[],eligible:[],routes:[]};
}
function refill(s,c){for(let kind=0;kind<3;kind++)if(!c.offers.some(o=>o.kind===kind))c.offers.push(offer(s,c,kind));}
function remember(s,c,title,body){c.ledger.unshift({id:'memory-'+(++c.serial),title,body,seconds:s.seconds,season:Math.floor(c.elapsed/1200)});c.ledger=c.ledger.slice(0,32);}
function partner(o){return o.kind===1?'ada':theme(o).partner;}
function requestCost(o){if(o.kind===1)return {};if(o.kind===2)return o.choice===null?{}:{[o.items[o.choice]]:o.size};return Object.fromEntries([...new Set(o.items)].map(i=>[i,o.size]));}
function requestTitle(o){return o.kind===1?'Bring the coast together':o.kind===2?theme(o).event:theme(o).title;}
export function projectCost(c,id){const p=c.projects[id],d=PROJECTS.find(d=>d.id===id);if(!p||p.stage>=4||p.stage===2)return {};const i=p.stage===3?2:p.stage;return {[d.items[p.branch][i]]:[12,24,36][i]};}
export function goalCost(c,goal,f=null,s=null){if(!c)return null;if(/^city:[0-2]$/.test(goal))return Y.unlocked(c)?Y.CARGO:null;if(goal.startsWith('native-festival:')){return f?F.offers(s,f,c.festivalTickets).find(o=>'native-festival:'+JSON.stringify([o.fn,o.args])===goal)?.cost||null:null;}const o=c.offers.find(o=>'year:'+o.id===goal);if(o?.accepted)return requestCost(o);if(goal.startsWith('partner:')){const[,id,stage]=goal.split(':');if(Object.hasOwn(PARTNERS,id)&&(c.partnerWork[id]||0)===Number(stage)&&Number(stage)<4&&c.partners[id]>=[1,3,6,15][Number(stage)])return partnerCost(c,id,Number(stage));return null;}if(goal.startsWith('chronicle:')){const [,id,stage]=goal.split(':');if(c.projects[id]?.stage===Number(stage))return projectCost(c,id);}return null;}
export function goalTitle(c,goal){const o=c?.offers.find(o=>'year:'+o.id===goal);return o?requestTitle(o):goal.startsWith('partner:')?(PARTNERS[goal.split(':')[1]]?.name+' · personal request'):PROJECTS.find(p=>goal.startsWith('chronicle:'+p.id+':'))?.title||'Harbour project';}
function holding(c,goal,item){return c.reservations[goal]?.[item]||0;}
function affordable(s,c,goal,cost){return Object.entries(cost).every(([k,n])=>E.available(s,k)+holding(c,goal,k)>=n);}
function pay(s,c,goal,cost){if(!affordable(s,c,goal,cost))return false;for(const [k,n]of Object.entries(cost)){const held=holding(c,goal,k),free=n-held;if(k==='coins')s.coins-=free;else s.stock[k]-=free;}delete c.reservations[goal];return true;}
export function reserve(s,c,goal,f=null){const cost=goalCost(c,goal,f,s);if(!cost||!Object.keys(cost).length)return false;const held=c.reservations[goal]||{};let changed=false;for(const[k,n]of Object.entries(cost)){const take=Math.min(n-(held[k]||0),Math.max(0,E.available(s,k)));if(take>0){held[k]=(held[k]||0)+take;if(k==='coins')s.coins-=take;else s.stock[k]-=take;changed=true;}}if(changed)c.reservations[goal]=held;return changed;}
export function release(s,c,goal){const held=c.reservations[goal];if(!held)return false;for(const[k,n]of Object.entries(held))if((k==='coins'?s.coins:s.stock[k])+n>1e9)return false;for(const[k,n]of Object.entries(held)){if(k==='coins')s.coins+=n;else s.stock[k]+=n;}delete c.reservations[goal];return true;}
export function exportTown(s,c){const next=copy(s);if(c)for(const goal of Object.keys(c.reservations))if(!release(next,copy(c),goal))throw Error('Release reserved native supplies before exporting this town.');return c?Y.browserRefund(next,c):next;}
export function planTown(s,c,goal){const next=copy(s);for(const [item,n]of Object.entries(c?.reservations[goal]||{})){if(item==='coins')next.coins+=n;else next.stock[item]+=n;}return next;}
export const PARTNER_ITEMS={matteo:'tiles',lucia:'boatparts',sofia:'preserves',nico:'furniture',ada:'sails'};
export function partnerCost(c,id,stage){return {[PARTNER_ITEMS[id]]:[6,6,18,36][stage]};}
export function actions(s,c,f){
 if(!c?.started)return [...(f.stage===4?[{fn:'chronicleBegin',args:[],title:'Begin the harbour year',cost:{},reason:''}]:[]),...Object.keys(c?.reservations||{}).map(goal=>({fn:'chronicleRelease',args:[goal],title:'Release reserved festival supplies',cost:{},reason:''}))];
 const out=Y.actions(s,c);
 for(const o of c.offers){const goal='year:'+o.id;
  if(!o.accepted)out.push({fn:'chronicleAccept',args:[o.id],title:'Accept · '+requestTitle(o),cost:{},reason:''});
  else if(o.kind===2&&o.choice===null)for(let i=0;i<2;i++)out.push({fn:'chronicleChoose',args:[o.id,i],title:theme(o).choices[i],cost:{},reason:''});
  else out.push({fn:'chronicleDeliver',args:[o.id],title:o.kind===1?'Welcome both crews':'Contribute · '+requestTitle(o),cost:requestCost(o),goal,reason:o.kind===1?'Complete a passenger service with two different boats after accepting this request.':'Prepare the finished supplies.'});
 }
 const done=PROJECTS.filter(d=>c.projects[d.id]?.stage===4).length;
 for(const d of PROJECTS.slice(0,Math.min(PROJECTS.length,done+2))){const p=c.projects[d.id];
  if(!p){for(let branch=0;branch<2;branch++)out.push({fn:'chronicleProject',args:[d.id,branch],title:'Choose · '+d.branches[branch],cost:{},reason:['seawall','belltower','school'].includes(d.id)&&c.standing<1?'Share bread with a built household to earn town standing. Open Neighbourhood if you need a home.':'Finish the current chronicle project first.'});}
  else if(p.stage<4)out.push({fn:'chronicleBuild',args:[d.id,p.stage],title:['Lay the foundations','Equip the place','Welcome both crews','Open '+d.title.toLowerCase()][p.stage],cost:projectCost(c,d.id),goal:'chronicle:'+d.id+':'+p.stage,reason:p.stage===2?'Complete the two listed project missions using different boats after this stage begins. Cargo and passenger work count only for their assigned coast.':'Make the finished supplies for this stage.'});
 }
 if(households(s)>0)out.push({fn:'chronicleHouseholds',args:[c.standing],title:'Supply the neighbourhood table',cost:{bread:6*households(s)},goal:null,reason:'Share bread with the households actually living here. Each delivery earns town standing.'});
 for(const[id,d]of Object.entries(PARTNERS)){
  const stage=c.partnerWork[id]||0,threshold=[1,3,6,15][stage];
  if(stage<4&&c.partners[id]>=threshold)out.push({fn:'chroniclePartner',args:[id,stage],title:[d.name+' · a first commission',d.name+' · a trusted-price commission',d.name+' · equip a specialist',d.name+' · a personal place'][stage],cost:partnerCost(c,id,stage),goal:'partner:'+id+':'+stage,reason:'Prepare the finished supplies for this personal request.'});
  if(stage>=3&&c.specialist!==id)out.push({fn:'chronicleSpecialist',args:[id],title:'Ask '+d.name+' to guide your next choice',cost:{},reason:''});
 }
 if(c.specialist)for(const o of c.offers)if(o.accepted&&o.kind===2&&o.choice!==null&&!Object.keys(c.reservations['year:'+o.id]||{}).length)out.push({fn:'chronicleAdvice',args:[o.id,o.choice],title:PARTNERS[c.specialist].name+' · reconsider this gathering',cost:{},reason:''});
 for(const goal of Object.keys(c.reservations))out.push({fn:'chronicleRelease',args:[goal],title:'Release · '+goalTitle(c,goal),cost:{},reason:''});
 return out;
}
export function households(s){return s.neighbourhood.plots.reduce((n,p)=>n+(p?.type==='home'&&!p.left?1+(p.level||0):0),0);}
export function mutate(s,c,f,fn,args){
 if(fn==='chronicleBegin'){if(c.started||f.stage!==4)return false;c.started=true;enableFestival(c,f);refill(s,c);note(s,'The harbour year begins · choose a request or a lasting project');return true;}
 if(fn==='chronicleRelease')return release(s,c,args[0]);
 if(!c.started)return false;
 if(fn.startsWith('chronicleCity')){if(['chronicleCitySail','chronicleCityExplore'].includes(fn)){const goal='city:'+args[0];for(const[k,n]of Object.entries(c.reservations[goal]||{}))s.stock[k]+=n;delete c.reservations[goal];}const ok=Y.mutate(s,c,fn,args);if(ok&&['chronicleCityDeliver','chronicleCityChoose'].includes(fn))remember(s,c,'The city and the coast',s.log[0]);return ok;}
 if(fn==='chroniclePartner'){
  const[id,stage]=args;if(!Object.hasOwn(PARTNERS,id)||stage!==(c.partnerWork[id]||0)||stage>=4||c.partners[id]<[1,3,6,15][stage]||!pay(s,c,'partner:'+id+':'+stage,partnerCost(c,id,stage)))return false;
  c.partnerWork[id]=stage+1;remember(s,c,PARTNERS[id].name+' · '+['a first commission','a trusted partnership','a specialist for the town','a personal place'][stage],stage===1?'Your trusted-price commission used six goods instead of the usual twelve.':stage===2?'You can assign this specialist to reopen an unreserved visitor choice.':stage===3?'A personal painted detail now belongs to your town.':'A new relationship has begun.');note(s,PARTNERS[id].name+' remembers this work · relationship reward saved');return true;
 }
 if(fn==='chronicleSpecialist'){const id=args[0];if((c.partnerWork[id]||0)<3||c.specialist===id)return false;c.specialist=id;note(s,PARTNERS[id].name+' is advising your town · visitor choices can be reconsidered before reserving or contributing');return true;}
 if(fn==='chronicleAdvice'){const o=c.offers.find(o=>o.id===args[0]);if(!c.specialist||!o?.accepted||o.kind!==2||o.choice!==args[1]||o.choice===null||Object.keys(c.reservations['year:'+o.id]||{}).length)return false;o.choice=null;note(s,PARTNERS[c.specialist].name+' helped you reconsider · choose the gathering you want');return true;}
 if(fn==='chronicleRelease')return release(s,c,args[0]);
 if(fn==='chronicleHouseholds'){if(args[0]!==c.standing||c.standing>=1000000||!households(s)||!pay(s,c,'households',{bread:6*households(s)}))return false;c.standing++;note(s,'The neighbourhood table is ready · town standing '+c.standing);return true;}
 if(fn==='chronicleProject'){
  const [id,branch]=args,d=PROJECTS.find(p=>p.id===id),done=Object.values(c.projects).filter(p=>p.stage===4).length;
  if(!d||![0,1].includes(branch)||c.projects[id]||Object.values(c.projects).some(p=>p.stage<4)||PROJECTS.indexOf(d)>=done+2)return false;
  if(['seawall','belltower','school'].includes(id)&&c.standing<1)return false;
  c.projects[id]={branch,stage:0,boats:[],eligible:[],routes:[]};c.pin='chronicle:'+id;note(s,d.branches[branch]+' chosen · this branch shapes the finished place');return true;
 }
 if(fn==='chronicleBuild'){
  const [id,stage]=args,p=c.projects[id],d=PROJECTS.find(p=>p.id===id);if(!p||p.stage!==stage||stage>=4||stage===2&&(p.boats.length<2||p.routes.length<2))return false;
  if(!pay(s,c,'chronicle:'+id+':'+stage,projectCost(c,id)))return false;p.stage++;
  if(p.stage===4){c.partners[d.partner]=Math.min(1000000,c.partners[d.partner]+1);remember(s,c,d.title,d.outcomes[p.branch]);note(s,d.title+' opened · '+d.outcomes[p.branch]);}else note(s,d.title+' · stage '+(p.stage+1)+' ready');return true;
 }
 const o=c.offers.find(o=>o.id===args[0]);if(!o)return false;
 if(fn==='chronicleAccept'){if(o.accepted)return false;o.accepted=true;c.pin='year:'+o.id;note(s,requestTitle(o)+' accepted · supplies and progress will never expire');return true;}
 if(!o.accepted)return false;
 if(fn==='chronicleChoose'){if(o.kind!==2||o.choice!==null||![0,1].includes(args[1]))return false;o.choice=args[1];note(s,theme(o).choices[o.choice]+' chosen · contribute the supplies when ready');return true;}
 if(fn!=='chronicleDeliver'||o.kind===2&&o.choice===null||o.kind===1&&(o.boats.length<2||c.coast==='windy'&&o.routes.length<2)||!pay(s,c,'year:'+o.id,requestCost(o)))return false;
 const who=partner(o);c.partners[who]=Math.min(1000000,c.partners[who]+1);remember(s,c,requestTitle(o),PARTNERS[who].name+' remembers your help'+(o.choice!==null?' · '+theme(o).choices[o.choice]:''));
 c.offers=c.offers.filter(p=>p!==o);refill(s,c);note(s,PARTNERS[who].name+' · Thank you. This is what makes a harbour feel like home.');return true;
}
// Only explicitly dispatched trips after acceptance qualify. Recalled and already-running trips cannot count.
export function departure(c,fn,args){if(!c?.started)return;const slot=args[0];if(!Number.isInteger(slot))return;
 const cargo=fn==='startVoyage',passenger=fn==='startFerryService',cancel=fn==='cancelVoyage';
 if(!cargo&&!passenger&&!cancel)return;
 for(const o of c.offers)if(o.accepted&&o.kind===1){o.eligible=o.eligible.filter(n=>n!==slot);if(passenger)o.eligible.push(slot);}
 for(const[id,p]of Object.entries(c.projects))if(p.stage===2){p.eligible=p.eligible.filter(n=>n!==slot);if((cargo||passenger)&&projectTripMatches(c,id,args[1],passenger))p.eligible.push(slot);}
}
export function tick(s,c,before,elapsed){if(!c?.started||elapsed<=0)return;Y.tick(s,c,elapsed);const old=Math.floor(c.elapsed/1200);c.elapsed=Math.min(1200*1000000-1,c.elapsed+elapsed);
 for(let slot=0;slot<before.length;slot++){const trip=before[slot];if(!trip||trip.left>elapsed)continue;
  for(const o of c.offers)if(o.accepted&&o.kind===1&&o.eligible.includes(slot)&&trip.ferry){if(!o.boats.includes(slot))o.boats.push(slot);if(!o.routes.includes(trip.route))o.routes.push(trip.route);o.eligible=o.eligible.filter(n=>n!==slot);}
  for(const[id,p]of Object.entries(c.projects))if(p.stage===2&&p.eligible.includes(slot)&&projectTripMatches(c,id,trip.route,trip.ferry)){if(!p.boats.includes(slot))p.boats.push(slot);if(!p.routes.includes(trip.route))p.routes.push(trip.route);p.eligible=p.eligible.filter(n=>n!==slot);}
 }
 if(Math.floor(c.elapsed/1200)!==old){c.offers=c.offers.filter(o=>o.accepted);refill(s,c);note(s,SEASONS[Math.floor(c.elapsed/1200)%4]+' begins · accepted work is safe; unaccepted opportunities have changed');}
}
export function restore(s,f,raw){
 const bad=()=>{throw Error('Invalid native chronicle. Your original save has not been changed.');};
 if(!keys(raw,'pin,started,elapsed,serial,offers,partners,projects,standing,ledger,reservations,partnerWork,specialist,festivalTickets,coast,townName,awning,city'))bad();const c=copy(raw);
 if(!['harbour','rocky','marsh','windy'].includes(c.coast)||typeof c.townName!=='string'||c.townName.trim()!==c.townName||c.townName.length<1||c.townName.length>40||/[\x00-\x1f\x7f]/.test(c.townName)||!['terracotta','teal','cream'].includes(c.awning))bad();
 if(c.pin!==null&&(typeof c.pin!=='string'||c.pin.length>80||! /^(direction:(industry|coast|community)|year:request-\d+|chronicle:[a-z]+|festival|guide)$/.test(c.pin)))bad();
 if(typeof c.started!=='boolean'||!Number.isFinite(c.elapsed)||c.elapsed<0||c.elapsed>=1200*1000000||!integer(c.serial,100000000)||!integer(c.standing)||c.started&&f.stage!==4)bad();
 if(!keys(c.partners,Object.keys(PARTNERS).join())||Object.values(c.partners).some(n=>!integer(n)))bad();
 if(!Array.isArray(c.offers)||c.offers.length>3||new Set(c.offers.map(o=>o.kind)).size!==c.offers.length||new Set(c.offers.map(o=>o.id)).size!==c.offers.length)bad();
 const slots=a=>Array.isArray(a)&&a.length<=3&&new Set(a).size===a.length&&a.every(n=>integer(n,2));
 for(const o of c.offers){if(!keys(o,'id,kind,season,theme,size,items,accepted,choice,boats,eligible,routes')||!/^request-[1-9]\d*$/.test(o.id)||Number(o.id.slice(8))>c.serial||(o.theme!==null&&(!PROJECTS.some(p=>p.id===o.theme)||c.projects[o.theme]?.stage!==4))||!integer(o.kind,2)||!integer(o.season,Math.floor(c.elapsed/1200))||![6,12,18].includes(o.size)||!Array.isArray(o.items)||o.items.length!==2||o.items.some(i=>!Object.hasOwn(E.ITEMS,i))||typeof o.accepted!=='boolean'||![null,0,1].includes(o.choice)||!slots(o.boats)||!slots(o.eligible)||!Array.isArray(o.routes)||new Set(o.routes).size!==o.routes.length||o.routes.some(r=>!['quarry','island'].includes(r))||!o.accepted&&(o.choice!==null||o.boats.length||o.eligible.length||o.routes.length)||o.kind!==1&&(o.boats.length||o.eligible.length||o.routes.length)||o.kind!==2&&o.choice!==null)bad();}
 if(!c.partnerWork||typeof c.partnerWork!=='object'||Array.isArray(c.partnerWork)||Object.entries(c.partnerWork).some(([id,n])=>!Object.hasOwn(PARTNERS,id)||!integer(n,4)||n===0||c.partners[id]<[1,3,6,15][n-1])||c.specialist!==null&&(!Object.hasOwn(PARTNERS,c.specialist)||(c.partnerWork[c.specialist]||0)<3))bad();
 if(!c.projects||typeof c.projects!=='object'||Array.isArray(c.projects)||Object.keys(c.projects).length>8)bad();
 for(const[id,p]of Object.entries(c.projects)){if(!PROJECTS.some(d=>d.id===id)||!keys(p,'branch,stage,boats,eligible,routes')||![0,1].includes(p.branch)||!integer(p.stage,4)||!slots(p.boats)||!slots(p.eligible)||!Array.isArray(p.routes)||new Set(p.routes).size!==p.routes.length||p.routes.some(r=>!['quarry','island'].includes(r))||p.stage<2&&(p.boats.length||p.routes.length||p.eligible.length)||p.stage>2&&(p.boats.length<2||p.routes.length<2))bad();}
 if(Object.values(c.projects).filter(p=>p.stage<4).length>1)bad();
 if(!Array.isArray(c.ledger)||c.ledger.length>32)bad();for(const m of c.ledger)if(!keys(m,'id,title,body,seconds,season')||['id','title','body'].some(k=>typeof m[k]!=='string'||m[k].length>300)||!Number.isFinite(m.seconds)||m.seconds<0||m.seconds>s.seconds||!integer(m.season,Math.floor(c.elapsed/1200)))bad();
 if(!c.reservations||typeof c.reservations!=='object'||Array.isArray(c.reservations)||Object.keys(c.reservations).length>16)bad();
 for(const[goal,held]of Object.entries(c.reservations)){const cost=goalCost(c,goal,f,s);if(!cost||!held||typeof held!=='object'||Array.isArray(held)||!Object.keys(held).length)bad();for(const[k,n]of Object.entries(held))if(!integer(n,1000)||n===0||n>(cost[k]||0)||(s.stock[k]||0)+n>1e9)bad();}
 if(c.festivalTickets){const t=c.festivalTickets;if(f.stage!==4||!keys(t,'next,slots')||!integer(t.next,1000001)||!Array.isArray(t.slots)||t.slots.length!==2||t.slots.some(p=>!keys(p,'epoch,template')||!integer(p.epoch,t.next-1)||!integer(p.template,3)))bad();}
 if(!c.started&&(c.elapsed||c.serial||c.offers.length||Object.keys(c.projects).length||c.standing||c.ledger.length||Object.values(c.partners).some(Boolean)||Object.keys(c.reservations).some(g=>!g.startsWith('native-festival:'))||Object.keys(c.partnerWork).length||c.specialist!==null))bad();
 if(c.started&&c.offers.length!==3)bad();Y.restore(s,c);return c;
}
export function view(s,c,f){const live=c||freshChronicle(),season=Math.floor(live.elapsed/1200);return {city:Y.view(live),coast:live.coast,townName:live.townName,awning:live.awning,started:live.started,unlocked:f.stage===4,pin:live.pin,season:SEASONS[season%4],year:Math.floor(season/4)+1,remaining:1200-live.elapsed%1200,standing:live.standing,households:households(s),
 offers:live.offers.map(o=>({id:o.id,title:requestTitle(o),partner:PARTNERS[partner(o)].name,body:o.kind===1?(live.coast==='windy'?'Complete passenger services with two different boats, returning from both shores.':'Choose two different boats and complete a passenger service with each.'):o.kind===2?'Choose the visitors you want to welcome. Your choice determines the supplies you contribute.':'Finished supplies help a named neighbour. Stock already reserved for another project stays protected.',accepted:o.accepted,kind:o.kind,boats:o.boats.length,choice:o.choice===null?null:theme(o).choices[o.choice],goal:'year:'+o.id,cost:requestCost(o)})),
 partners:Object.entries(PARTNERS).map(([id,d])=>({id,...d,requests:live.partners[id],work:live.partnerWork[id]||0,assigned:live.specialist===id,level:STEPS.filter(n=>live.partners[id]>=n).length,next:STEPS.find(n=>live.partners[id]<n)||null})),
 projects:PROJECTS.slice(0,Math.min(8,Object.values(live.projects).filter(p=>p.stage===4).length+2)).map(d=>{const p=live.projects[d.id];return {id:d.id,title:d.title,partner:PARTNERS[d.partner].name,branches:d.branches,outcomes:d.outcomes,art:d.art,stage:p?.stage??-1,branch:p?.branch??-1,boats:p?.boats.length||0,routes:p?.routes.length||0,usedBoats:p?.boats||[],missions:projectMissions(live,d.id),transport:PROJECT_TRANSPORT[d.id],goal:p?'chronicle:'+d.id+':'+p.stage:null,materials:d.items,needsStanding:['seawall','belltower','school'].includes(d.id)&&live.standing<1};}),memories:live.ledger};}
