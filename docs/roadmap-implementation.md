# Roadmap implementation evidence

Base: main `cf9fa15a0880654329f1fa13c79876d1cc515b1a` (v0.19.0), verified 30 October 2026.
Baseline: 163 Node tests pass. Existing main tests and Pages run succeeded independently.

## Increment 1: Save protection and publication gate

- Dedicated persistence boundary validates writes and locks after failed reads, parse failures, quota failures or competing-tab changes. An empty saved string is also protected.
- Exact original bytes remain in the primary slot until an explicit import/reset/restore; those actions require a verified, separate backup before replacement. Backups are never automatically pruned. If storage fills, replacement stops; export remains available.
- The first write after a valid load archives the exact source before normalization/migration. No change to the version 13 schema or valid player progression.
- Recovery dialog and persistent recovery button offer original-byte export, import, backup export/restore and reload. Gameplay pauses while the save is protected. Unknown future versions fail explicitly.
- Timer validation uses a bounded one-day persistence limit rather than current balance durations; preserves paid remaining work when recipes/refits change. Structural, resource, unlock and capacity validation still apply.
- Rendering does not save. Writes occur after user actions (deduplicated), at 15-second simulation checkpoints, and on visibility/pagehide. No offline catch-up is added.
- Pages calls the same reusable test workflow as PRs and has `needs: test`. Syntax, Node regressions, browser smoke and standalone packaging must pass before publication.

Validation: 172 Node tests pass. Real Chromium viewport tests at 390×844, 1024×768 and 1440×900 pass. Additional real-browser recovery regressions exercise exact-byte export, dialog dismissal, action clicks, lifecycle flushes, reload and explicit backed-up replacement for empty, malformed and future-version saves.

Limitations: localStorage cannot provide an atomic compare-and-swap across simultaneously executing tabs. Comparison detects prior competing writes; avoid editing the same town in multiple tabs. Device backups share browser storage and are not a substitute for downloaded exports. Abrupt process termination can lose at most the work since the last successful checkpoint; browser lifecycle events are best-effort.

## Increment 2: Mobile UI, progression, economy and portrait world

- Eleven shipped stylesheets become one `game.css`; retired photographic backgrounds are removed from the runtime. Existing control classes remain to keep tested action bindings stable. Some hidden legacy templates and unused source PNGs are retained for a later removal pass.
- UI reconciliation updates changed attributes/text in place, preserving live controls and scroll positions. Unchanged markup is skipped. Background completion updates coalesce to at most one structural refresh per second; timers still update every 200 ms. User actions render immediately.
- Four persistent phone destinations (Map, Production, Trade, Build), safe-area-aware drawer, minimum touch targets and a persistent objective. Specialist systems remain accessible from their existing panels.
- Five chapter groupings: working harbour; town identity/charter/waterfront; hillside/market; coast/neighbourhood/civic project; ferry connection. One objective drives overview, persistent chip and next-action routing. Neighbourhood unlocks can no longer hide unfinished lighthouse work. All existing player progress and systems remain available.
- Ferry construction entry is absent until its actual engine eligibility condition. Chapter numbering is consistent throughout the changed panels.
- Post-quay base shipment coins: Cala Verde 180→140, Porto Santo 100→60, single-product Isola Lunga 150→110 / mixed 210→160, Porto Grande 320→240, inland 180→140. Starter deliveries are unchanged. Cala Verde now has better coin yield per cargo unit while Porto Santo favours materials. Costs are unchanged, so existing reservations remain valid.
- Town focuses: trade +35% coins (was 10%); builders +50% materials (was 20%); community +50% local-order coins (was 20%). Workshop speed refits take 40% less time (was 25%). Public garden adds its existing queue slot plus 20% faster new crops/craft batches; commercial square adds 35% local coins (was 20%). Existing jobs retain their remaining timers and voyages retain captured rewards.
- Fruit preserving yields six preserves per two jars in 24 seconds; vegetables yield four in 12 seconds. Orchards use fewer jars per export, while gardens release the shared preserving room sooner. This is an initial balance pass, not proof of campaign pacing.
- A shared pure world model supplies positions, building phases and levels to a 1800×2700 portrait SVG peninsula. Starter field/mill/bakery are built; other gameplay structures start as plots and evolve from saved construction, civic, lighthouse, ferry and neighbourhood state. Physical structures and their interaction labels share coordinates. Camera pan/pinch/zoom, keyboard navigation and district controls are retained. SVG is sufficient for this scene size; PixiJS is not added without a measured benefit.

Validation: **183 Node tests pass**, including earned-resource progression through charter/waterfront/inland/fleet/lighthouse, five-chapter dependency tests, save regressions, economy tradeoffs, map-state tests and standalone packaging. Real Chromium smoke passes at **320×667 touch, 390×844 touch, 1024×768 and 1440×900**, including recovery, real construction changing the physical map, gating, navigation, zoom, a real harvest, reload and sample trade payout. The checks assert no page errors, horizontal overflow or PNG requests. These are emulated viewports, not physical iPhone/Safari certification.

Reproducible performance: `node scripts/profile-browser.mjs` compares the original `cf9fa15` UI with the current UI using the same established town and automation targets at 3× in a 390×844 browser. In 20 seconds: primary-save writes **21→1**, whole-panel replacements **15→0**, PNG downloads **11,698,085→0 bytes**. See `performance-profile.json`. This scenario does not establish frame-rate or battery performance on an iPhone.

Standalone HTML: **473,344 bytes** at this increment (previous audit reported ~87 MB). No external runtime dependencies or photographic assets are embedded. Build with `npm run standalone -- /path/to/playtest.html`.

## Exact remaining roadmap scope

1. **Stability:** implemented with regression coverage. localStorage's cross-tab atomicity and browser lifecycle limitations above still apply. Future unsupported schema versions remain protected rather than being guessed/migrated.
2. **Performance/UI:** substantial implementation, measured and browser tested. Full removal of hidden legacy templates, unused PNG source assets and redundant CSS declarations remains; class names still reflect older UI versions. Physical-device performance and accessibility review remain.
3. **Gameplay:** five chapter grouping, repaired guide dependencies and first economy/choice rebalance implemented. The existing ~35 systems have **not** been cut into a smaller authored slice. A reproducible full-campaign bot, human playthroughs, 2.5-hour calibration and iteration on meaningful decision outcomes remain. No 2.5-hour claim is made.
4. **Map:** portrait geography, shared building data, state-driven physical art, construction stages, camera and touch controls implemented. Final premium art, distinct detailed structures for every production type, animated travel between coastal destinations, interaction-collision audits at every late-game layout and physical iPhone tests remain. Retaining SVG is an implementation choice, not a claim that PixiJS was evaluated on-device.

Publication: these increments are delivered as reviewable commits/PRs. The live Pages URL continues to serve main until the reviewed changes are merged; PR test success alone is not publication. Verify the deployment SHA and live version after merge.
