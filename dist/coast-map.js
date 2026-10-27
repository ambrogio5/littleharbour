// Authored fictional coast. UI anchors x/y are percentages; routes use native pixels.
// Berth anchors sit beside the stone piers, not on top of their masonry.
export const COAST_SIZE={width:1536,height:1024};
export const COAST_BASE_IMAGE='assets/coast-base.png';
export const COAST_RESTORED_IMAGE='assets/coast-restored.png';
export const COAST_HOME={id:'home',name:'Porto Lume',x:88,y:78};
export const COAST_BERTHS=[
 {id:0,name:'North berth',x:73,y:73,native:{x:1121,y:748},pier:{x:1185,y:711},angle:-78},
 {id:1,name:'South berth',x:71,y:84,native:{x:1091,y:860},pier:{x:1170,y:820},angle:-78}
];
export const COAST_DESTINATIONS={
 quarry:{id:'quarry',name:'Quarry village',x:21,y:17,landing:{x:516,y:259},pin:{x:24,y:23}},
 island:{id:'island',name:'Fishing island',x:18,y:61,landing:{x:584,y:690},pin:{x:24,y:67}}
};
export const LIGHTHOUSE_PLOT={id:'lighthouse',name:'The headland lighthouse',x:79,y:15,width:13,height:20,
 construction:{x:1220,y:176},lantern:{x:1179,y:49},
 builtClip:'polygon(74.5% 1.5%,78% 1.5%,78% 8%,84% 8%,84% 18%,74.5% 18%)',
 // Cumulative clips: stage 1 repairs keeperhouse/base; stage 2 adds repaired tower;
 // stage 3 exposes lantern and roof. Apply only the clip for the completed stage.
 stagedClips:[
  'polygon(74.5% 11.8%,78% 11.8%,78% 8%,84% 8%,84% 18%,74.5% 18%)',
  'polygon(74.5% 5.5%,78% 5.5%,78% 8%,84% 8%,84% 18%,74.5% 18%)',
  'polygon(74.5% 1.5%,78% 1.5%,78% 8%,84% 8%,84% 18%,74.5% 18%)'
 ]};
// Shared corridors begin after leaving the home berth. Prepend the assigned
// berth's native point (or use byBerth below) and reverse the route for return.
export const COAST_ROUTES={
 quarry:[[990,735],[850,591],[715,455],[590,330],[516,259]],
 island:[[990,790],[850,777],[720,745],[584,690]]
};
export const COAST_BERTH_ROUTES={
 quarry:[[[1121,748],[1030,722],...COAST_ROUTES.quarry],[[1091,860],[1000,832],[935,758],...COAST_ROUTES.quarry]],
 island:[[[1121,748],[1030,755],...COAST_ROUTES.island],[[1091,860],[1000,832],...COAST_ROUTES.island]]
};
// Photographic upgrades are revealed only inside each completed project footprint.
export const COAST_PROJECT_CLIPS={
 quarry:[
  'polygon(18.5% 11%,29.5% 11%,31% 20.5%,18.5% 21%)',
  'polygon(28% 15%,34.8% 15%,34.8% 25%,28% 25%)',
  'polygon(9% 11.5%,18.5% 11.5%,18.5% 21%,9% 21%)'
 ],
 island:[
  'polygon(20.5% 61.5%,29.2% 61.5%,29.2% 69%,20.5% 69%)',
  'polygon(9.5% 63.5%,15.5% 63.5%,15.5% 70%,9.5% 70%)',
  'polygon(29.2% 62%,36.8% 62%,36.8% 68.5%,29.2% 68.5%)'
 ]
};
