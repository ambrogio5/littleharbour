# Native v0.2 · painted graphics and UI/UX improvement

This pass improves the **actual native client**, retaining the original offline economy, saves and progression. It replaces the flat native artwork and restructures management/navigation. It does not modify `dist/`, the browser deployment workflow, the economy bundle, or save formats.

## Integrated artwork

- New painted Mediterranean coastline, limestone, olive groves, sunlit terraces and turquoise water.
- **24 distinct completed object designs**, packaged into 120 named state textures: mill, bakery, olive press, fishing jetty, quay, waterfront, lighthouse, ferry, boatyard, estate, kiln, specialist workshop, fields/gardens/orchard/flax, houses, carpenter, weaver, sailmaker, market, square, clay bank and boat.
- Empty sites, timber scaffolding/masonry, growing/ripe wheat and visible upgrades remain separate state-driven sprites. Construction families and upgrade annexes are intentionally reused; 120 variants does not mean 120 individually painted designs.
- Stable anchors, depth sorting, coastal registration, zoom-aware backed labels, optional labels, moving boat selection, modest working-chimney smoke and harvest readiness pulses. Pause and Reduce Motion stop activity effects.
- Matching opaque app icon. Source atlases and final prompts are committed, with deterministic offline packing and source/output integrity checks.

[Building catalogue](screenshots/painted-building-catalog.png) · [State catalogue](screenshots/painted-state-catalog.png) · [Provenance, prompts and rebuild](../art-source/painted-v2/README.md)

The original approved whole-map concept was not attached to the retrieved prior chat. This is a cohesive painted interpretation of the documented Mediterranean direction and playable geography, not a claim of exact visual matching to an unseen image. The committed browser `harbour-map.png` also remains available as a historical photographic reference.

## UI and UX changes

| Before | Now |
| --- | --- |
| Full inventory could bury a ferry or production action | Compact expandable inventory; voyages/progress near the top; site actions before stock details |
| Long undifferentiated action lists | Search across actions, costs and blockers; All actions / Ready now; useful empty states |
| A selected mill still showed unrelated production; boatyard opened Fleet | Structured site-to-recipe filtering; built inland/artisan sites open production; numbered boats open Fleet |
| Weak action hierarchy | Distinct title, requirements, blocker explanation and labelled primary action; supply planning stays available |
| Plain text supply plan | Per-resource progress, missing/incoming quantities, recipe batches and queue readiness |
| Oversized Town menu put the journal offscreen | Journal first, four direct destinations and grouped Grow the town / Manage work submenus |
| Navigation context could linger after changing destination | Navigation clears selection; filters/search reset and panels scroll to top |
| Half-height iPhone panel obscured useful content | Full-height sheet with Map return; iPad keeps a responsive side panel |
| Map labels could be hard to read and stay behind moving boats | Backed zoom-aware labels, optional ordinary labels, selection follows vessel position |
| Confirmation overlaid the header and could intercept Settings | Feedback reserves layout space; brief successes expire; important replacement messages clear the success timer |
| Very large text wrapped stock/navigation into narrow columns | Vertical inventory summaries, compact HUD/navigation, accessible named map icons and scrollable management text |
| Disconnected visual styling | Shared daylight palette, typography, rounded cards, category symbols, chapter guidance, redesigned journal/settings and optional haptics |

## Verification

Checked October 31–November 1, 2026 with Xcode 27.1 / Swift 6.4, iOS 27.0 simulators. Automated fixture screenshots use test-only developed inventory, not an earned full-campaign playthrough.

| Check | Result |
| --- | --- |
| Original browser/economy regression suite | **207/207 passed**; browser source/deployment unchanged |
| Native adapter/generated runtime parity | **8/8 passed**, including 290 economic scenarios in each runtime |
| Engine bundle and painted asset integrity | **Passed**: source/output hashes, 120 state textures, terrain and olive tree |
| iPhone 18 Pro simulator | **22 unique tests covered**: full 14 core + 8 UI pass in `painted-iphone-3`; final 17-test targeted pass in `painted-iphone-review` after final menu/shore/typography refinements |
| iPad Pro 11-inch (M5) simulator | **22 unique tests covered**: full 14 core + 8 UI pass in `painted-ipad`; later 17-test typography/navigation pass and final 17-test targeted pass in `painted-ipad-review` |
| Unsigned generic-iOS Release build | **Passed**; compilation/linking only, no device installation or signed archive |

The final targeted runs each execute all **14 core tests** plus developed-map/journal navigation, real paid ferry service and AX5 harvest/Settings. Earlier passing UI runs also cover opening production/trade/settings, pan/pinch/landscape, sites/zoom, search/ready filtering and real save/termination/relaunch. **This is not a claim that all 22 tests were rerun together on the final source revision.** Full result bundles are `/tmp/littleharbour-<name>.xcresult`, using the names in the table. Final build log: `/tmp/littleharbour-painted-release-final.log`.

The tests caught and prompted fixes for a large-text result banner intercepting Settings and a repeat-run journal selection at the bottom of an oversized Town menu. The final focused reruns passed after moving feedback into reserved space and grouping Town navigation with the journal first. Visual review caught a clipped upgraded-house roof and decorative boat positions on the expanded land; both were corrected and recaptured. An early compile error in a custom accessibility label was corrected. Xcode still emits its simulator-version/AppIntents metadata diagnostics; these are not represented as physical-device certification.

Actual simulator captures inspected:

- [iPhone opening map](screenshots/painted-iphone-map.png), [selected mill inspector](screenshots/painted-iphone-inspector.png), [large-text production](screenshots/painted-iphone-large-text.png).
- [iPad landscape map and trade](screenshots/painted-ipad-landscape.png), [developed whole town](screenshots/painted-ipad-whole-town.png), [real passenger service](screenshots/painted-ipad-ferry.png).

The native app bundles approximately 28 MB of terrain/state PNGs. That compressed file size and cache limits are **not** measured process/GPU-memory budgets. The app's source and shared scheme remain in [LittleHarbour.xcodeproj](../LittleHarbour.xcodeproj); follow [build/run instructions](../README.md).

Remote checks rerun when the PR is pushed. Consult [PR #14](https://github.com/ambrogio5/littleharbour/pull/14) for current CI; local results do not imply completion of a later GitHub run.

## Remaining limits

This is a working native beta with a substantial painted-art and usability pass. No physical iPhone/iPad installation, frame/thermal/battery/memory certification, complete VoiceOver/Switch Control audit, full human campaign/balance validation, final art approval, complete audio/animation production, signed distribution or App Store submission is claimed. The AX5 check is a navigation/action smoke test. Older iOS/Xcode versions remain unverified. See [release requirements](RELEASE.md).
