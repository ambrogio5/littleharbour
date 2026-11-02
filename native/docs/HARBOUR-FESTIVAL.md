# Harbour Festival — build 10

Chapter 6 opens after the original five chapters and the first returned passenger service. Town → Harbour festival, Elena’s next-step card and the existing courtyard all reach the project. The three open-play ambitions remain available. Coastal restoration and shipwright projects are not implemented in this build.

## Playable stages

| Stage | Work | Lasting visible change |
| --- | --- | --- |
| Prepare | 300 coins, 12 wood, 8 tiles | Courtyard posts and rope |
| Supply | Choose food: 24 bread, 12 preserves, 8 jars; or craft: 12 cloth, 8 furniture, 12 tiles | Bunting and a theme-specific stall |
| Welcome | Two completed passenger returns from Pietra Cove and two from Olive Island after supplies are contributed | Visiting people |
| Open | Food: 4 furniture, 4 cloth, 8 bread, 8 preserves; craft: 12 bread, 8 preserves, 4 cloth, 4 jars | Full bunting, lanterns, journal memory and festival request board |

The theme can change freely until its supply contribution is paid. Either boat can carry visitors, using the existing per-boat passenger screen, costs and journey times. Cargo runs, recalls and historical services do not advance the visitor counters. Already-active passenger trips count when they return after the contribution. Pausing and backgrounding retain the existing simulation behavior.

Two requests are visible together. Completing either refreshes both; there are four authored recipes in a deterministic alternating pool. Rewards are 360–420 coins for mixed finished goods. This is a small repeatable pool, not unlimited authored story content. No new currency, paid acceleration, deadlines or income multiplier is added.

Contributions use finished goods available after other reservations. Incoming output is shown but cannot be spent early. Elena recursively follows existing recipes or trade for missing supplies; when work is queued, she explains the wait. The original reservation planner cannot reserve a native festival goal, so the project does not show misleading Plan/Reserve controls. Existing reservations can be released in Town → Manage work → Reservations.

## Saves and compatibility

Festival preparation upgrades the native envelope to version 3. It contains the unchanged browser version-13 town, evolution, validated Keep 24 overrides and validated festival progress. Every contribution runs on a copy and validates the entire result before committing. Stage-specific action identifiers and request epochs reject stale/repeated payments. Reloading or viewing a projection grants no reward.

Versions 1 and 2 still import. Unsupported versions and malformed metadata leave the live town untouched. Older native clients protect unsupported version-3 files instead of overwriting them. Native exports keep the complete state. Browser exports omit festival progress, decoration and requests, but goods contributed to the festival remain spent. Reimporting a browser export starts festival progress again; keep a native export for lossless transfer. The export screen discloses this distinction. Browser engine/source files are unchanged.

## Artwork

The reward is a separate SpriteKit layer attached to the established courtyard. Posts, bunting and lanterns are code-drawn; stalls and visitors reuse the established painted sprites. It does not replace the terrain or create a new district. It is static, including under Reduced Motion; no flashing effects or new background simulation is introduced. A dedicated painted festival atlas remains a possible art improvement, not a shipped asset.

## Verification and pacing

The earned campaign generator continues the two original completed towns without injecting goods or coins. Food requires 151 additional actions and 1,720 simulated seconds; craft requires 184 actions and 2,370 simulated seconds. Each trace includes opening the festival, two completed requests and 13 save/reload checkpoints. These are serial production scripts, not optimal strategies or measured human session lengths. They do not validate the earlier target of two or three 15–20-minute sessions. A wealthy automated town can finish supply stages much sooner.

Adapter tests cover both themes, reservations, transactional invalid imports, Keep 24 coexistence, paused/cancelled/cargo trips, per-destination caps, reloads and stale contributions/rewards. Native tests replay both traces in JavaScriptCore and verify decorative stages, stable courtyard position and reset/reload behavior. UI tests cover preparing/changing theme, opening passenger selection, celebrating, request visibility, the courtyard directory and journal memory.

`festival-ready.json` is an explicitly wealthy UI navigation fixture. It is not used as evidence of earned progression. `festival-opening.json` comes from the earned food trace. `festival-campaigns.json` records both earned traces; CI and the local release helper check deterministic regeneration.

Actual simulator captures reviewed: [completed courtyard](screenshots/festival-courtyard.png) and [visitor goals](screenshots/festival-visitors.png).

Build 10 verification:

- Original browser tests: 207/207; native adapter: 20/20.
- Bundle freshness, all art manifests, original earned campaigns and both earned festival traces: pass.
- iPhone 17 Pro Max / iOS 26.5: 42/42 core tests passed. Initial UI run passed 18/19; the new courtyard/journal test needed to await sheet presentation before dismissal. After that test timing fix, the entire UI target passed 19/19 (`/tmp/lh-build10-phone-ui.xcresult`). All 61 unique tests have passing coverage; this was not one clean 61-test phone run. A separate method-filter attempt selected zero tests and is excluded from coverage.
- Generic device Release compilation and development-signed QA build: pass.
- Build-10 QA install commands succeeded on iPhone Duo and Ambrogio 17bis without uninstalling the app. Reopening Duo was blocked by its locked state; 17bis reported a device connection error. Installation alone is not a completed device playtest.
- iPad Pro 13-inch (M5) / iOS 26.5: **61/61 passed in one full run**, zero runtime warnings (`/tmp/lh-build10-ipad.xcresult`). Both new festival flows and the existing landscape, large-text, dark appearance and recovery checks pass. Phone/tablet festival captures were visually reviewed. Physical pacing, comfort, battery/thermal behavior and full accessibility acceptance remain human testing requirements. No App Store upload or submission is part of this change.
