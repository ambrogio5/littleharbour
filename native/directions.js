// Optional ambitions are projections of earned town state, never a second economy.
import * as E from '../dist/engine.js';
export function directions(s,actions){
 const ids=(fn,test=()=>true)=>actions.filter(a=>a.fn===fn&&test(a.args)).map(a=>a.id);
 const milestone=(n,step)=>Math.floor(n/step)*step+step;
 const result=[];
 const add=(id,title,goal,body,progress,total,category,choices,unlocked=true,siteID=null)=>result.push({id,title,goal,body,progress,total,category,choices,unlocked,siteID});
 const f=s.fleet, developed=f.development.quarry+f.development.island;
 if(!E.fleetEligible(s))add('coast','Coastal partnerships','Reach the working coast','Complete the first inland shipment with Elena. Then develop two settlements, unlock better voyage rewards and earn rotating commissions.',0,6,'Fleet',[],false);
 else if(!f.boats[0])add('coast','Coastal partnerships','Choose your first boat','A cutter is quicker; a coaster carries larger cargoes and rewards. Choose a role before committing your materials.',0,6,'Fleet',ids('buyBoat',a=>a[0]===0));
 else if(developed<6){
  const route=['quarry','island'].find(r=>f.development[r]<3), stage=E.COASTAL_PROJECTS[route][f.development[route]];
  const visits=f.visits[route]<stage.visits;
  add('coast','Coastal partnerships',visits?'Build trust at '+E.FLEET_ROUTES[route].name:stage.name,visits?`Complete ${stage.visits} visits to unlock the next settlement project. Repeat sailings can keep a boat working while you manage the town.`:'Invest in this settlement to improve coastal trade. Six projects across both destinations lead to rotating workshop commissions.',developed,6,visits?'Fleet':'Destinations',visits?ids('startVoyage',a=>a[1]===route&&a[2]===1):ids('fundCoastalProject',a=>a[0]===route));
 }else{
  const n=f.commissions.quarry+f.commissions.island;
  add('coast','Coastal partnerships','Complete '+milestone(n,5)+' coastal commissions','The masons and chandlery rotate their requests. Alternate destinations to fit your stocks; each fulfilled commission pays its original reward.',n,milestone(n,5),'Destinations',ids('completeCommission'));
 }
 if(!E.neighbourhoodReady(s)){
  const market=s.market.access&&!s.market.left;
  add('community','Local prosperity',market?'Supply the market':'Make room for local life',market?'Market shops recover demand over time. Keep their supply chains balanced while Elena opens the neighbourhood.':'Open the market and neighbourhood through the main chapters. Homes, local orders and civic projects form a different way to grow.',Object.values(s.market.businesses).reduce((n,b)=>n+b.deliveries,0),milestone(Object.values(s.market.businesses).reduce((n,b)=>n+b.deliveries,0),10),'Market',ids('dispatchMarket'),market);
 }else if(!E.residentsComplete(s))add('community','Local prosperity','Build a residents’ project','Choose the public garden for capacity or the commercial square for local earnings. Your first delivery commits the choice; three deliveries finish the project.',s.residents.delivered,3,'Residents',ids(s.residents.proposal?'deliverResidentsSupplies':'chooseResidentsProposal'));
 else{
  const n=s.neighbourhood.orders;
  add('community','Local prosperity','Fulfil '+milestone(n,5)+' neighbourhood orders','Furniture, cloth and local goods support rotating orders. Furnished homes expand queues; the Local life town direction increases these earnings.',n,milestone(n,5),'Neighbourhood',ids('completeNeighbourhoodOrder'));
 }
 const chain=['field','mill','bakery'], active=chain.filter(k=>(s.targets[k]||0)>0);
 if(!s.pier)add('industry','A town that keeps working','Open the quay','The quay unlocks automatic stock targets. Then connect wheat, flour and bread into a self-supplying chain.',0,3,'Production',[],false);
 else if(active.length<3){const key=chain.find(k=>!active.includes(k));add('industry','A town that keeps working','Set a stock target for '+({field:'wheat',mill:'flour',bakery:'bread'}[key]),'Set a stock target beside this workshop. Automation pays normal ingredient costs and waits for stock or queue space; it does not create free goods.',active.length,3,'Production',ids('start',a=>a[0]===key),true,key);}
 else if(Object.keys(s.refits).length<3)add('industry','A town that keeps working','Refit three workshops','Choose faster batches or longer queues for each workshop. Match capacity to your trade and local orders; changing a setup has its real stated cost.',Object.keys(s.refits).length,3,'Refits',ids('installRefit'));
 else add('industry','A town that keeps working','Reach '+milestone(s.deliveries,25)+' harbour deliveries','Keep the automated chain supplied, choose a cargo route and ship when ready. Trade and builder town directions offer different coin/material returns.',s.deliveries,milestone(s.deliveries,25),'Trade',ids('dispatch'));
 return result;
}
