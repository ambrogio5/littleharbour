// Read-only native storytelling. No clock, preference or save writes belong here.
import * as E from '../dist/engine.js';
export const TOWN_NAME='Porto Lume';
export const OPENINGS=[
 'I’m Elena. I’ll help you turn this first harvest into a working harbour.',
 'I know every family along this quay. Let’s give them a town of their own.',
 'I can picture the hillside stalls already. Let’s connect our growers to the market.',
 'I used to watch for sails from this shore. Now we can build the boats that bring them home.',
 'I’d like our neighbours to visit for more than trade. Let’s welcome the first passengers.',
 'I’ve been saving an idea for this courtyard: a festival made by the whole town.'
];
export const COMPLETIONS=[
 'I remember our first sacks of wheat. Look at the working quay we’ve built together.',
 'I can hear work along the waterfront again. This place is becoming our own.',
 'I promised the hillside growers a way to market. Today we kept that promise.',
 'I see lights on the coast and neighbours making plans. We’ve built more than a fleet.',
 'I’ve waited a long time to say this: our first passengers are home.',
 'I’ll remember this gathering whenever I cross the courtyard. We made room for everyone.'
];
export const FESTIVAL_LINES=[
 'I’ll find a place for the tables. Will you help me prepare the courtyard?',
 'I love a good meal and a clever piece of craft. Which shall we share with our visitors?',
 'I’ve sent word to both shores. Let’s bring our guests across on the passenger boats.',
 'I can hear our guests arriving. A few final supplies, and we can open the celebration.',
 'I’m glad we kept the bunting. There’s always another reason to gather here.'
];
export const WAITING_LINES=[
 'I’ll keep an eye on the work. You can explore while the crews finish.',
 'I know waiting can feel slow. Your paid work is safe while the town clock runs.',
 'I can see the next step taking shape. Let’s give the workshops a little time.'
];
export const SMALL_MOMENTS=[
 'I still remember the smell of our first batch of bread.',
 'I’d choose a trade that feels like home. Either path can grow into a fine town.',
 'I like seeing familiar boats return. Each berth can have its own job.',
 'I’ll listen while the residents decide what belongs in their square.',
 'I’m proud of this harbour. What would you like us to work on next?',
 'I’m happy to wait here. Resume the town whenever you’re ready.'
];
export function displayText(value){return typeof value==='string'?value.replaceAll('Isola dei Pescatori','Olive Island'):value;}
// Normalize only the detached presentation tree, never the canonical save or catalog.
export function presentation(value){
 if(typeof value==='string')return displayText(value);
 if(Array.isArray(value))return value.map(presentation);
 if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,presentation(v)]));
 return value;
}
export function partner(fn,args){
 if(['fundCoastalProject','completeCommission'].includes(fn))return args[0]==='quarry'
  ? 'Matteo · Pietra Cove mason: “Help me mend the landing, and we’ll keep stone moving across the bay.”'
  : 'Lucia · Olive Island chandler: “Every lamp and length of rope starts with a dependable harbour.”';
 if(['marketAccess','buildMarketBusiness','dispatchMarket'].includes(fn))return 'Sofia · market steward: “Bring what your neighbours make; I’ll find it a place on the stalls.”';
 if(['chooseResidentsProposal','deliverResidentsSupplies'].includes(fn))return 'Nico · residents’ spokesperson: “Let’s choose a place we’ll want to share, then build it together.”';
 return null;
}
export function story(s,e,f,o,g){
 const completed=s.ferry.runs>0?5:(s.ferry.stage>0||s.ferry.funded||o.chapter>=5)?4:s.inland.shipments>0?3:s.waterfront.stage===3?2:(s.pier&&!E.underConstruction(s,'pier'))?1:0;
 const titles=['A working harbour','A town of your own','From hillside to market','A living coast','Connect the harbour','The first harbour festival'];
 const art=['pier-built','waterfront-built','kiln-built','lighthouse-built','ferry-built','square-upgraded'];
 const memories=[];
 for(let i=0;i<completed;i++)memories.push({id:'chapter-'+(i+1),chapter:i+1,title:titles[i],body:COMPLETIONS[i],art:art[i],dateLabel:'Chapter '+(i+1)+' · completion date not recorded'});
 if(f.stage===4)memories.push({id:'chapter-6',chapter:6,title:titles[5],body:COMPLETIONS[5]+' '+(f.choice==='craft'?'Our craft exhibition filled the square with woven cloth and handmade pieces.':'Our food fair filled the square with bread, preserves and stories.'),art:art[5],dateLabel:'Chapter 6 · completion date not recorded'});
 if(s.residents.delivered>0)memories.push({id:'residents',chapter:null,title:E.RESIDENT_PROPOSALS[s.residents.proposal].name,body:'Nico remembers the first delivery that made our choice a promise. '+(s.residents.delivered===3?'The residents’ project is complete.':'The residents are still building it together.'),art:s.residents.proposal==='garden'?'olive-tree':'square-built',dateLabel:'Residents’ choice · date not recorded'});
 if(s.townFocus)memories.push({id:'direction',chapter:null,title:'Our direction · '+E.TOWN_FOCUSES[s.townFocus].name,body:E.TOWN_FOCUSES[s.townFocus].benefit+' This is the direction we’re pursuing now.',art:'pier-built',dateLabel:'Current town direction · date not recorded'});
 // Evolution retains the actual season of these choices, but only its latest 32 entries.
 const history=e.history.map((entry,i)=>({id:'decision-'+i,chapter:null,title:({'Fund a village festival':'Support community life','Expand the working quay':'Invest in the waterfront','Restore olive terraces':'Care for the hillside','Repair the waterfront':'Back waterfront repairs'}[entry.label]||entry.label),body:'A choice that shaped the character of '+TOWN_NAME+'.',art:/grove|olive|garden/i.test(entry.label)?'olive-tree':'square-built',dateLabel:'Season '+entry.season}));
 let voice=OPENINGS[Math.min(5,o.chapter-1)];
 if(f.stage>0||s.ferry.runs>0)voice=FESTIVAL_LINES[f.stage];
 else if(g.category==='Residents')voice=SMALL_MOMENTS[3];
 else if(g.category==='Fleet')voice=SMALL_MOMENTS[2];
 else if(o.chapter===2&&s.specialisation===null)voice=SMALL_MOMENTS[1];
 else if(o.chapter===1&&s.deliveries>0)voice=SMALL_MOMENTS[0];
 if(g.waiting){const hash=Array.from(g.body).reduce((n,c)=>n+c.charCodeAt(0),0);voice=WAITING_LINES[hash%WAITING_LINES.length];}
 if(s.speed===0)voice=SMALL_MOMENTS[5];
 if(f.stage===4&&g.category==='Ambitions')voice=SMALL_MOMENTS[4];
 return {townName:TOWN_NAME,voice,opening:OPENINGS[Math.min(5,o.chapter-1)],festivalLine:FESTIVAL_LINES[f.stage],memories:[...memories.filter(m=>m.chapter!==null).reverse(),...memories.filter(m=>m.chapter===null)],decisions:history.reverse()};
}
