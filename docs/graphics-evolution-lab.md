# Graphics & Evolution Lab — experimental branch

Base: Little Harbour v0.20.1. This experiment is **not** incorporated into the main game and never accesses its localStorage key or game save. The existing engine and all its gameplay remain unchanged.

## Try it

Serve `dist/` over HTTP (`python3 -m http.server 8000 --directory dist`) and open `/lab/graphics.html` in a browser. On iPhone/iPad, serve over HTTPS or the same LAN and use Safari. Use **Whole town / Home**, drag to pan, pinch or +/- to zoom, select areas and buildings, and compare **WebGL2** versus **Canvas 2D**. No third-party packages, CDN requests, or asset downloads.

The lab imports `WORLD_LAYOUT` from `dist/world-model.js` and therefore respects the same 1800×2700 map dimensions, five regions and ten core sites as v0.20.1. This is **procedurally sketched test art**, not final painted production assets. Site state transitions are separate experimental values: unbuilt → construction → built → expanded → unbuilt. They illustrate what stateful art will require. They do not spend currency or unlock content.

## Graphics renderer comparison

Both modes draw the same 900×1350 cached landscape texture and deterministic animated-vegetation sprite list; WebGL2 renders the landscape as a textured quad plus a batched GPU point-sprite pass (two draw calls), while Canvas 2D draws the background plus one sprite per tree. There is a clean fallback when WebGL2 cannot be created. Reported FPS and frame time are running estimates of a ~90-frame sample and are **not** validated device performance. The textures and draw strategy are benchmarking scaffolding: a production renderer should use proper layered atlases, tiled terrain, culling and device-specific quality settings.

For a meaningful decision between a JavaScript renderer and native Metal, benchmark this test on a real iPhone and iPad with Safari Remote Web Inspector, record p50/p95 frame times, memory, startup, camera gestures, texture upload spikes, thermal throttling and battery impact. The desktop browser is not a substitute.

## Evolution model

`dist/lab/evolution.js` is a pure, seeded, deterministic prototype with four bounded axes (trade, nature, community, craft), six explicit choices, an authored event generated each season and two event options. It adjusts **visual outputs** such as olive groves, trade traffic, lanterns, craft workshops and garden plots. It does not create player inventory, affect real contracts, call AI services, change the core economy or write to game saves. `test/evolution.test.js` covers determinism, corrupt-save rejection, event selection, clamping and state-driven visuals.

The appropriate next integration boundary would be *successful validated existing-game actions → evolution event observer → derived visual styling*. Changes to inventory and progression must remain owned by the existing engine. Move model state into the versioned main save only after migration and recovery tests; no experimental automatic save import has been implemented.

## Baseline local checks

- Node evolution tests: 7/7 passing.
- Headless Chromium Canvas fallback: phone viewport 390×844 about 49 FPS; tablet viewport 1024×768 about 60 FPS; no JavaScript page exceptions during tested interactions. These are local software-rendered results, **not iPhone/iPad measurements**.
- WebGL2 unavailable in the tested headless environment; WebGL GPU benchmark **pending real device testing**. Do not interpret Canvas 2D fallback as a WebGL failure on iOS.
- The HTML UI and map behavior were smoke-tested with simulated browser sizes and representative choice/season interactions, not a complete accessibility or device QA pass.

## Evolution roadmap

1. Test rendering on physical iPhone/iPad with representative 2.5D art and tune density/texture budgets.
2. Introduce deterministic *observation-only* evolution for 3–5 existing game actions and compare generated world personalities over long automated playthroughs.
3. Add event option validation and a reversible migration strategy; explicitly avoid externally driven arbitrary economy mutations.
4. Consider Core ML or on-device generative AI only after identifying a genuinely valuable behavior that deterministic rules cannot reproduce adequately.