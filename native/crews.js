// Optional native crew assignments. Rates are derived, never saved in the town.
import * as E from '../dist/engine.js';
export const RATE=1.25;
export const NAMES=['School team','Regatta team'];
export function count(c){return c?.started&&c.projects.school?.stage===4?1+(c.projects.regatta?.stage===4?1:0):0;}
export function rate(c,target){return c?.crews?.assignments.includes(target)?RATE:1;}
export function targets(s,c){
 const stations=[...new Set(Object.entries(E.RECIPES).filter(([key])=>E.unlocked(s,key)).map(([,r])=>r.station))];
 const out=stations.map(station=>({id:'station:'+station,title:E.ADVANCED_STATIONS[station]||E.REFITS[station]?.name||Object.values(E.RECIPES).find(r=>r.station===station).name,kind:'Production',recipe:Object.keys(E.RECIPES).find(key=>E.RECIPES[key].station===station&&E.unlocked(s,key))}));
 for(let i=0;i<s.fleet.boats.length;i++)if(s.fleet.boats[i])out.push({id:'boat:'+i,title:'Berth '+(i+1)+' · '+E.FLEET_BOATS[s.fleet.boats[i].type].name,kind:'Fleet',recipe:null});
 if(c?.projects.school?.stage===4)out.push({id:'bench',title:'Decorating bench',kind:'City',recipe:null});
 return out;
}
export function busy(s,c,target){
 if(target===null)return '';
 if(target==='bench')return c.city.job?'Finish the current ceramics before moving this team.':'';
 if(target.startsWith('boat:')){const i=Number(target.slice(5)),b=s.fleet.boats[i];return b?.trip||c.city.voyages[i]?'Wait for this boat to return before moving a team.':b?.repeat?'Stop automatic repeat sailings before moving a team.':'';}
 return s.jobs.some(j=>E.RECIPES[j.key].station===target.slice(8))?'Finish active batches and clear the waiting queue before moving a team. Turn off stock targets if they keep adding work.':'';
}
export function blocker(s,c,team,target,epoch){
 if(!Number.isInteger(team)||team<0||team>=count(c))return 'Complete the harbour school for the first team and the regatta for the second.';
 if(epoch!==(c.crews?.epoch||0)||epoch>=100000000)return 'This assignment changed. Review the current teams.';
 const assignments=c.crews?.assignments||[null,null],old=assignments[team];
 if(target!==null&&(typeof target!=='string'||!targets(s,c).some(t=>t.id===target)))return 'Choose an existing workshop or boat.';
 if(old===target)return 'This team is already assigned here.';
 if(target!==null&&assignments.includes(target))return 'The other team already helps here. Teams cannot stack.';
 return busy(s,c,old)||busy(s,c,target);
}
export function assign(s,c,team,target,epoch){
 if(blocker(s,c,team,target,epoch))return false;
 c.crews??={epoch:0,assignments:[null,null]};c.crews.assignments[team]=target;c.crews.epoch++;
 const title=targets(s,c).find(t=>t.id===target)?.title;
 s.log=[NAMES[team]+(target?' assigned to '+title+' · 25% extra work, unchanged supplies and rewards':' is available for a new assignment'),...s.log].slice(0,5);return true;
}
export function restore(s,c){
 if(!Object.hasOwn(c,'crews'))return;
 const x=c.crews,valid=targets(s,c).map(t=>t.id),bad=()=>{throw Error('Invalid harbour crew assignments. Your original save has not been changed.');};
 if(!x||typeof x!=='object'||Array.isArray(x)||Object.keys(x).sort().join()!=='assignments,epoch'||!Number.isSafeInteger(x.epoch)||x.epoch<1||x.epoch>100000000||!Array.isArray(x.assignments)||x.assignments.length!==2||!count(c))bad();
 if(x.assignments.some((t,i)=>t!==null&&(i>=count(c)||!valid.includes(t)))||new Set(x.assignments.filter(t=>t!==null)).size!==x.assignments.filter(t=>t!==null).length)bad();
}
// If the player removes a workplace, keep the team rather than a dangling slot.
export function reconcile(s,c){
 if(!c?.crews)return;const valid=targets(s,c).map(t=>t.id);
 if(c.crews.assignments.some(t=>t!==null&&!valid.includes(t))){c.crews.assignments=c.crews.assignments.map(t=>valid.includes(t)?t:null);c.crews.epoch++;}
}
export function work(c,onArrival){
 const stations={},boats={};for(const t of c?.crews?.assignments||[]){if(t?.startsWith('station:'))stations[t.slice(8)]=RATE;if(t?.startsWith('boat:'))boats[Number(t.slice(5))]=RATE;}
 return {stations,boats,onArrival};
}
export function view(s,c){
 const n=count(c),epoch=c?.crews?.epoch||0,all=targets(s,c),assigned=c?.crews?.assignments||[null,null];
 return {epoch,unlocked:n,teams:NAMES.map((name,id)=>({id,name,unlocked:id<n,target:assigned[id],title:all.find(t=>t.id===assigned[id])?.title||'Available',reason:id<n?busy(s,c,assigned[id]):id===0?'Complete the harbour school.':'Complete the regatta.',options:[{id:'unassigned',title:'Make available',kind:'People',recipe:null},...all].map(t=>({...t,reason:blocker(s,c,id,t.id==='unassigned'?null:t.id,epoch)}))}))};
}
