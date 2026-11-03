# Whole-game review — build 10, November 2026

Historical review: the owner's November 3 long-play prompt changes the delivery order. See the [current programme/status ledger](LONG-PLAY-PROGRAMME.md) and [increment 1 numeric proposal](LONG-PLAY-ECONOMY.md). Story and bottom-space fixes have since shipped in QA; the ledger distinguishes those from unfinished proposals. The current catalog has 24 recipes; the 26-recipe count below was an error.

A critique of Little Harbour as it plays today, with improvement proposals for gameplay, story, interface and graphics. It was written from the source, the design documents, the earned campaign traces and simulator screenshots of the native client on iPhone 16 Pro, iPhone 17 Pro Max and iPad Pro. It is not a human playtest: no session lengths, enjoyment or device comfort were measured, and nothing here claims they were. Numbers come from `dist/catalog.js`, `dist/engine.js` and `native/bridge.js`.

## What the game is now

Five structural chapters take a town from a wheat field to a passenger ferry: harbour and quay; specialisation, contracts and charter; waterfront, market and inland terraces; fleet, lighthouse, neighbourhood and residents; ferry. The native client adds a sixth chapter, the harbour festival, and three open-ended ambitions. The economy has 23 goods, 26 recipes, two coastal destinations with three cargo tiers each, circuits, passenger services, rotating commissions and local orders, and about 240 possible actions in a developed town. Every mutation runs through the original browser engine, so the native game is the same game with native presentation.

Strengths worth protecting: each site is a distinct painted building with unbuilt, construction and built states; the production chains interlock in real ways (bread and preserves feed trade, passengers and the festival; timber is contested by construction, furniture and sails; cloth by homes and sails); Elena's card always names one real next action; saves are exact-byte protected; automation uses real costs; nothing is monetised or time-gated.

## Gameplay

**Where the design is strong.** The mid game (chapters 3 and 4) has genuine competing demands and two boats to allocate. The festival reuses those demands instead of adding a currency. Automation targets and repeat voyages remove drudgery without removing decisions.

**Findings.**

1. *Income scales faster than sinks late on, and one destination dominates.* Authored one-time coin costs across the whole main path and both coastal tracks total about 11,800 coins. A single Isola dei Pescatori tier-3 expedition pays 1,020 coins in 84 seconds on a cutter, and 3,060 on a coaster with the hold upgrade; its commissions pay 620–820 coins against 140–180 for Pietra Cove. Once that route is open, coins stop mattering and the only scarce inputs are timber and stone, which Pietra Cove returns. The earned craft trace ends the festival with 2,612 coins and nothing to buy. The roadmap's own warning against compounding multipliers (charter ×1.2, trading port ×1.35, courtyard +25 %, community +50 %) is correct.
2. *The opening is linear and slow to open up.* Chapter 1 is a fixed sequence (harvest, flour, bread, ship, business, quay). The first real choice, fishing or olives, arrives after the first delivery and the next, specialisation, after the quay. That is fine for a tutorial but there is no small expressive choice in the first ten minutes.
3. *Waiting is the main late-game verb.* Ambitions advance to the next multiple of five orders or 25 deliveries; commission and order pools cycle through three recipes. The gameplay roadmap already says this provides "direction but little new decision-making". Keep 24 and repeat voyages make the cycles self-sustaining, which is good for comfort and bad for engagement.
4. *The festival's visitor stage is where two boats matter, but the game never says so.* The earned traces run four ferry trips serially on one boat (626 and 1,236 simulated seconds). Elena's stage-2 guidance picks one idle boat and one route; it does not suggest sending both.
5. *Festival requests have no supply help.* After opening, the two requests show only a cost line and "Not ready yet"; they carry no planner goal, so there is no Plan supplies or Reserve, and Elena's card has moved on to "Choose your next ambition". Everything else that costs goods in the game has one or both.
6. *Town layout exposes 36 move/redevelop actions as a flat list.* Thirty move/swap combinations plus six redevelopments appear as cards. Nobody will browse those; moving a building belongs on the map.

**Proposals, in order of value for effort.**

- *Rebalance the island, not everything.* Bring the island tier-3 reward down toward 600 coins and raise Pietra Cove tier-3 materials, so the two destinations stay a real choice; cap stacked coin multipliers at ×1.5 total. This is a catalog change shared with the browser game, so ship it as a separate, deliberate browser-and-native PR with the campaign traces regenerated.
- *Add coin sinks that are choices, not taxes.* A second-tier workshop refit per station, a third market plot (plot 3 is already "reserved for a future business" in the engine), and festival requests that pay in rare goods (sails, fittings) as well as coins.
- *Give the festival request board the same support as other goals.* Register each request as a reservation goal in the adapter so Plan supplies and Reserve appear, and keep Elena on the festival while a request is affordable within two production steps.
- *Make the visitor stage teach the two-boat choice.* When one boat is already carrying visitors and the other is idle, Elena's card should offer the second service, and the Fleet berth card should say "Carrying festival visitors".
- *Fold Town layout into the map.* Long-press or a Move button on a selected neighbourhood building, then tap a destination plot. Keep the engine's move/swap action; drop the 36 cards.
- *One early expressive choice.* Let the player name the town at the first delivery (the evolution model already names it Porto Lume in events while the header says Little Harbour), and pick the bakery's awning colour. Zero economy impact, immediate ownership.
- *Then the roadmap's coastal restoration*, as proposed in `GAMEPLAY-NEXT-STEPS.md`, which adds the timber-versus-earnings decision the late game lacks.

## Story and characters

**Findings.**

1. *Elena has no voice.* She is a portrait and a header; her card shows engine objective text ("Light the coast", "Choose what your town becomes"). She never speaks in the first person, never reacts to a completed chapter, and does not appear in the browser game at all.
2. *Nobody else exists.* The destinations are names. Contracts, commissions, residents' proposals and passengers come from no one. The four evolution events ("A shipping cooperative asks how Porto Lume should grow…") are the only moments with a point of view, and they live inside the Journal where few players will look.
3. *The journal is a log.* Five lines of recent notes, four axis bars and, after the festival, one memory card. The directory promises "The story your choices are writing"; the page does not yet deliver it.
4. *Names drift.* The Fleet screen says Olive Island, the catalog says Isola dei Pescatori; the events say Porto Lume, the header says Little Harbour; chapter 4 is "A living coast" on the map card and "Connect the harbour" is chapter 5. Players notice this kind of thing more than designers expect.

**Proposals.**

- *Give Elena thirty lines.* One greeting per chapter opening, one reaction per chapter completion, one line per festival stage, and three idle remarks when the player is waiting. Short, first person, no lore dumps. Store them beside the objective text in the native guidance module so the browser engine is untouched. This is the cheapest change in this document with the largest felt difference.
- *Name the partners.* A mason at Pietra Cove, a chandler on the island, a market steward, a residents' spokesperson. Each coastal project, commission and residents' proposal gets a one-line voice from its person. Portraits can follow later; names and lines first.
- *Turn the journal into memories.* Every chapter completion, festival theme, residents' choice and town-direction change writes a dated memory card with the existing painted art. Keep the log underneath. The data already exists in the save; this is presentation.
- *Fix the names once.* Decide on Olive Island or Isola dei Pescatori and use it everywhere; make the header identity and the event town name the same string.
- *Let the chapter card celebrate.* On chapter completion, show a one-screen moment with Elena, the painted building that finished it and the memory line, before the next objective appears. One screen, dismissible, never blocking saves.

## Interface

**Findings, from the screenshots.**

1. *Guided panels repeat themselves.* In the focused Production view the words "Harvest & replant" appear three times within 400 points: Elena's title, the action card title and the button. The chapter card on the map shows it a fourth time.
2. *Primary actions fall below the fold on 6.3-inch phones.* The festival's "Open the harbour festival" and the Keep 24 control both sit under the Production/Trade/Build bar until the player scrolls, which is what the GitHub failure was about. The panel order puts explanation and requirements above the action.
3. *The Town directory duplicates the dock.* Production, Trade and Build are both dock items and "The working harbour" rows; "Town ambitions" is the only row without art; twenty categories across four groups is a lot for a sheet reached from one dock button.
4. *Landscape on iPhone loses the feedback and the mission row.* The feedback banner covers the lower third of the inspector while it shows, and the destination chip row in Fleet is cut at the panel edge with no affordance that it scrolls.
5. *The map card and the inspector compete.* Elena's chapter card covers the bottom quarter of the map in portrait; on a developed town it hides the lighthouse and ferry pier, the two sites players most want to watch.
6. *Fleet is clear; Build is not.* The boat-first Fleet flow is the best panel in the game. Build still lists everything buildable as cards, with no sense of where on the map each thing will go.

**Proposals.**

- *One statement of the action.* In guided mode, make Elena's card the only title and let the action card be the button plus its cost line.
- *Action first, then why.* In Festival and the workshop panels, put the primary action card directly under the stage title and move the reward note and explanatory text below it; shorten the stage-3 reward note, which repeats the body text.
- *Collapse the chapter card when the player is not following it.* A single-line pill ("Chapter 4 · Refit a working boat") that expands on tap, so the map keeps its lower quarter.
- *Turn the Town sheet into a grid of painted tiles* with the dock items removed from it, and give Town ambitions an icon.
- *Build from the map.* Tapping an empty plot already opens its activity; add the reverse: a Build card gets a "Show on map" that focuses the camera on where the building will stand.
- *Landscape fixes.* Make the feedback banner a toast over the map, not an inset in the inspector, and give horizontally scrolling chip rows a trailing fade.
- *Keep the inline automation and per-boat controls exactly as they are.* They are the right pattern.

## Graphics

**Findings.**

1. *The buildings are the game's best asset; the ground is not.* The whole-town view shows beautifully painted individual buildings on a flat ochre plain with a single thin road loop. Between the public square and the fishing jetty there is a screen's worth of empty grass. The plain reads as unfinished, not pastoral.
2. *Nothing sits on the ground.* Sprites have no contact shadow, so buildings and people float slightly, and the sun direction varies between assets.
3. *Scale is inconsistent.* Market stalls are nearly as large as houses; boats at the quay are a third the size of a stall; the public square fountain is as tall as the boatyard.
4. *Unbuilt plots read as farm beds.* The empty-site sprites are stone-edged dark soil with greenery, which says "garden" rather than "a place for a building". Only the field has a ripe state; the three shared construction families mean most upgrades add an annex rather than change the silhouette.
5. *Water, light and weather are static.* There is no wave or shoreline shader; boats have wakes but the sea they cross does not move. Dark mode is a 22 % blue overlay, honestly documented as not a night scene. There is no time of day.
6. *People are single frames.* Two to five townspeople translate and bob; they do not walk, carry or work, and never go near the thing they are named for (the docker on the plain in the screenshots).
7. *The outpainted surround joins visibly* in landscape at mid zoom: the rocks change resolution and scale at the edge of the painted terrain.
8. *Festival decorations are code-drawn* posts, bunting and lanterns over painted stalls. They read, but they are the only non-painted elements in the scene.

**Proposals, in order of value for effort.**

- *Ground pass on the terrain (one painted layer).* Paint paths to every site, low stone walls between fields, a few cypress rows and a dry-stone terrace step through the empty plain. This is one 1800×2700 repaint with the existing prompt lineage and fixes finding 1 without touching any sprite anchor.
- *Contact shadows and a shared light direction.* A soft elliptical shadow node under every sprite (code, one afternoon) and a note in the art README fixing the sun to upper left for future assets.
- *Scale normalisation table.* Define a target footprint per kind (stall 0.6 of a house, boat 0.9 of a house) and apply per-kind scale factors in the scene; no repainting needed for a first pass.
- *A true empty-plot sprite.* Pegged string, a survey post and a sign; and a second construction family with scaffolding for large buildings, so the sequence reads plot, scaffold, building.
- *Living water.* A tiled, slowly scrolling foam texture along the shoreline mask and a gentle sine distortion on the sea, both disabled under Reduce Motion. This is the single biggest "alive" gain per hour after shadows.
- *Two-frame walk cycles* for the three people kinds, and routes that go between the sites they belong to (baker between field, mill and bakery). Still cosmetic, still honest.
- *Paint the festival atlas.* Posts, bunting, lanterns and a themed stall as proper painted states, so the courtyard reward matches the rest of the town.
- *A real evening palette later.* If time of day is ever wanted, do it as a second terrain tint plus warm window emissive sprites, not a shader rewrite; it should follow the ground pass, not precede it.

## Suggested sequence

1. Elena's lines, journal memories and name consistency (story; small, native-only, no save change).
2. Panel order, guided-mode deduplication, collapsible chapter card, Town sheet grid (interface; native-only).
3. Ground repaint, contact shadows, scale table, empty-plot sprite (graphics; assets and scene, no economy).
4. Festival request goals and the two-boat visitor hint (gameplay; adapter and guidance, native-only).
5. Island rebalance and new sinks (gameplay; shared catalog, browser PR, traces regenerated, human playtest before and after).
6. Coastal restoration (the roadmap's next increment).

Each step is independently shippable and testable with the existing harness: Node checks for anything touching the adapter, the earned traces for anything touching costs, and the UI target on an iPhone 16 Pro-sized simulator for anything touching panels. Steps 1 to 4 need no change to the browser game or to saves; step 5 does, and should be treated as a balance release of its own.
