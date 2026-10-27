// Authored district geometry. All local image coordinates are percentages,
// except road points and world origins, which are native-image pixels.
export const DISTRICT_SIZE = Object.freeze({ width:1536, height:1024 });
export const MARKET_PLOTS = [
  {
    id:0, district:'market', business:'fishmonger', name:'Fishmonger site',
    x:24.5, y:40.5, width:34, height:21,
    anchor:{x:25,y:40.5}, construction:{x:380,y:407},
    polygon:[[5,41],[20,31],[42,37],[29,49]],
    hitPolygon:'polygon(5% 41%,20% 31%,42% 37%,29% 49%)',
    // Includes the new stall, stock, cast shadow, and its immediate paving.
    builtClip:'polygon(12% 27%,35% 27%,36% 42%,32% 45%,14% 44%,11% 40%)',
    builtImage:'assets/market-built.png', selectable:true,
    roadPoint:{x:590,y:473}
  },
  {
    id:1, district:'market', business:'kitchen', name:'Provisions kitchen site',
    x:76.5, y:44, width:33, height:22,
    anchor:{x:77,y:44}, construction:{x:1180,y:437},
    polygon:[[60,45],[74,33],[93,38],[86,54]],
    hitPolygon:'polygon(60% 45%,74% 33%,93% 38%,86% 54%)',
    // Roof and chimney extend above the footprint into the image background.
    builtClip:'polygon(65% 20%,85% 20%,85% 25%,91% 29%,92% 43%,88% 47%,68% 46%,65% 40%)',
    builtImage:'assets/market-built.png', selectable:true,
    roadPoint:{x:974,y:500}
  },
  {
    id:2, district:'market', business:null, name:'Quiet courtyard',
    x:76.5, y:71, width:38, height:30,
    anchor:{x:76.5,y:71}, construction:null,
    polygon:[[57,63],[74,56],[97,66],[91,86],[67,80]],
    hitPolygon:'polygon(57% 63%,74% 56%,97% 66%,91% 86%,67% 80%)',
    builtClip:null, builtImage:null, selectable:false, future:true,
    roadPoint:{x:1023,y:881}
  }
];

export const DISTRICTS = {
  harbour:{
    id:'harbour',name:'The harbour',width:1536,height:1024,
    size:DISTRICT_SIZE,worldX:0,worldY:0,origin:{x:0,y:0},
    baseImage:'assets/harbour-map.png',plots:[],
    connection:{to:'market',x:1480,y:350,label:'Market road'}
  },
  market:{
    id:'market',name:'Market square',width:1536,height:1024,
    size:DISTRICT_SIZE,worldX:1536,worldY:0,origin:{x:1536,y:0},
    baseImage:'assets/market-base.png',builtImage:'assets/market-built.png',
    plots:MARKET_PLOTS,
    connection:{to:'harbour',x:65,y:454,label:'Harbour road'},
    // This is an authored connection between chunks, not a seamless image edge.
    roads:{
      arrival:[[0,454],[190,500],[336,546],[458,487],[674,416],[786,413]],
      fishmonger:[[786,413],[660,440],[552,477],[391,475]],
      kitchen:[[786,413],[924,463],[1060,517],[1200,520]],
      courtyard:[[336,546],[444,681],[696,810],[1023,881],[1220,1000]]
    }
  }
};

export const DISTRICT_ORDER = ['harbour','market'];
export const MARKET_BASE_IMAGE = 'assets/market-base.png';
export const MARKET_BUILT_IMAGE = 'assets/market-built.png';
