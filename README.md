# Little Harbour — Playtest 02

A solo browser prototype for an original premium Mediterranean town-building game. Township is the main reference for the farming, production and delivery loop; Hay Day informs tactile production; Pocket City informs premium pacing. The selected art direction is grounded, photographic and understated.

## Start playing

Open `Little-Harbour-Playtest-02.html` from the delivery folder in a modern desktop Safari or Chrome browser. It contains all code and artwork and requires no installation or network connection. The source application in `dist/` uses JavaScript modules and is intended to be served over HTTP. Native iOS distribution is not implemented.

The opening panel explains the loop. Follow “Show next step” below the map whenever you need direction. On narrower screens, swipe the map horizontally to reach the harbour; production controls sit below it. The Back to map button returns to the settlement.

1. Harvest the ripe wheat field.
2. Queue two flour batches at the mill.
3. Queue two bread batches at the bakery.
4. Dispatch four bread to Cala Verde.
5. Build a fishing jetty or olive workshop.
6. Produce the new goods and send a second shipment.
7. Extend the quay.
8. Choose trade routes, maintain stock targets, build your second business and improve workshop queues.

## New in this version

- First-run onboarding and context-sensitive guidance to missing ingredients.
- Both businesses can eventually operate in the same town.
- Three post-upgrade trade routes with different material and coin rewards.
- A storehouse upgrade increases workshop queues from two to four slots.
- Cancel waiting batches with full ingredient refunds; move waiting work next.
- Stock targets unlock after the quay extension; target controls maintain 6 or 12 items while materials are available. Farmhand targets harvest and replant wheat.
- Export and import JSON saves from settings, with confirmation before replacing a town.
- Validation and migration of version 1 saves. In-progress jobs are retained.
- Pauses when the tab is hidden, closed, or a dialog is open. There is no offline catch-up and no penalty for leaving.
- Updated route, business and construction indicators on the map.
- All delivery rewards now include building materials, including stone, so later expansion cannot exhaust an irreplaceable resource.

## What to assess

- Is the next useful action obvious without opening Help?
- Does parallel production create planning, or just waiting?
- Does the first expansion feel like a meaningful choice?
- Are fishing and olive oil both enjoyable despite different chain lengths?
- Does automation reduce repetition once the town grows?
- Can you comfortably read and tap controls on your preferred screen?

The timers are accelerated prototype values. Final pacing and resource balance still require hands-on playtesting.

## Saving

Progress is stored in the current browser when local storage is available. File-based storage behavior can vary by browser and by filename. Export the town save before changing devices, moving to a new prototype file, or clearing browser data. Import accepts Little Harbour JSON save files under 100 KB. The original playtest file is unchanged.

## Verification

17 automated tests cover both opening paths, extended progression, queue ordering and refunds, parallel production, time controls, automation stock bounds, save migration and rejection of malformed imports. A deterministic 3,000-action simulation checks resource invariants and repeated save round trips. A regression test verifies standalone packaging preserves JavaScript syntax and embedded assets. The inline application also passes HTML structure checks.

Browser rendering, touch behavior and actual Safari/Chrome playthroughs have NOT been verified in this environment: local server binding was blocked, the publishing repository was unreachable, and the browser policy disallowed local-file navigation. Do not treat successful model tests as browser validation.

## Limits

This is a functional economy prototype with a generated static map image, clickable locations and construction overlays. It is not a free-camera 3D town builder. Buildings occupy authored locations; free placement, road routing, animated citizens, multiplayer, cloud saves and native iPhone/iPad packaging remain future work. No freemium purchases or payments are implemented. One ordinary earned coin balance funds construction.

## Development

Requires Node.js 20+ for tests and packaging. No application dependencies are required.

- `npm test` — run simulation tests.
- `npm run standalone` — generate the self-contained HTML next to the project folder.
- Serve `dist/` with a static server where allowed to develop the module version.

`dist/engine.js` owns state and simulation. `dist/app.js` owns interface rendering, events and saving. `dist/style.css` and `dist/index.html` own presentation. `scripts/build-standalone.mjs` packages the same source into the offline deliverable.
