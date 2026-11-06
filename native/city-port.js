// Native city voyages occupy real shared-engine boats without extending browser route schemas.
import * as E from '../dist/engine.js';
import * as R from './crews.js';
export const CARGO={provisions:6,cloth:6,wine:6};
export const EXPEDITIONS=[['Chart the sheltered coves','Study the city potteries'],['Invite the coastal navigators','Invite the master ceramicists']];
const clone=x=>JSON.parse(JSON.stringify(x));
const note=(s,t)=>{s.log.unshift(t);s.log=s.log.slice(0,5);};
export function freshCity(){return {serial:0,voyages:[null,null,null],glaze:0,ceramics:0,job:null,chapter:0,choices:[],explored:[]};}
export function unlocked(c){return c.projects.school?.stage===4;}
function eligible(s,c,slot){const b=s.fleet.boats[slot];return unlocked(c)&&b?.type==='coaster'&&b.upgrade==='cargo'&&!b.trip&&!c.city.voyages[slot];}
function spend(s,cost){if(!E.canAfford(s,cost))return false;for(const[k,n]of Object.entries(cost)){if(k==='coins')s.coins-=n;else s.stock[k]-=n;}return true;}
function voyageReason(s,c,slot){
 const b=s.fleet.boats[slot];
 if(!b)return 'Add a coaster to this berth, then fit Expanded hold.';
 if(b.trip||c.city.voyages[slot])return 'This boat is at sea. Choose another berth or wait for its return.';
 if(b.type!=='coaster')return 'Rebuild this cutter as a coaster below, or choose a coaster in another berth.';
 if(b.upgrade!=='cargo')return 'Fit Expanded hold in Boat upgrades & recall below.';
 const missing=Object.entries(CARGO).filter(([k,n])=>E.available(s,k)+(c.reservations['city:'+slot]?.[k]||0)<n);
 return missing.length?'Prepare city cargo: '+missing.map(([k,n])=>(E.ITEMS[k]?.name||k)+' '+Math.min(n,E.available(s,k)+(c.reservations['city:'+slot]?.[k]||0))+'/'+n).join(' · ')+'. Use Plan supplies to make the remainder.':'';
}
export function actions(s,c){
 if(!unlocked(c))return [];const y=c.city,out=[];
 for(let slot=0;slot<3;slot++){
  if(s.fleet.boats[slot]?.type==='cutter')out.push({fn:'chronicleCityRefit',args:[slot,y.serial],category:'Fleet',title:'Berth '+(slot+1)+' · rebuild cutter as coaster',cost:E.FLEET_BOATS.coaster.cost,reason:'The boat must be idle. Rebuilding uses the existing coaster purchase cost and retains installed equipment.',destructive:true});
  out.push({fn:'chronicleCitySail',args:[slot,y.serial],category:'Fleet',goal:'city:'+slot,title:'Berth '+(slot+1)+' · City port · '+(240/R.rate(c,'boat:'+slot))+'s · return with 6 glaze',cost:CARGO,reason:voyageReason(s,c,slot)||'The city storehouse is full. Decorate or contribute ceramics before another import.'});
  if(y.voyages[slot])out.push({fn:'chronicleCityRecall',args:[slot,y.voyages[slot].epoch],category:'Fleet',title:'Recall city voyage · berth '+(slot+1),cost:{},reason:'',destructive:true});
  const stage=y.chapter-1;
  if(stage>=0&&stage<2&&y.choices.length>stage&&!y.explored.includes(stage))out.push({fn:'chronicleCityExplore',args:[slot,stage,y.serial],category:'Fleet',goal:'city:'+slot,title:'Berth '+(slot+1)+' · '+EXPEDITIONS[stage][y.choices[stage]]+' · '+(240/R.rate(c,'boat:'+slot))+'s',cost:CARGO,reason:'Choose an idle coaster with Expanded hold and prepare its city cargo. Only one crew can undertake this expedition.'});
 }
 out.push({fn:'chronicleCityCraft',args:[y.serial],title:'Decorate ceramics · 2 glaze + 2 jars → 2 ceramics · 30s',cost:{jars:2},reason:'Needs 2 imported glaze, 2 finished jars and a free decorating bench.'});
 if(y.chapter<3)out.push({fn:'chronicleCityDeliver',args:[y.chapter],title:['Furnish the city gallery','A gift for the coastal visitors','The Porto Lume collection'][y.chapter]+' · '+[6,12,18][y.chapter]+' ceramics',cost:{},reason:y.chapter>0&&!y.explored.includes(y.chapter-1)?'Complete your chosen expedition before this collection.':'Decorate enough ceramics to complete this collection.'});
 if(y.chapter>0&&y.chapter<=2&&y.choices.length<y.chapter)for(let choice=0;choice<2;choice++)out.push({fn:'chronicleCityChoose',args:[y.chapter-1,choice],title:EXPEDITIONS[y.chapter-1][choice],cost:{},reason:''});
 return out;
}
export function mutate(s,c,fn,args){
 if(!unlocked(c))return false;const y=c.city;
 if(fn==='chronicleCityRefit'){const[slot,epoch]=args,b=s.fleet.boats[slot];if(epoch!==y.serial||b?.type!=='cutter'||b.trip||y.voyages[slot]||!spend(s,E.FLEET_BOATS.coaster.cost))return false;b.type='coaster';b.repeat=null;y.serial++;note(s,'Coaster rebuilt in berth '+(slot+1)+' · equipment retained');return true;}
 if(fn==='chronicleCitySail'||fn==='chronicleCityExplore'){
  const slot=args[0],expedition=fn==='chronicleCityExplore'?args[1]:null,epoch=fn==='chronicleCityExplore'?args[2]:args[1];
  if(!Number.isInteger(slot)||slot<0||slot>2||epoch!==y.serial||!eligible(s,c,slot)||y.glaze+6*(1+y.voyages.filter(Boolean).length)>1000000)return false;
  if(expedition!==null&&(expedition!==y.chapter-1||expedition>1||y.choices.length<=expedition||y.explored.includes(expedition)||y.voyages.some(v=>v?.expedition===expedition)))return false;
  if(!spend(s,CARGO))return false;s.fleet.boats[slot].repeat=null;
  y.voyages[slot]={epoch:y.serial++,left:240,expedition};note(s,(expedition===null?'City trading voyage':EXPEDITIONS[expedition][y.choices[expedition]])+' departed · berth '+(slot+1));return true;
 }
 if(fn==='chronicleCityRecall'){
  const[slot,epoch]=args,v=y.voyages[slot];if(!v||v.epoch!==epoch||Object.entries(CARGO).some(([k,n])=>s.stock[k]+n>1e9))return false;
  for(const[k,n]of Object.entries(CARGO))s.stock[k]+=n;y.voyages[slot]=null;note(s,'City voyage recalled · cargo returned; no expedition progress awarded');return true;
 }
 if(fn==='chronicleCityCraft'){
  if(args[0]!==y.serial||y.job||y.glaze<2||y.ceramics+2>1000000||!E.unlocked(s,'jars')||!spend(s,{jars:2}))return false;
  y.glaze-=2;y.job={left:30};y.serial++;note(s,'Decorating ceramics · 30 game seconds');return true;
 }
 if(fn==='chronicleCityDeliver'){
  const stage=args[0];if(stage!==y.chapter||stage>2||y.ceramics<[6,12,18][stage]||stage>0&&!y.explored.includes(stage-1))return false;
  y.ceramics-=[6,12,18][stage];y.chapter++;note(s,stage===2?'The Porto Lume collection is complete · a lasting city partnership':'The city collection is delivered · choose your next coastal expedition');return true;
 }
 if(fn==='chronicleCityChoose'){
  const[stage,choice]=args;if(![0,1].includes(stage)||stage!==y.chapter-1||y.choices.length!==stage||![0,1].includes(choice))return false;
  y.choices.push(choice);note(s,EXPEDITIONS[stage][choice]+' chosen · assign a coaster in Fleet');return true;
 }
 return false;
}
export function tick(s,c,elapsed){const y=c.city;for(let slot=0;slot<3;slot++){const v=y.voyages[slot];if(!v)continue;v.left=Math.max(0,v.left-elapsed*R.rate(c,'boat:'+slot));if(R.rate(c,'boat:'+slot)>1&&v.left<1e-9)v.left=0;if(v.left===0){y.glaze+=6;if(v.expedition!==null&&!y.explored.includes(v.expedition))y.explored.push(v.expedition);y.voyages[slot]=null;note(s,'City crew returned · 6 glaze'+(v.expedition!==null?' · expedition completed':''));}}
 if(y.job){y.job.left=Math.max(0,y.job.left-elapsed*R.rate(c,'bench'));if(R.rate(c,'bench')>1&&y.job.left<1e-9)y.job.left=0;if(y.job.left===0){y.ceramics+=2;y.job=null;note(s,'Decorated ceramics complete · +2 ceramics');}}
}
export function browserRefund(s,c){const next=clone(s);for(const v of c.city.voyages)if(v)for(const[k,n]of Object.entries(CARGO)){if(next.stock[k]+n>1e9)throw Error('Recall city voyages before exporting this town.');next.stock[k]+=n;}if(c.city.job){if(next.stock.jars+2>1e9)throw Error('Finish the decorating bench before exporting.');next.stock.jars+=2;}return next;}
export function restore(s,c){
 const y=c.city,bad=()=>{throw Error('Invalid city-port progress.');},int=(n,max=1000000)=>Number.isSafeInteger(n)&&n>=0&&n<=max;
 if(!y||typeof y!=='object'||Array.isArray(y)||Object.keys(y).sort().join()!=='ceramics,chapter,choices,explored,glaze,job,serial,voyages'||!int(y.serial,100000000)||!int(y.glaze)||!int(y.ceramics)||!int(y.chapter,3)||!Array.isArray(y.voyages)||y.voyages.length!==3||!Array.isArray(y.choices)||y.choices.length>2||y.choices.length>y.chapter||y.choices.some(n=>![0,1].includes(n))||!Array.isArray(y.explored)||new Set(y.explored).size!==y.explored.length||y.explored.some(n=>!int(n,1)||n>=y.choices.length))bad();
 if(y.chapter>=2&&!y.explored.includes(0)||y.chapter===3&&!y.explored.includes(1))bad();
 for(let slot=0;slot<3;slot++){const v=y.voyages[slot];if(!v)continue;const b=s.fleet.boats[slot];if(Object.keys(v).sort().join()!=='epoch,expedition,left'||!int(v.epoch,y.serial-1)||!Number.isFinite(v.left)||v.left<=0||v.left>240||v.expedition!==null&&(!int(v.expedition,1)||v.expedition!==y.chapter-1||v.expedition>=y.choices.length||y.explored.includes(v.expedition))||b?.type!=='coaster'||b.upgrade!=='cargo'||b.trip||b.repeat)bad();}
 const expeditions=y.voyages.filter(v=>v?.expedition!==null&&v?.expedition!==undefined).map(v=>v.expedition);if(new Set(expeditions).size!==expeditions.length||y.glaze+6*y.voyages.filter(Boolean).length>1000000)bad();
 if(y.job&&(typeof y.job!=='object'||Array.isArray(y.job)||Object.keys(y.job).join()!=='left'||!Number.isFinite(y.job.left)||y.job.left<=0||y.job.left>30||y.ceramics+2>1000000))bad();
 if(!unlocked(c)&&JSON.stringify(y)!==JSON.stringify(freshCity()))bad();return y;
}
export function view(c){return {unlocked:unlocked(c),glaze:c.city.glaze,ceramics:c.city.ceramics,chapter:c.city.chapter,jobLeft:(c.city.job?.left||0)/R.rate(c,'bench'),jobDuration:30/R.rate(c,'bench'),choices:c.city.choices.map((choice,stage)=>EXPEDITIONS[stage][choice]),explored:c.city.explored,activeVoyages:c.city.voyages.filter(Boolean).length};}
export function boats(s,c){return s.fleet.boats.map((b,i)=>{if(!b)return b;const rate=R.rate(c,'boat:'+i),v=c?.city.voyages[i],trip=v?{route:'city',duration:240,left:v.left,ferry:false}:b.trip;return trip?{...b,trip:{...trip,duration:trip.duration/rate,left:trip.left/rate}}:b;});}
