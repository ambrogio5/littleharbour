import {fresh,parseSave} from './engine.js';

// An explicitly separate sample town for exploring later chapters.
// The application stores this under its own key, never the player's town key.
export function sampleTown(){
 const s=fresh();
 Object.assign(s,{
  coins:1000,deliveries:24,harvests:20,milled:30,baked:30,onboarded:true,
  expansion:'fishing',businesses:['fishing','olive'],pier:true,workshopUpgrade:true,
  specialisation:'maritime',specialists:['boatyard','estate'],charter:true,
  contractsDone:['fleet','refit'],contractDeliveries:6,
  waterfront:{path:'maritime',stage:3,funded:false,delivered:0,left:0},
  market:{access:true,left:0,plots:['fishmonger','kitchen',null],businesses:{
   fishmonger:{plot:0,left:0,demand:3,replenish:0,auto:false,deliveries:3},
   kitchen:{plot:1,left:0,demand:3,replenish:0,auto:false,deliveries:3}
  }},
  inland:{access:true,left:0,terraces:[{type:'orchard',left:0},{type:'garden',left:0}],kiln:{left:0},courtyard:false,courtyardLeft:0,shipments:0},
  log:['Sample town · explore freely. Your main town is kept separately.']
 });
 Object.assign(s.stock,{wheat:24,flour:12,bread:12,olives:12,oil:12,fish:16,wood:50,stone:50,planks:12,boatparts:6,grapes:12,wine:6,provisions:12,clay:60,fruit:24,vegetables:24,jars:12,tiles:12,preserves:16});
 return parseSave(JSON.stringify(s));
}
