# Little Harbour — Playtest 10

A solo browser prototype for an original premium Mediterranean town-building game. Township is the main reference for the farming, production and delivery loop; Hay Day informs tactile production; Pocket City informs premium pacing. The selected art direction is grounded, photographic and understated.

## Start playing

Play the [hosted game](https://little-harbour-prototype.ambrogiocremona.chatgpt.site). Source and development history are mirrored to [ambrogio5/littleharbour](https://github.com/ambrogio5/littleharbour).

Run `npm run standalone`, then open the generated `Little-Harbour-Playtest-10.html` next to the project folder in a modern desktop Safari or Chrome browser. It contains all code and artwork and requires no installation or network connection. The source application in `dist/` uses JavaScript modules and is intended to be served over HTTP. Native iOS distribution is not implemented.

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
12. Restore the waterfront in three stages, then open the Porto Grande bulk route.
13. Continue developing both specialist plots in open play.

## New in Playtest 10

This release completes the planning milestone and the following inland-chain milestone together.

- **Production ledger:** search resources/workshops, compare stored/reserved/incoming goods, follow missing-input shortcuts and see why a queue or stock target has stopped. Workshop panels now show only their own queues.
- **Three saved production plans:** save current stock targets and apply them later. Applying replaces targets in currently unlocked workshops, preserves paid batches and does not change local shop supply. Plans are browser-local preferences; town exports contain active targets, not preset slots.
- **Inland terraces:** supply either market shop three times to unlock the path. Choose fruit orchard or kitchen garden independently on two fixed terraces. Their resource costs, harvest sizes and processing speeds differ. Crop choices are permanent for this prototype.
- **Pottery and preserving:** gather clay, fire jars or tiles using timber, package either harvest as preserves, and export to Valle Serena for coins and building materials. Jars and tiles compete for the same kiln queue.
- **Market courtyard:** after the first preserves shipment, invest twelve tiles plus funds and stone in paving. Completed paving raises local-order earnings by 25% (75 coins for fish, 113 for provisions).
- **Visual expansion:** a third photographic map district, independent kiln and preserving-room overlays, crop overlays tied to production, construction markers, workers and kiln smoke. Crop overlays are still illustrative prototype assets.
- **Sample town:** [explore the hillside immediately](https://little-harbour-prototype.ambrogiocremona.chatgpt.site/demo.html). It has an explicitly separate browser save and does not touch the main town.
- Saves migrate to version 8. Both specialist paths have earned-resource progression tests through inland trade and courtyard completion. Timers remain accelerated; this does not claim a balanced full-length campaign or physical-device validation.

## New in Playtest 09

- A separate content catalogue and district metadata support further expansion. Version 7 saves migrate existing towns without losing inventory or paid projects.
- Chapter 04 opens after waterfront restoration. Fund the road to the market quarter, then build a fishmonger and harbour kitchen on their authored plots. The kitchen turns bread and oil into provisions. Local demand replenishes in simulation time; optional automatic supply competes with exports for goods.
- The market has matching photographic empty and built states, construction crews, delivery activity and kitchen smoke. Swipe between districts or use the district buttons. The courtyard is reserved for a future release.
- Pin an order's requirements, reserve available goods against it, follow ingredient shortcuts and return to the original order. Reservations protect goods from unrelated recipes and shipments and can be released at any time.
- This is one additional playable chapter, not the full planned campaign. Physical iPhone/iPad testing and long-session balance testing remain outstanding.

## Resource readability update

Resource counters and production recipes now use distinct illustrated SVG icons: wheat, flour sack, bread, olives, oil bottle, fish, logs, stone, planks, boat fittings, grapes and wine. Names remain visible at every screen width. The phone resource strip uses three labelled columns, and the same icons appear in workshop cards, delivery requirements and storage. Saved towns and the economy are unchanged.

## New in Playtest 08

- Chapter 03 opens after the harbour charter is built. Restore the sea wall, public landing and trading arcade in order. Each stage needs a one-time funding payment and two supply deliveries; the crew then takes 12 simulation seconds to finish.
- The first funding payment fixes the project's supply plan to your chosen boatyard or estate. Switching town direction later preserves paid progress and supply requirements. Ordinary trade and contracts remain available throughout.
- Total funding is 900 coins, 52 timber and 48 stone. Supply goods are additional and shown before investing. The boatyard's landing supplies intentionally require both planks and fittings, so consuming one to make the other needs planning.
- Each finished stage reveals its own part of the matching photographic waterfront. Construction crews mark the active site; progress, remaining time and missing-goods shortcuts are available from the map, chapter guide and Build.
- Completing the arcade unlocks Porto Grande. Bulk shipments return 384 coins (including charter bonus), 22 timber and 12 stone. There is no free recurring reward or new currency.
- Saves migrate from versions 1–5 to version 6. Current inventory, queues and refits are retained. Project funding, deliveries and construction resume without repeat charges; invalid project phases and premature route access are rejected.
- This adds a bounded post-charter project. A balanced full-length campaign and physical-device testing remain future work.

## New in Playtest 07

- The mill, bakery and fishing jetty can each be refitted after the first business is built. Choose **25% shorter batch times** or **two extra queue slots** per workshop. The extra slots combine with the storehouse upgrade.
- Refits cost ordinary coins, timber and stone. Ingredient costs and output quantities remain unchanged, so the decision competes with expansion funds without introducing a second currency.
- Workshops must be idle before a refit. Replacing a setup is explicitly confirmed, costs the new setup price, and does not refund the previous setup. Active jobs and waiting ingredients cannot be lost to a capacity reduction.
- Build contains the comparison cards; individual production panels link straight to their workshop's choices.
- Version 1–4 towns migrate to version 5 with existing inventories, jobs, businesses and contracts retained and no refits installed.
- Map pins retain descriptive accessibility labels in compact whole-harbour mode.

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

54 automated tests cover both opening paths, extended progression, queue ordering and refunds, parallel production, time controls, automation stock bounds, save migration and rejection of malformed imports. A deterministic 3,000-action simulation checks resource invariants and repeated save round trips. End-to-end tests reach the charter and complete every restoration stage on each specialist path using actual production and earned resources. They also verify bulk-route rewards, partial deliveries, stale actions, save migration and pause/speed behavior. The guide is exercised through both first-business paths using only suggested actions, actual production and earned funds. Template tests cover opening, construction, contract and completed-charter panels; they do not validate browser layout. A regression test verifies standalone packaging preserves JavaScript syntax and embedded assets. The inline application also passes HTML structure checks.

The live Playtests 06 and 07 opened successfully with an existing Chapter 02 town in the in-app browser. Desktop and 390 × 844 layouts, whole-harbour and label toggles, phone production navigation, and the mill refit comparison dialog were visually checked. No refit purchase was made in the existing town during browser QA. Phone screenshots are in `docs/playtest-07-harbour.png` and `docs/playtest-07-upgrades.png`. Physical iPhone Safari performance and touch comfort remain unverified. Automated tests are not a substitute for device playtesting.

Playtest 08 was checked live at desktop width and 390 × 844. The existing charter town migrated successfully, the chapter guide opened the restoration plan, and all stage costs and delivery requirements were visible. No project funds or goods were spent in the existing town during browser QA. Screenshots: `docs/playtest-08-restoration.png` and `docs/playtest-08-funding.png`. Completed-stage economy and save behavior were verified in simulation; completed map reveals still need hands-on device playtesting.

## Limits

This is a functional economy prototype with a generated static map image, clickable locations and construction overlays. It is not a free-camera 3D town builder. Buildings occupy authored locations; free placement, road routing, autonomous citizen simulation, multiplayer, cloud saves and native iPhone/iPad packaging remain future work. No freemium purchases or payments are implemented. One ordinary earned coin balance funds construction.

## Future gameplay direction

See [the long-term gameplay and visual expansion plan](docs/LONG-TERM-GAMEPLAY-PLAN.md) for the proposed campaign, district growth, production and fleet systems, premium pacing, and implementation milestones. This is a design roadmap; its future features and playtime targets are not implemented or validated yet.

## Development

Requires Node.js 20+ for tests and packaging. No application dependencies are required.

- `npm test` — run simulation tests.
- `npm run standalone` — generate the self-contained HTML next to the project folder.
- Serve `dist/` with a static server where allowed to develop the module version.

`dist/engine.js` owns state and simulation. `dist/app.js` owns interface rendering, events and saving. `dist/style.css` and `dist/index.html` own presentation. `scripts/build-standalone.mjs` packages the same source into the offline deliverable.
