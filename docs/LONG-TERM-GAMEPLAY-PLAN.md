# Little Harbour — long-term gameplay and visual expansion plan

Status: proposed design, grounded in Playtest 08. This document describes future work, not features already delivered. Duration and economy figures are targets to test, not validated playtime or production estimates.

## 1. The game we are building

Build a modest Mediterranean working harbour into a connected coastal town whose appearance records the player's decisions. Grow and process goods, organise workshops, support local businesses, operate ships, and choose which districts to develop. The eventual achievement is a distinctive, functioning town, rather than a larger inventory number.

Target a **25–35-hour first campaign**, with optional district completion and scenario play extending a town to approximately **50–70 hours**. Pursue those targets through additional decisions and places, never by stretching the current accelerated timers. First prove a good 2–3-hour slice.

The experience should support a useful five-minute visit, a satisfying 20–30-minute session, and a longer planning session. Everything remains pausable. No energy system, premium currency, paid speedups, daily attendance rewards, expiring rewards, forced ads, loot boxes or mandatory multiplayer. The base campaign must feel complete as a premium game. A future expansion would add places and mechanics, not sell relief from inconvenience.

Working assumptions: solo first; touch-first on iPhone and iPad; grounded photographic materials and lighting; authored districts with meaningful placement choices. Two-player cooperation is optional later work, not a dependency of the solo economy.

## 2. What exists and what must change

The prototype already has wheat/flour/bread, fishing, olives/oil, a boatyard, a vineyard/cellar, production queues, stock targets, three ordinary routes, specialist contracts, refits, a harbour charter and staged waterfront restoration. Porto Grande adds a fourth route after restoration. Save version 6 preserves project progress.

It currently has a static authored map, fixed building locations, short timers, immediate trade rewards, one active specialist contract, and effectively unlimited stocks. That proves the core loop but does not yet provide a long campaign.

Four changes are essential before adding dozens of products:

1. Make newly developed land visibly extend the playable town.
2. Add competing uses for goods, workshop capacity and ships.
3. Let players automate established production while managing exceptions.
4. Replace repeated identical shipments as the main progression gate with distinct development decisions and operating objectives.

Keep ordinary trade viable throughout. A player who spends their available timber or chooses an inefficient layout must always have a recovery path.

## 3. Campaign structure

Elapsed hours below are provisional cumulative targets for a new town, including the opening. Chapters introduce one major new management system at a time. Branch districts overlap; this is not a demand to complete every side objective in order.

| Phase | Target elapsed play | Main decisions | Visible expansion | Completion changes gameplay |
|---|---:|---|---|---|
| 1. First working harbour | 0–2 h | Bread economy, first fishing or olive investment, initial workshop refits | Cultivated field, working mill, new jetty or olive workshop, extended quay | Ordinary routes, stock targets and second business |
| 2. A coastal identity | 2–5 h | Boatyard or estate, two different partnerships, investing versus stockpiling | Specialist workshop, vineyard rows or boatbuilding apron, charter office | Both specialist branches can operate |
| 3. Restore the waterfront | 5–8 h | Commit goods to civic works while funding ongoing trade | Sea wall, public landing, trading arcade | Bulk route and market-square development |
| 4. The market quarter | 8–12 h | Allocate supplies between local shops, contracts and exports | Side street opens into a square; stalls, bakery frontage, shaded seating, courtyards | Standing local orders, workshop orders, first town services |
| 5. The inland terraces | 12–17 h | Choose agricultural and craft plots; build reliable multi-step chains | Uphill road, terraced orchards, gardens, irrigation channels, kiln and workshop yard | Containers, preserves and higher-value finished goods |
| 6. The outer harbour | 17–23 h | Purchase and assign ships, choose cargo mix, reserve berths, schedule routes | Breakwater extends into sea; two berths, warehouses, crane, lighthouse headland | A small coastal network and scheduled trade |
| 7. Life along the coast | 23–29 h | Develop resident services or visitor facilities first; specialise town operations | Restored old houses, courtyard gardens, small inn, passenger landing, open lighthouse | Advanced partnerships and district operating plans |
| 8. A town that holds together | 29–35 h | Resolve cross-district bottlenecks and choose a final civic ambition | Completed district identities and one signature landmark | Campaign ending, continuing town and scenario options |

The existing first three chapters will need pacing and objective revisions to reach these targets. Do not achieve eight hours by multiplying their costs or timers. Add authored choices and operating challenges; shorten the campaign target if the extra time is not enjoyable.

## 4. A town that expands on screen

### District geography

Keep the existing harbour as the recognisable centre. Extend uphill into the market and terraces; extend right along the waterfront toward the outer harbour and lighthouse; restore the old village behind the mill. The regional coast appears in a separate navigation view rather than making the phone map endless.

| District | Expansion trigger | Buildable locations | Distinct visual identity | Economic purpose |
|---|---|---|---|---|
| Original harbour | Starting area | Existing authored buildings | Stone, weathered plaster, timber, small working boats | Basic production and trade |
| Market quarter | Waterfront project + short survey task | Three business plots, a service plot and shared public space | Fabric awnings, shop fronts, delivery handcarts, shaded square | Local demand and processing choices |
| Inland terraces | Market operating objective + road works | Four agricultural terraces and two craft plots | Dry-stone retaining walls, crop-specific rows, water channels | New ingredients and packaging |
| Outer harbour | Regional supply agreement + breakwater works | Two berths, two warehouse sites and shipyard extension | Heavier stonework, cranes, ropes, distinct vessel silhouettes | Fleet capacity and external trade |
| Old village | Market services + restoration supplies | Three housing blocks, inn site and community courtyard | Occupied windows, laundry, gardens, restrained signage | Stable demand, optional specialist assignments |
| Lighthouse headland | Outer harbour access + restoration project | Lighthouse and service building | Rocky footpath, sheltered landing, lit lantern, coastal vegetation | Route navigation and final civic identity |

These are initial content budgets, not promises to create all districts in the next build.

### Every development must be legible

A new site has five authored states: undeveloped, surveyed, construction, operating, and upgraded. The construction footprint must match the completed building. Progress reveals actual foundations, walls and roofing; it must not repeatedly show a generic scaffold at unrelated coordinates.

Buildings show the activity they perform: flour sacks at the mill, bread racks at the bakery, fish crates on the jetty, stacked planks and a hull at the boatyard, grapes and barrels at the cellar. Storage and ship activity reflect coarse real stock bands and actual jobs, not decorative random timers.

Each chapter delivers at least one structural map change and one new type of activity. Cosmetic upgrades—awnings, paving, planting, boats, shop signage—are bought with ordinary resources and never required for economic success. A before/after camera view makes progress visible without a reward-screen barrage.

### Art and rendering direction

Preserve the natural Mediterranean palette and understated photographic character. Avoid chibi buildings, fluorescent crops, floating reward explosions and emoji resources. The new resource illustrations remain consistent across inventory, recipes, map interactions and deliveries.

The current flattened image cannot support convincing long-term placement and expansion. Move incrementally to a **layered isometric 2.5D map**: terrain chunks, roads, building footprints, buildings, foreground masks, props, residents, vehicles and lighting. Match camera angle, light direction, scale and material palette across assets. Use a master district layout and coordinate system before generating or commissioning final art.

Prototype one adjacent market chunk before replacing the original harbour. Use matching static building sprites first; assess pre-rendered 3D assets for repeatable angles and upgrade states later. Do not commit to a fully free-camera 3D rebuild just to expand the game.

Load only the visible district and neighbouring assets. Keep hit areas independent of visual detail. Maintain a whole-town overview, a district view and a close production view; pinch and pan must not accidentally select or purchase a building. Test memory, frame pacing and touch comfort on the actual target phones before choosing final texture sizes.

## 5. Depth through connected systems

### A. Production planning

Early play remains hands-on. Later play uses production orders: “make 12 preserves, reserve 6 for the inn, send the rest to the market.” Show the complete ingredient chain, available stock, committed stock, incoming output and likely bottleneck.

Introduce a limited set of new goods first:

| Chain | Competing use that creates a decision |
|---|---|
| Vegetables + olive oil → provisions | Oil can instead supply export contracts; provisions serve residents, ships and the inn |
| Fish + salt + jars → preserved fish | Fish can be sold fresh; jars compete with oil packaging; salt comes from a dependable coastal supplier |
| Fruit + jars → fruit preserves | Orchard plots compete with grape terraces; jars compete with preserved fish |
| Clay → jars | Kiln capacity is shared with roof tiles for village restoration |
| Clay → roof tiles | Construction competes with container production |
| Timber → planks → crates | Timber and planks are also needed by ships and civic works |
| Wine + crates → export cases | Consumes both estate production and boatyard supply capacity |

Proposed content ceiling: roughly 24–30 goods and 12–16 production/service buildings for the first full campaign. A recipe earns its place by producing a new allocation choice. Avoid chains that merely add another tap.

No single system should require the whole inventory to remain visible. Pin resources relevant to the selected project; group the rest into food, materials and finished goods. Names remain visible alongside icons.

### B. Local economy

Markets, households and the inn create standing orders. Their demand is finite and clearly forecast, giving useful recurring work without an endless automatic money fountain. Players set supply priorities and reserve quantities.

Local business investment has several viable forms: a small reliable neighbourhood shop, a higher-throughput market stall, or a specialist supplier with demanding recipes. Upgrade choices change queue capacity, product flexibility or service reach. Do not make every upgrade a universal percentage boost.

Residents do not starve, leave permanently or destroy the town if the player stops supplying them. Unmet optional demand pauses the corresponding benefit. Returning after a week must not reveal punishment.

### C. Storage and logistics

Start with unrestricted prototype storage. Introduce operational capacity gradually in new districts: warehouse bays, workshop buffer slots and cargo holds. Differentiate capacities visually; do not force manual handling of individual goods.

Existing saved stock is never deleted when capacity is introduced. Excess stock can be used or sold, while new output waits safely in a visible buffer. Core routes remain available, and the UI explains which limit is blocking work.

Reserve goods for projects before shipments consume them. Show **available / reserved / incoming** separately. Reservation does not spend goods; delivery does. A batch or shipment performs one atomic inventory transaction, including after reload or repeated input.

Early roads are authored connections. Later district plots can offer a few road/warehouse placement choices with understandable travel effects. Full road drawing and traffic simulation are outside the first campaign scope.

### D. Coastal fleet

Introduce three ship roles: a small flexible coaster, a bulk freighter, and a passenger/supply boat. Ships have cargo capacity, berth needs and route suitability. Better ships provide different uses rather than invalidating older vessels.

Transition immediate trade carefully: keep a baseline local exchange with immediate settlement for recovery. New scheduled regional routes reserve a vessel and goods until an in-session voyage completes, then settle exactly once. Players can queue a voyage or assign a standing route with minimum stock reserves and automatic stop conditions.

Voyage time runs on the simulation clock. Pausing or closing the game pauses it. Ships do not require a real-world check-in. Maintenance is a forecastable use of fittings/provisions; an overdue ship waits safely rather than being randomly lost. Never allow all transport to fail in a way that blocks obtaining repair goods.

### E. Town identity and services

Keep the initial estate/boatyard choice as an opening emphasis, not a permanent lock. Later allow combinations of three town identities:

- Working port: reliable material handling, repair work and bulk shipping.
- Agricultural coast: diverse terraces, processing and specialist food exports.
- Lived-in coastal town: local services, a small inn and passenger connections.

Use actual buildings and operating choices to define identity. Avoid adding three abstract experience bars. Services such as a workshop cooperative or market office improve specific tasks. A small optional roster of named specialists can provide alternative operating rules; recruit them through known local objectives, with no random rarity or gacha.

### F. Seasons and events

Add seasons only after the economy and fleet are enjoyable. A season advances when the player chooses to continue a chapter or operating period, not according to the real-world calendar. Preview its effects and permit deferral.

Seasonal changes affect demand and production options, not the survival of the town: harvest orders, winter boat refits, a summer passenger route, an autumn food market. Do not spoil already stored goods or invalidate accepted contracts.

Events should be small planning problems with two or three reasonable responses. Example: a regional repair programme offers timber-heavy fleet work or food-heavy crew provisioning. Either response advances the partnership through a different part of the player's economy.

## 6. Example of a later 25-minute session

The player returns to an unchanged town and sees three things: the kiln is blocking jars, the inn has six provisions reserved, and a freighter is ready for assignment.

They move roof tiles behind jars in the kiln queue, reserve bread and oil for provisions, and choose a bulk materials voyage over a more profitable wine shipment because the lighthouse needs stone. They develop an unused terrace as an orchard, giving up the immediate wine output that a grape plot would provide.

While the workshops operate, they place an awning and planting in the market, review the next restoration stage, and compare the shipyard's flexible berth upgrade with a larger warehouse. Finished goods satisfy the standing orders without individual collection taps. A voyage returns, the lighthouse foundation becomes visible, and the session ends with the next production order prepared.

The interest comes from simultaneous commitments and opportunity costs. If the player is simply waiting for a countdown, the session design has failed.

## 7. Objectives, endings and replay

Use three concurrent layers: one chapter objective, up to two chosen side projects, and the everyday operating economy. Do not flood the player with a dozen unrelated quest markers.

Objectives should mix construction, production and operating achievements. Examples: supply two market businesses while reserving a civic shipment; fulfil a mixed cargo with two workshops sharing inputs; establish a repeatable supply plan without dipping into construction reserves. Repeated deliveries alone should not be the dominant gate.

The campaign ends with a choice of civic ambition: a fully functioning lighthouse and coastal service, a regional food exchange, or a working shipyard cooperative. Each needs multiple districts and a short operating demonstration; none requires destroying the other branches. Completion gives a visual town record and a satisfying closing sequence. The town remains playable, and other ambitions can be completed later.

Longer play comes from optional district restoration, different plot layouts, fleet composition, specialist contracts and self-contained scenarios. Examples: a land-poor fishing harbour, an estate with a restricted quay, or a town rebuilding with few initial materials. Scenarios expose new constraints without erasing the main town. Avoid prestige resets and mandatory replay grinds.

## 8. Premium pacing and balance rules

- One ordinary earned coin balance. Materials and physical goods provide the other constraints.
- No required action should exist solely to wait. Several useful activities should be available during production.
- Normal recipes remain short enough for active planning; longer jobs are queueable while the player develops another district. Never sell acceleration.
- Every new trade route has a role. Bulk returns should be assessed against consumed ingredients, workshop time, cargo space and opportunity cost, not just nominal coin rewards.
- Local standing orders have bounded demand; optional export contracts vary the required mix. The baseline recovery route remains dependable and ungated.
- A new district requires a modest access project and then choices inside it. Avoid paying a huge sum merely to reveal another huge payment.
- Every required imported input has a guaranteed source. Optional demand can reward surplus but cannot trap the player in a circular dependency.
- Upgrade costs should compete with expansion, but do not grow exponentially to manufacture campaign length.
- Rebalance by simulation and hands-on play. Do not assert exact campaign duration from timer sums.

## 9. Controls as complexity grows

On phone, keep the map as the home screen and use a contextual bottom sheet for a building or project. Provide one persistent back path to the active project after visiting an ingredient source. Use explicit placement/confirmation for construction; normal production can remain one tap.

Add a searchable production ledger, pinned project requirements, multi-batch orders, minimum stock reservations, queue presets and an explainable “why stopped?” view. Display the next useful action, not a generic warning badge. Automation should state its inputs, reserved goods and stop condition before activation.

On iPad, allow map and management panels side by side. Both layouts use the same state and actions. Text scaling, reduced motion and meaningful accessibility labels are part of normal development. Do not rely on colour or resource silhouettes alone.

Cloud sync and native distribution are separate delivery workstreams. The initial requirement remains reliable local saves, export/import and versioned migrations. Cooperation, if pursued, should arrive only after inventory ownership and shared project transactions can be made reliable.

## 10. Development sequence

This is an ordered sequence of reviewable milestones, not a dated delivery promise.

| Milestone | Implement | Visible deliverable | Gate before continuing |
|---|---|---|---|
| A. Prove one expanding district | Market map chunk, three selectable business plots, two initial businesses, reservations and standing orders | Walk/pan from the original harbour into a functioning market square | Both specialist paths can reach it; no resource deadlock; district is readable on an actual phone |
| B. Make planning comfortable | Production orders, pinned requirements, return-to-project navigation, saved queue presets | Prepare a project without repeatedly hunting through tabs | New players can identify and resolve a production bottleneck without instruction |
| C. Add one connected inland chain | Two terrace choices, kiln with jars/tiles, provisions or preserved-food chain | Crops, delivery activity and kiln states change with work | At least two viable layouts; extra processing creates choices rather than repetitive taps |
| D. Prove fleet logistics | Two ship roles, two berths, two scheduled routes, safe settlement and material recovery | Ships load at actual berths and return to the correct route | No duplicate/lost cargo after pause, reload or cancellation; fleet screen works on phone |
| E. Build the campaign around proven systems | Remaining districts, service choices, authored objectives and civic finale | A coherent beginning, middle and ending | Complete new-town playthroughs support the intended duration without inflated costs |
| F. Polish and distribute | Unified assets, animation, audio, accessibility, device performance, native packaging and save transfer | A stable iPhone/iPad beta | Device playtests, migration checks and recovery tests pass; distribution requirements verified at implementation time |

Visual work runs with each milestone. Do not defer all graphics until the end, and do not produce hundreds of final assets before confirming district layout and economic use.

### Immediate next build: the market quarter

Scope the first slice to a single adjacent district, not a whole new game engine:

1. Add a survey/access step after waterfront restoration; present the entire initial cost before committing.
2. Reveal a connected market square with three authored business plots.
3. Offer a provisions kitchen and fishmonger; the third plot remains a visible future opportunity.
4. Introduce one new good, provisions, made from bread and oil. The fishmonger consumes existing fish.
5. Add two standing local orders, a project-reserve control and clear stock accounting.
6. Make supplied shops visibly active; unsupplied shops remain intact and wait.
7. Preserve current towns, inventory, contracts and waterfront progress.

Either existing specialist path can enter the district. The market can begin with a business using goods already available; establishing the other business is a visible optional next investment. No compulsory estate switch for maritime towns.

Do not introduce population, seasons, storage limits, a fleet overhaul or multiplayer in this slice. Its purpose is to prove that an expanding town and competing local demand make the existing production loop more interesting.

## 11. Architecture and save evolution

Retain the tested economy engine as the starting point. Move recipes, buildings, districts, projects and orders into explicit data definitions as content grows. Separate simulation state, visual map coordinates and interface state. A building instance has a persistent identity; a picture is never the source of truth for ownership or progress.

Introduce reservations and orders before transport. Make spending, delivery settlement and project completion atomic and idempotent. Persist accepted obligations and their terms so a balance update does not silently change a partly completed project.

Add map chunks and asset manifests independently of simulation. Keep image dimensions and camera transforms consistent, with hit targets defined in map coordinates. Profile the layered renderer before choosing a framework or native rendering engine.

Migrations must preserve current version-6 towns, especially charter ownership, ongoing restoration, refits and stored goods. New required systems default to a safe state. Capacity changes never destroy existing inventory, and unlocked content never becomes unexpectedly locked. Export backups and readable migration failures are required before larger state changes.

## 12. Validation and decision gates

Automated checks: end-to-end progression on both opening paths; mixed-path transitions; material recovery from low funds; reservations preventing accidental spending; paused and resumed jobs; shipment settlement exactly once; legacy saves and corrupt imports; bounded automation; no unavailable mandatory inputs.

Hands-on checks: first useful action on return, thumb reach, map navigation, readable resource labels, distinguishable construction/operating states, and whether the player understands the reason for a shortage. Use complete uninterrupted campaign sessions as well as short visits.

Initial acceptance targets to validate:

- A returning player can identify the next useful action in about 30 seconds.
- A 20–30-minute session contains several meaningful choices and a visible or operational improvement.
- Established chains run with a few planning inputs rather than repeated collection taps.
- Each district supports at least two useful investment sequences.
- No mandatory progression step consists only of waiting for real-world time.
- There is a documented recovery path from every intended resource constraint.
- Actual phone performance is measured; desktop browser tests are not treated as iPhone validation.

Primary risks: art consistency across map chunks; cumulative interface complexity; a single profitable route dominating every decision; too many low-value goods; endless civic delivery lists; scope expanding before the first new district is fun. Cut features that fail these gates. Preserve the campaign's sense of place and a manageable set of interdependent choices.
