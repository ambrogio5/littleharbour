# Verification record

**Follow-up:** the newer painted-art/UI pass has a separate [graphics and UX verification report](GRAPHICS-UX.md). Results below describe the initial native baseline, not the current artwork.

Baseline: main `5bb5bdc` (latest merged premium-building update at the start of this work). The checkout was clean. No tracked browser runtime, save schema, balance constant, browser test or Pages workflow was changed. Native code and resources are additive; the root README links to them.

## Local results

| Check | Result | Evidence and scope |
| --- | --- | --- |
| Existing Node tests | **207/207 passed** | All original engine, progression, reservation, save, UI-template and packaging regressions. |
| Existing Chromium smoke | **Passed** | Malformed/empty/future save protection, original-byte exports, backed-up recovery, construction, phone/tablet/desktop layouts, navigation, harvest, reload. |
| Existing playable visual-preview smoke | **Passed** | iPhone/iPad browser viewports: distinct structures, real trade/construction, separate save slot, camera and reload. Browser viewport tests are not physical-device tests. |
| Native adapter | **8/8 passed** | **290 economic scenarios in each of the ESM and generated runtimes**, compared with the original engine; pre-quay expansion, historical schemas 1–13, paid work, pause, invalid imports, reservations, planning, source-independent bundle execution. |
| Generated resources | **Passed** | Eight bundled source modules, approximately 140 KB; matching source SHA-256 manifest. Terrain and **120** state textures verified against source hashes and dimensions. Native XCTest also loads actual images from the application bundle. |
| iPhone 18 Pro / iOS 27.0 simulator | **16/16 passed in one full run** | 11 engine/filesystem/resource tests + 5 UI tests: opening production, trade/settings, real save/relaunch, sites and zoom buttons, pinch/pan/landscape, and a real paid passenger service in a developed town. `/tmp/littleharbour-iphone-complete.xcresult`. |
| iPad Pro 11-inch (M5) / iOS 27.0 simulator | **All 16 unique tests covered by passing runs** | Initial 13-test full run; added texture test; final 11-test core run and two-test developed-ferry/landscape run. The union covers the same 11 core + 5 UI tests. This was **not one single 16-test final iPad run**. Results: `ipad-final`, `ipad-art-gestures`, `ipad-core-final`, `ipad-review` bundles under `/tmp/littleharbour-*.xcresult`. |
| Simulator Debug build | **Passed** | Compiled and ran the real SwiftUI/SpriteKit/JavaScriptCore app. |
| Unsigned generic-iOS Release build | **Passed** | Device-architecture compilation and linking. Not physical installation, performance measurement, a signed archive, or an installable IPA. |

Locally used Xcode 27.1 / Swift 6.4, complete concurrency checking, Swift 5 language mode, deployment target iOS/iPadOS 17.0. Older Xcode/OS versions have not been certified. The final short-window objective and user-facing recipe/site labels are presentation refinements; relevant iPad interaction checks and Release compilation followed the layout changes.

## Screenshots actually inspected

- [iPhone opening map](screenshots/iphone-map.png).
- [iPad developed town with a real passenger voyage](screenshots/ipad-passenger-service.png).
- [iPad landscape map and trade inspector](screenshots/ipad-landscape.png).

These are actual simulator captures, not design mockups. The developed fixture uses abundant test-only inventory to reach late systems; its stock and funds are **not** evidence of earned-resource pacing. The ordinary app never opens that fixture. The original approved painted mockup was not available in the retrieved conversation; these assets use the committed whole-map visual preview as the reproducible art reference.

## Failures found and corrected during development

Early runs detected omitted application resources, a boolean/text descriptor mismatch, unstable evolution serialization ordering and missing sibling constants in a multi-binding catalog export. They were corrected. Tests now cover packaged resources, typed snapshots, stable round trips, generated-runtime parity and actual JavaScriptCore purchases of the 140-coin quay and 120-coin storehouse.

A repeated iPad ferry UI check initially failed because the developed inventory pushed its button outside the visible accessibility area. The test now scrolls the native management panel before locating/tapping the service; its rerun passed. Landscape attachments use the full simulator screen after window orientation settles, avoiding clipped app-only captures during rotation.

Some intermediate iOS 26.5 multi-destination runs were interrupted after simulator boot/data-migration or test-runner cleanup problems. They are not counted as passed UI verification. Fresh individual iOS 27.0 runs completed. Xcode's simulator/SDK diagnostic messages are not represented as app failures or as device certification.

## GitHub verification

Foundation PR #13's corrected head `cb29131` passed both the native foundation workflow and the existing browser workflow on GitHub. Client PR #14 has native CI for bundle/art parity and macOS-hosted simulator tests. New pushes retrigger it; **consult the current PR checks for final-head remote status**. Local passes above do not assert that a later remote run has finished. Concurrency cancels superseded native runs on the same PR.

## Reproduce and remaining limits

Use [the native build instructions](../README.md). The committed Xcode project needs no generator or third-party runtime to open/run. Local `.xcresult` bundles contain logs and retained screenshots; selected images above are committed for reviewers on other machines.

No physical iPhone or iPad was installed or tested. Frame pacing, memory/thermal/battery limits, hardware touch comfort, system document-provider behavior and comprehensive accessibility still require device testing. There is no human full-campaign duration/balance certification, final painted-art approval, complete production audio/activity animation, signed archive/TestFlight build, App Store Connect submission or App Review approval. See [release requirements](RELEASE.md).
