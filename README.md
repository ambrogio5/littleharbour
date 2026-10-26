# Little Harbour — Playtest 06

A solo browser prototype for an original premium Mediterranean town-building game. Township is the main reference for the farming, production and delivery loop; Hay Day informs tactile production; Pocket City informs premium pacing. The selected art direction is grounded, photographic and understated.

## Start playing

Open `Little-Harbour-Playtest-06.html` from the delivery folder in a modern desktop Safari or Chrome browser. It contains all code and artwork and requires no installation or network connection. The source application in `dist/` uses JavaScript modules and is intended to be served over HTTP. Native iOS distribution is not implemented.

The opening panel explains the loop. Follow “Show next step” below the map whenever you need direction. On narrower screens, swipe the map horizontally to reach the harbour; production controls sit below it. The Back to map button returns to the settlement.

1. Harvest the ripe wheat field.
2. Queue two flour batches at the mill.
3. Queue two bread batches at the bakery.
4. Dispatch four bread to Cala Verde.
5. Build a fishing jetty or olive workshop.
6. Produce the new goods and send a second shipment.
7. Extend the quay.
8. Choose trade routes and maintain stock targets to fund further growth.
9. In Build, select your town direction and invest in its specialist workshop.
10. In Contracts, accept and complete a three-shipment commitment.
11. Complete a different contract and establish the harbour charter.
12. Continue in open play, with both specialist plots permitted and improved trade rewards.

## New in Playtest 06

- Matching photographic cutouts replace the simple olive workshop, fishing jetty and extended-quay overlays. Cargo supplies appear after the first trade. Sprite construction and completed states use the same authored sites.
- The wheat field clears to cultivated earth after harvest, then gradually returns to wheat according to the actual crop timer. Pausing stops its progress.
- Subtle water highlights, a better-aligned mill wheel, bakery chimney smoke, and updated fishing routes give the opening district more consistent feedback. Reduced-motion settings suppress water movement and simplify other animation.
- Whole harbour fits the full district on screen. Explore close up restores horizontal panning. Labels can be hidden independently, and view controls remain outside the fitted map's touch targets.
- The guide immediately beneath the map now performs the next useful action: harvesting, queueing required batches, dispatching, or opening the investment choice. It accounts for incoming production and never awards resources or starts work without a tap.
- Shipment requirements remain visible under the guide. Passive, dismissible journal notices mark the first trade, finished businesses and completed quay; loading an existing town does not replay its old notices.
- Production cards show photographic location thumbnails. The compact phone overview groups workshops into two columns.
- The same version 4 save format and accelerated production timers are retained. This is an opening-experience polish pass; it is not a claim of a calibrated 20-minute tutorial or a complete 2–3-hour campaign.

## New in Playtest 05

- Production opens to an overview of every active workshop, with stock, incoming goods, queue occupancy and remaining time. Start work directly or open the workshop for detailed controls.
- Harvest & replant collects six wheat and starts the next crop in one tap. Existing crop behavior and farmhand targets remain compatible.
- Fill queue starts as many batches as current ingredients and free slots permit. Ingredients are spent immediately; waiting batches can still be cancelled for a refund.
- At a glance actions beneath the map offer harvesting, the selected trade route, and the active contract. Dispatch remains an explicit tap and pays only once per shipment.
- Resource counters and each missing shipment ingredient link to its production source. Incoming output is visible beside the requirement. Unavailable specialist sources lead to Build.
- Phone navigation stays at the bottom, with safe-area spacing, and speed controls are also available in the management panel. Touch targets are at least 44px for the main controls.
- Existing version 4 saves load unchanged; no new save format or currency is introduced.

## New in Playtest 04

After extending the quay, Chapter 02 introduces a town direction and contracts:

- **Working waterfront:** build a boatyard. Two timber become four planks; four planks become two boat fittings. Contracts demand fittings alongside fish and, in one case, bread.
- **Coastal estate:** build a vineyard and cellar. Harvest four grapes, then produce two wine. Contracts demand wine alongside oil and, in one case, bread.
- One specialist plot operates before the charter. Choose a direction, fund its investment with ordinary trade, and finish its building before production opens. The matching base business (fishing or olive oil) is required.
- Each path offers two distinct contracts. A contract commits to three shipments, pays per shipment, and pays a completion bonus. There are no deadlines. Previously delivered goods are not refunded if a contract is released.
- Two different completed contracts earn eligibility for the **harbour charter**. It costs 400 coins, 20 timber and 12 stone. The charter permits both owned specialist plots to produce in parallel and increases ordinary trade coin rewards by 20%.
- Existing investments and goods are retained when directions change. Active contracts must be finished or released first. Before the charter, in-progress specialist jobs must finish before switching.
- Contracts keep progress across save/reload. Replaying a completed contract earns coins but cannot duplicate a partnership.
- Versions 1–3 saves migrate to version 4, with the original town, stock, queues and construction retained. New goods begin at zero.

This is a bounded test of specialisation, multi-shipment commitments and a longer-term project. Seasonal economies, freely placed districts and a full-length campaign remain future work.

## Activity added in Playtest 03

- Businesses take eight simulation seconds to construct. Foundations, scaffolding and finishing stages appear on their sites before the finished structure is revealed.
- New businesses cannot begin production until construction is complete. Completed businesses in version 1 and 2 saves are preserved as completed.
- A canvas activity layer draws small residents, workers carrying goods along authored routes, mill-wheel movement and bakery smoke while production runs.
- Fishing boats follow the active fishing trip. Cargo boats depart after successful shipments, with a wake and visible cargo. Trading rewards still arrive on dispatch; travel is visual feedback, not a second economic timer.
- Activity uses the same simulation speed and pause state as the game; hidden tabs and open dialogs stop it. Reduced-motion preferences simplify movement.
- Construction state is saved and restored. In-progress construction cannot charge twice or start production early.

## Features from Playtest 02

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

43 automated tests cover both opening paths, extended progression, queue ordering and refunds, parallel production, time controls, automation stock bounds, save migration and rejection of malformed imports. A deterministic 3,000-action simulation checks resource invariants and repeated save round trips. End-to-end tests reach the charter on each specialist path using actual production and earned resources. The guide is exercised through both first-business paths using only suggested actions, actual production and earned funds. Template tests cover opening, construction, contract and completed-charter panels; they do not validate browser layout. A regression test verifies standalone packaging preserves JavaScript syntax and embedded assets. The inline application also passes HTML structure checks.

Browser rendering, touch behavior and actual Safari/Chrome playthroughs have NOT been verified in this environment: local server binding was blocked, and the private hosted game required an interactive sign-in in the preview browser. Do not treat successful model tests as browser validation.

## Limits

This is a functional economy prototype with a generated static map image, clickable locations and construction overlays. It is not a free-camera 3D town builder. Buildings occupy authored locations; free placement, road routing, autonomous citizen simulation, multiplayer, cloud saves and native iPhone/iPad packaging remain future work. No freemium purchases or payments are implemented. One ordinary earned coin balance funds construction.

## Development

Requires Node.js 20+ for tests and packaging. No application dependencies are required.

- `npm test` — run simulation tests.
- `npm run standalone` — generate the self-contained HTML next to the project folder.
- Serve `dist/` with a static server where allowed to develop the module version.

`dist/engine.js` owns state and simulation. `dist/app.js` owns interface rendering, events and saving. `dist/style.css` and `dist/index.html` own presentation. `scripts/build-standalone.mjs` packages the same source into the offline deliverable.
