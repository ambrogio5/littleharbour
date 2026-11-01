# Verification record

Baseline: main `5bb5bdc` (the latest merged premium-building update when work started). The checkout was clean before creating the native branch. No tracked browser runtime, save schema, balance constant, browser test or Pages workflow was changed.

## Completed

- Existing Node regression suite: **207/207 passed**.
- Existing real Chromium smoke: protected malformed/empty/future saves; exact-byte recovery exports; construction states; small phone, phone, tablet and desktop layout/navigation/harvest/reload.
- Existing playable graphics-preview smoke: iPhone and iPad viewport checks passed for differentiated buildings, actual trade, construction, separate save namespace, camera and reload. These are browser viewport tests, not native or physical-device tests.
- Native adapter: **8/8 tests passed**, including **287** available economic transactions compared with the original engine. Browser schemas 1–13, native envelopes, paid voyage round trips, pause, malformed/future imports, exact project goal identifiers, reservations and generated-bundle execution without DOM/module APIs are covered.
- Bundle freshness: eight modules / approximately 140 KB; source SHA-256 manifest matches. Art: terrain and all **120** state textures match source hashes and expected dimensions.
- iOS Simulator Debug application compiled successfully.
- Unsigned Release generic-iOS device-architecture build succeeded. This verifies compilation/linking, not device installation, performance, archive signing or distribution.
- iPhone 18 Pro / iOS 27.0 simulator: **9 native engine/filesystem tests and 2 native UI tests passed** in the initial verified run. Native UI includes production/harvest, trade navigation, settings, zoom buttons and accessible site selection. Map and settings screenshots were exported from the test result and visually inspected.

## Current final matrix

Further iPhone/iPad, persistence, pinch/pan and landscape verification results are recorded here after the final run. Earlier interrupted or failing intermediate runs are not counted as successful verification. The first runs caught resource packaging, a boolean/text descriptor mismatch and nondeterministic evolution field ordering; those defects were fixed before the passing run above.

## Reproduce

Use the commands in [the native build instructions](../README.md). The native CI workflow checks bundle/art freshness and adapter tests on Linux, and builds/runs XCTest/XCUITest on an available macOS-hosted iPhone simulator. PR workflow completion must be checked independently; a local pass is not a claim that remote CI has finished.

Local result bundles are written outside the checkout under `/tmp/littleharbour-*.xcresult`. They contain test logs and retained screenshots. The repository keeps selected screenshots under this directory so review does not require the original workstation. Screenshot evidence represents a simulator, not a physical device.

## Not verified

- No physical iPhone/iPad was installed or tested. No measured device frame rate, memory/thermal/battery budget, hardware touch comfort or accessibility certification.
- No complete native campaign played by a human, calibrated 2.5-hour pacing claim, final painted-art approval, production audio or comprehensive late-game visual collision audit.
- No signed archive/TestFlight build, App Store Connect metadata, storefront submission or App Review approval.
- iOS 17–25 runtimes and older Xcode versions are not installed/verified here. The deployment target is 17.0, but compilation with the current SDK is not equivalent to testing every supported OS.
