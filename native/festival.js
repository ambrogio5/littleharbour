// Native post-ferry project. Canonical browser town fields remain version 13.
import * as E from '../dist/engine.js';
import {currentObjective} from '../dist/progression.js';
export const PREPARATION={coins:300,wood:12,tiles:8};
export const SUPPLIES={food:{bread:24,preserves:12,jars:8},craft:{cloth:12,furniture:8,tiles:12}};
export const FINALE={food:{furniture:4,cloth:4,bread:8,preserves:8},craft:{bread:12,preserves:8,cloth:4,jars:4}};
export const REQUESTS=[
 {name:'A picnic on the quay',cost:{bread:12,preserves:6,jars:4},coins:380},
 {name:'Furnish a visiting workshop',cost:{furniture:6,cloth:4},coins:420},
 {name:'Lanterns for the coast',cost:{jars:8,tiles:8,cloth:4},coins:400},
 {name:'A farewell supper',cost:{bread:16,preserves:8},coins:360}
];
export function freshFestival(){return {stage:0,choice:null,baselineRuns:0,visits:{quarry:0,island:0},orders:0};}
export function available(s,f){return f.stage>0||currentObjective(s).complete;}
export function restoreFestival(s,raw){
 const bad=()=>{throw Error('Invalid harbour festival progress.');};
 if(!raw||typeof raw!=='object'||Array.isArray(raw)||Object.keys(raw).sort().join()!=='baselineRuns,choice,orders,stage,visits')bad();
 const {stage,choice,baselineRuns,visits,orders}=raw;
 if(!Number.isInteger(stage)||stage<1||stage>4||!['food','craft'].includes(choice)||!Number.isSafeInteger(orders)||orders<0||orders>1000000||stage<4&&orders!==0)bad();
 if(!Number.isSafeInteger(baselineRuns)||baselineRuns<1||baselineRuns>s.ferry.runs||s.ferry.stage!==3)bad();
 if(!visits||typeof visits!=='object'||Array.isArray(visits)||Object.keys(visits).sort().join()!=='island,quarry'||Object.values(visits).some(n=>!Number.isInteger(n)||n<0||n>2))bad();
 const total=visits.quarry+visits.island;
 if(total>s.ferry.runs-baselineRuns||stage===1&&total!==0||stage===2&&total>=4||stage>=3&&total!==4)bad();
 return {stage,choice,baselineRuns,visits:{quarry:visits.quarry,island:visits.island},orders};
}
function note(s,message){s.log.unshift(message);s.log=s.log.slice(0,5);}
export function offers(s,f,tickets=null){
 if(!available(s,f))return [];
 if(f.stage===0)return [{fn:'festivalPrepare',args:[],title:'Prepare the festival courtyard',cost:PREPARATION}];
 if(f.stage===1)return [
  ...['food','craft'].map(choice=>({fn:'festivalChoose',args:[choice],title:choice==='food'?'Choose a food fair':'Choose a craft exhibition',cost:{},reason:choice===f.choice?'This theme is already selected.':''})),
  {fn:'festivalSupply',args:[f.choice],title:f.choice==='food'?'Stock the food fair':'Supply the craft exhibition',cost:SUPPLIES[f.choice]}
 ];
 if(f.stage===3)return [{fn:'festivalCelebrate',args:[f.choice],title:'Open the harbour festival',cost:FINALE[f.choice]}];
 if(f.stage===4&&f.orders<1000000)return [0,1].map(index=>{const request=REQUESTS[tickets?tickets.slots[index].template:(f.orders*2+index)%REQUESTS.length];return {fn:'festivalOrder',args:[tickets?tickets.slots[index].epoch:f.orders,index],title:request.name+' · '+request.coins+' coins',cost:request.cost,reward:request.coins};});
 return [];
}
export function mutateFestival(s,f,fn,args,tickets=null){
 const action=offers(s,f,tickets).find(a=>a.fn===fn&&JSON.stringify(a.args)===JSON.stringify(args));
 if(!action||Object.entries(action.cost).some(([item,n])=>E.available(s,item)<n))return false;
 if(fn==='festivalChoose'&&f.choice===args[0])return false;
 if(action.reward&&s.coins+action.reward>1e9)return false;
 // Never spend goods held by another project's reservations, nor incoming output.
 for(const[item,n]of Object.entries(action.cost)){if(item==='coins')s.coins-=n;else s.stock[item]-=n;}
 if(fn==='festivalPrepare'){f.stage=1;f.choice='food';f.baselineRuns=s.ferry.runs;}
 if(fn==='festivalChoose')f.choice=args[0];
 if(fn==='festivalSupply'){f.stage=2;f.baselineRuns=s.ferry.runs;}
 if(fn==='festivalCelebrate')f.stage=4;
 if(fn==='festivalOrder'){f.orders++;s.coins+=action.reward;if(tickets){const epoch=tickets.next++;tickets.slots[args[1]]={epoch,template:(epoch*2+args[1])%REQUESTS.length};}}
 note(s,fn==='festivalCelebrate'?'The harbour festival is open · courtyard decorations and festival requests unlocked':action.title+' · saved');
 return true;
}
export function recordArrivals(s,f,before){
 if(f.stage!==2)return;
 for(let i=0;i<before.length;i++){
  const trip=before[i];
  if(trip?.ferry&&!s.fleet.boats[i]?.trip&&Object.hasOwn(f.visits,trip.route))f.visits[trip.route]=Math.min(2,f.visits[trip.route]+1);
 }
 if(f.visits.quarry===2&&f.visits.island===2){f.stage=3;note(s,'Festival visitors have arrived · prepare the opening celebration');}
}
export function festivalView(s,f){
 const unlocked=available(s,f), titles=['Prepare the courtyard','Supply your chosen festival','Welcome coastal visitors','Open the festival','A harbour worth visiting'];
 const bodies=[
  'Elena has a new idea for your established harbour. Prepare the courtyard, choose a food fair or craft exhibition, and welcome guests from both coastal settlements.',
  'Choose your theme before delivering. You can change it freely until supplies are paid; the first contribution commits your choice. Finished goods reserved elsewhere stay protected.',
  'Complete two passenger services from Pietra Cove and two from Olive Island after supplying the festival. Cargo runs and recalled boats do not count. You can use either boat.',
  'Your visitors are here. Prepare the final shared supplies to open the festival. The courtyard will keep its decorations and two new local requests will become available.',
  'Your '+(f.choice==='craft'?'craft exhibition':'food fair')+' has brought the coast together. The courtyard keeps its decorations. Choose between two festival requests; completing one refreshes both offers.'
 ];
 const cost=f.stage===0?PREPARATION:f.stage===1?SUPPLIES[f.choice]:f.stage===3?FINALE[f.choice]:{};
 return {unlocked,stage:f.stage,choice:f.choice,visits:f.visits,orders:f.orders,title:unlocked?titles[f.stage]:'A festival after the ferry',body:unlocked?bodies[f.stage]:'Finish Elena’s five chapters and return from your first passenger service to open this project.',requirements:Object.entries(cost).map(([item,required])=>({item,required,available:Math.max(0,E.available(s,item)),incoming:E.incoming(s,item)}))};
}
