# Harbour crews — next gameplay phase

Approved by the owner on 6 November 2026, including the rates and native-envelope-5 boundary. Implemented in build 17; final verification is in progress. Builds on the completed city/civic systems and build-16 navigation fixes. This is one reviewable increment, not a promise to add all remaining roadmap ideas at once.

## Player decision

The late game has many supply goals but little reason to change a working production setup. Introduce a scarce, movable source of help: assign harbour crews to a workshop or a particular boat. Helping the kiln means that team cannot help a city voyage. Changing the current goal can make moving a team worthwhile, without adding a timer, penalty or another delivery quota.

The first team graduates when the harbour school is completed; the second becomes available after the regatta. Both are optional, cost no coins or goods, and have no wages or upkeep. Each team has one assignment; each workplace or boat can have at most one team. No crew occupies the existing partner/adviser slot.

## Approved numbers and rules

- Two teams maximum, unlocked by the existing school and regatta completions.
- A team contributes 25% extra work per active simulated second to one assigned workshop or boat: about 20% shorter completion time. Existing refits, cargo prices, outputs and voyage rewards remain as they are. Crew effects cannot stack on the same target.
- Assign or move a team only while both its previous and proposed workplaces are idle. Workshop queues must be empty; boats must be in port and automatic repeat disabled. Completed or queued work cannot receive a retroactive refund or duplicate reward.
- Workshops include their existing recipes; boats include cargo, passenger, circuit and city voyages. The native decorating bench is a separate workplace. No boost to construction, seasonal clocks, household standing or relationship thresholds.
- Pause/background behavior stays unchanged. No offline progression, deadlines, fatigue, injury, lost goods, wages, paid boosts or new coin multiplier.

## In-game presentation

Place assignment controls beside the existing workshop automation and selected boat mission controls. Production's stock overview shows the assigned team; Goals explains which bottleneck might benefit. A compact team overview under People lists current assignments and links to their workplaces. Show the exact benefit and the reason an assignment is currently locked. Never dispatch a boat, spend goods or start production merely by assigning help.

Use the existing people/portrait language and native icons for this increment; do not claim new finished character art. Keep normal controls stable as statuses change, with accessible labels and a layout that works in Duo landscape and the iPad activity sheet.

## Engine and save boundary

Implement a small opt-in work-rate hook in the existing simulation so the original completion, yield, automation and voyage code remains authoritative. Browser callers use the default rate of one and retain identical behavior. No catalog or browser deployment changes. Add regression checks proving that an absent hook is identical to the current engine, and that one large tick and equivalent small ticks do not manufacture extra rewards.

Code inspection found two integration requirements: production currently spends one time budget per station, and native festival/project progress infers arrivals from the previous trip's remaining time. Apply the rate to the station budget (not independently to every waiting job), and report actual completed voyages to native objectives so an accelerated arrival counts exactly once, including when a repeat immediately starts. Keep the existing repeat/automation behavior at tick boundaries; compare large/small ticks on fixed queued work with automation disabled, rather than claiming the original simulation already has global timestep invariance. Show player-facing remaining seconds divided by the assigned rate while retaining canonical work units in the save.

Crew state belongs in the validated native chronicle, not preferences. Native saves using crews require envelope 5; ordinary saves without crews retain their current envelope. Versions 1–4 migrate without activating teams. The existing build-16 reader must reject version 5 before altering any bytes. Browser copies omit team assignments while preserving legitimately earned stock and in-flight progress; explain that boundary beside export.

Assignments use an epoch token and atomic validation. Reject unknown workplaces, nonexistent boats, duplicate destinations, busy-target reassignment, locked teams, malformed saves and stale/double actions. Derived suggestions never mutate the town.

## Acceptance

Exercise both unlocks through the existing earned city/civic traces; compare no-team, workshop-team and boat-team continuations. Record goods, coins, active decisions and simulated waiting rather than claiming a longer or more enjoyable game from timers alone. Test mixed refits, station queues, repeated voyages, city imports/crafting, recall, pause, save/reload, browser export and old-reader protection. Replay through Node and JavaScriptCore, then verify inline assignment and goal navigation on iPhone/iPad simulators. Physical acceptance remains a separate step on a disposable test town; never replace the owner's town with a fixture.

## Implemented behavior and earned checks

Assignments are inline in Production and the selected boat, plus the decorating bench. The People overview groups its picker into workshops and boats; the bench is directly accessible. Goal supply cards link to the actual workshop. Controls reserve status space and reject rapid reversal taps. No new character raster art is claimed.

The canonical engine accepts an optional fourth work-rate argument; the default remains exactly the original simulation. Rates affect one station budget or one boat, not every queued batch, construction or the seasonal clock. Native arrival recording consumes actual completion events, including immediate repeat departures. Tiny floating-point residues are clamped only on accelerated work. Displayed remaining time converts canonical work units into game seconds.

Six earned continuations start with the two existing city-campaign towns, compare no crew / workshop crews / fleet-and-bench crews, use real recipes and voyage costs, and checkpoint reloads throughout. Each allocation produces exactly the same final stocks, coins, glaze and ceramics for its starting town:

| Earned task | No crew | Workshop allocation | Fleet + bench allocation |
| --- | ---: | ---: | ---: |
| Prepare jars and wine, either starting town | 408 s | 348 s | 408 s |
| Import glaze and make six ceramics, maritime town | 513 s | 513 s | 447 s |
| Import glaze and make six ceramics, estate town | 548 s | 548 s | 482 s |

These are scripted game-time measurements at 1×, including ingredient preparation, not human session timings or evidence that the new choice is enjoyable. Existing no-crew economy baselines retain identical measurements; only the current bundle fingerprint changes.

Initial validation: all 216 browser tests and 52 adapter tests passed before the additional accelerated-repeat regression; the expanded crew suite now has nine passing tests. The six earned traces replay through JavaScriptCore, and native persistence/navigation tests pass. Phone portrait assignment and busy-lock checks pass. The first landscape run exposed a long ungrouped menu; grouped-menu and landscape reruns now pass on iPhone, together with the rapid-tap/save test. Both crew UI checks also pass on iPad in dark mode at the largest accessibility text size. Final review corrected the decorating action’s displayed duration to include its assigned team; a regression assertion covers it. Full CI is in progress. Physical playtesting, VoiceOver gestures and sustained performance remain unverified. Build 16 on Duo remains untouched by this development.
