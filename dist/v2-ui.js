import {currentObjective} from './progression.js?v=0.20.1';
import {order,canAfford,neighbourhoodEligible,neighbourhoodReady,residentsComplete,ferryEligible,fleetEligible,inlandEligible,openingGuide,neighbourhoodGuide,chapterTwo,chapterThree,marketGuide,inlandGuide,fleetGuide} from './engine.js?v=0.20.1';

export const V2_SECTIONS=Object.freeze([
 {id:'map',label:'Map',icon:'⌖'},
 {id:'produce',label:'Production',icon:'⚒'},
 {id:'trade',label:'Trade',icon:'⚓'},
 {id:'build',label:'Build',icon:'▤'},
 {id:'contracts',label:'Contracts',icon:'▧'},
 {id:'fleet',label:'Fleet',icon:'⛵'}
]);

// All task labels and availability are derived from the actual game state;
// the cards are navigation, never simulated progress or free-resource actions.
export function v2Tasks(s){
 const tasks=[],route=order(s),ready=!route.locked&&canAfford(s,route.cost,'trade:'+route.id);
 if(ready)tasks.push({id:'shipment',kind:'READY TO SHIP',title:'A shipment is ready',detail:route.name+' · '+route.coins+' coins on delivery',icon:'⚓',tab:'trade',district:'harbour'});
 if(neighbourhoodReady(s)&&!residentsComplete(s))tasks.push({id:'residents',kind:'COMMUNITY',title:'Residents’ plot',detail:s.residents.proposal?'Delivery '+(s.residents.delivered+1)+' of 3 · '+(s.residents.proposal==='garden'?'Public garden':'Commercial square'):'Compare the two proposals',icon:'⌂',tab:'residents',district:'neighbourhood'});
 if(ferryEligible(s)&&s.ferry.stage<3)tasks.push({id:'ferry',kind:'COASTAL CONNECTION',title:'Build the ferry terminal',detail:s.ferry.stage+' of 3 stages complete',icon:'⛵',tab:'ferry',district:'coast'});
 if(neighbourhoodEligible(s)&&!neighbourhoodReady(s))tasks.push({id:'neighbourhood',kind:'NEW DISTRICT',title:'Open the neighbourhood',detail:'Six building plots and new workshops',icon:'⌂',tab:'neighbourhood',district:'neighbourhood'});
 if(s.ripe)tasks.push({id:'harvest',kind:'READY TO HARVEST',title:'Wheat field',detail:'Collect six wheat and plant the next crop',icon:'♧',tab:'produce',district:'harbour'});
 if(s.jobs.length)tasks.push({id:'production',kind:'IN PROGRESS',title:'Workshop queues',detail:s.jobs.length+' active or queued batches',icon:'⚒',tab:'produce',district:'harbour'});
 if(!tasks.length||tasks.length<4)tasks.push({id:'next',kind:'DEVELOPMENT',title:'Continue your chapter',detail:'See the next requirement and a direct route to it',icon:'✦',tab:'map',district:'harbour'});
 return tasks.slice(0,4);
}
export function v2TaskCards(s){
 return v2Tasks(s).map(t=>'<button class="v2-task-card" type="button" data-action="v2-task" data-key="'+t.id+'" aria-label="'+t.title+'. '+t.detail+'">'
  +'<span class="v2-task-icon" aria-hidden="true">'+t.icon+'</span>'
  +'<span class="v2-task-copy"><small>'+t.kind+'</small><strong>'+t.title+'</strong><em>'+t.detail+'</em></span>'
  +'<span class="v2-task-arrow" aria-hidden="true">↗</span></button>').join('');
}
export function v2TopStock(s){
 const keys=[['wood','Timber','▰'],['stone','Stone','◆'],['bread','Bread','◒']];
 return keys.map(([key,label,icon])=>'<span class="v2-stock" title="'+label+'"><i aria-hidden="true">'+icon+'</i><span><small>'+label+'</small><strong>'+s.stock[key]+'</strong></span></span>').join('');
}
const HERO={
 map:['YOUR SETTLEMENT','Porto Lume','One interconnected coastal town. Explore the map, choose a project, or follow the next practical step.','harbour'],
 produce:['WORKSHOPS & FIELDS','Keep the town moving','Harvest, process and queue your production in the selected workshop.','inland'],
 trade:['COASTAL TRADE','Trade with the coast','Prepare cargo, make deliveries and earn construction materials.','harbour'],
 build:['TOWN DEVELOPMENT','Shape your harbour','Choose what to build next and invest in lasting improvements.','market'],
 contracts:['LASTING PARTNERSHIPS','Make connections','Fulfil multi-shipment commitments and build your charter.','coast'],
 fleet:['THE WORKING COAST','Your coastal fleet','Manage voyages, upgrades and destinations.','coast'],
 neighbourhood:['A LIVING TOWN','Your neighbourhood','Six plots, new crafts, homes and the civic square.','neighbourhood'],
 residents:['THE RESIDENTS’ PLOT','A place for everyone','Choose a public garden or commercial square. The first supply delivery makes your choice final.','neighbourhood'],
 ferry:['CHAPTER 05','The ferry terminal','Build passenger infrastructure in three stages and connect the coast.','coast'],
 direction:['TOWN DIRECTION','Your long-term vision','Choose the economic direction of Porto Lume.','market'],
 waterfront:['RESTORE THE WATERFRONT','The town by the sea','Fund the next restoration phase and deliver the needed materials.','harbour'],
 inland:['INLAND TERRACES','The productive hillside','Grow harvests and craft goods for the harbour.','inland'],
 market:['MARKET QUARTER','A place for local trade','Develop shops, deliver orders and serve residents.','market'],
 planning:['SUPPLY PLANNING','Plan the next delivery','Track what is stored, queued or missing from your current project.','inland']
};
export function v2ContextHero(s,tab){
 const [eyebrow,title,description,visual]=HERO[tab]||HERO.map;
 let stage='';
 if(tab==='ferry')stage=s.ferry.stage+' / 3 STAGES';
 if(tab==='residents')stage=s.residents.delivered+' / 3 DELIVERIES';
 if(tab==='neighbourhood')stage=s.neighbourhood.plots.filter(Boolean).length+' / 6 PLOTS OWNED';
 if(tab==='waterfront')stage=s.waterfront.stage+' / 3 STAGES';
 return '<div class="v2-context-image v2-art-'+visual+'" role="img" aria-label="'+visual+' scenery"></div>'
  +'<div class="v2-context-copy"><div class="v2-context-meta"><small>'+eyebrow+'</small>'+ (stage?'<span>'+stage+'</span>':'')+'</div>'
  +'<h2>'+title+'</h2><p>'+description+'</p></div>';
}
export function v2OverviewPanel(s){
 const objective=currentObjective(s),name=objective.title,detail=objective.description,action=objective.label||'Show next step';
 return '<div class="v2-overview-panel"><div class="panel-eyebrow">YOUR NEXT MOVE</div><h2>'+name+'</h2><p class="description">'+detail+'</p>'
  +'<button class="button" data-action="v2-next">'+action+' →</button>'
  +'<div class="v2-overview-links"><button data-tab="produce"><span>⚒</span><strong>Production</strong><small>'+s.jobs.length+' queued jobs</small></button>'
  +'<button data-tab="trade"><span>⚓</span><strong>Trade</strong><small>'+s.deliveries+' deliveries made</small></button>'
  +'<button data-tab="build"><span>▤</span><strong>Build</strong><small>Town improvements</small></button>'
  +'<button data-tab="fleet"><span>⛵</span><strong>Fleet</strong><small>Boats and routes</small></button></div>'
  +'<p class="hint">Tap a building or destination on the map to open its controls. Your game progress is saved locally on this device.</p></div>';
}
