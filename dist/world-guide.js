import {RECIPES,available,order,maxBatches,unlocked,openingGuide,neighbourhoodReady,fleetEligible,inlandEligible} from './engine.js';
export function townTasks(s){
 const tasks=[],o=order(s),goal='trade:'+o.id;
 if(s.ripe)tasks.push({id:'harvest',district:'harbour',title:'Wheat is ready',detail:'Harvest and replant to keep the food chain moving.',kind:'Ready',station:'field'});
 if(!o.locked&&Object.entries(o.cost).every(([k,n])=>available(s,k,goal)>=n))tasks.push({id:'trade',district:'harbour',title:'A shipment is ready',detail:o.name+' · '+o.coins+' coins on delivery.',kind:'Ready',tab:'trade'});
 const missing=!o.locked&&Object.entries(o.cost).find(([k,n])=>available(s,k,goal)<n);
 if(missing){const item=missing[0],r=Object.entries(RECIPES).find(([k,r])=>r.output[item]&&unlocked(s,k));if(r)tasks.push({id:'supplies',district:['preserving','kiln'].includes(r[1].station)?'inland':'harbour',title:'Prepare '+item,detail:s.jobs.some(j=>j.key===r[0])?'Already in production. Check your queue or work on another project.':maxBatches(s,r[0])?'Ingredients ready. Open the workshop to start a batch.':'Open the workshop to find its missing ingredients.',kind:s.jobs.some(j=>j.key===r[0])?'Working':'Supply chain',station:r[1].station});}
 if(!s.pier&&!tasks.length){const g=openingGuide(s);tasks.push({id:'opening',district:'harbour',title:g.title||'Develop your harbour',detail:g.description||'Follow the current chapter to open the quay.',kind:'Next step',next:true});}
 const district=neighbourhoodReady(s)?'neighbourhood':fleetEligible(s)?'coast':inlandEligible(s)?'inland':s.waterfront.stage===3?'market':'harbour';
 tasks.push({id:'grow',district,title:s.townFocus==='community'?'Invest in local life':s.townFocus==='builders'?'Build your next project':'Choose your next investment',detail:'View your current chapter and the supplies it needs.',kind:'Longer goal',next:true});
 return tasks.slice(0,3);
}
export function townTaskView(s){return townTasks(s).map(t=>`<article class="town-task"><span>${t.kind}</span><strong>${t.title}</strong><p>${t.detail}</p><div><button data-action="world-task" data-key="${t.id}">Open task →</button><button data-action="district" data-key="${t.district}" aria-label="Locate ${t.title}">Locate</button></div></article>`).join('');}
