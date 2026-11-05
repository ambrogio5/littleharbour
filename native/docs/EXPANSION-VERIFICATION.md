# Expansion verification — build 15

Candidate evidence recorded on 5 November 2026. A successful local build does not imply App Store or human pacing acceptance. [PR #19](https://github.com/ambrogio5/littleharbour/pull/19) contains the integrated expansion; its Checks tab is the authority for the latest remote commit.

## Completed before final presentation pass

- Browser engine: 216 tests passed after the additive project-planning refactor.
- Native adapter: 42 tests passed (24 original adapter checks and 18 chronicle/city checks); 453 original-engine transactions matched the generated runtime.
- Core iPhone simulator tests: 52 passed, including earned JavaScriptCore continuations, save protection and coast isolation.
- Separate physical acceptance app on Ambrogio 17bis: 52 core tests passed. The owner QA save was not replaced or seeded with fixtures.
- The focused pinned-goal UI test previously passed on the reachable phone.

## Failures retained in the record

The first full phone run encountered a call indicator, black captures and a locked screen. It is not clean acceptance. The second run started after the owner reported the phone unlocked, idle and off-call. All 52 core tests passed; its UI run was interrupted when the owner left with the phones. Its recorded UI failures include the Fleet navigation test and later unavailable/missing UI elements; this is not a completed device pass.

The initial full simulator run had one Fleet navigation failure: the test tapped an offscreen activity without scrolling. The test now scrolls to a named activity surface. A new city test found a real portrait Goals entry bug: selection changed without presenting the inspector. That entry was fixed. The city flow subsequently passed, including selected City mode and rotation. The activity grid then exposed a test query that selected the background inspector scroll view; it now identifies the activity grid explicitly rather than changing geometry assertions.

The first expansion CI adapter job failed because the committed after-baseline carried the old generated-engine fingerprint. Regeneration changed only that fingerprint, not any economy measurement. Both baseline checks are now also part of the release script. The completed-town screenshot review caught a low-contrast goal button and two offshore civic landmarks; the button foreground and native presentation anchors were corrected without changing saves or economic coordinates. No final device installation or complete physical acceptance is claimed.

## Final evidence

Local environment: Xcode 27.2 (27B52), Swift 6.4.2; **iOS/iPadOS 26.5 simulator runtimes**, not 27.2 runtimes. Tests run sequentially on one large simulator at a time.

| Run | Result | Local result bundle |
| --- | --- | --- |
| Full iPhone 16 Pro, presentation pass | 77 passed: 52 core + 25 UI | `/tmp/lh-expansion-iphone-acceptance.xcresult` |
| Full iPad Pro 13-inch M5, distinct project missions | 78 passed: 53 core + 25 UI | `/tmp/lh-expansion-ipad-acceptance.xcresult` |
| iPhone final navigation/spacing/library regression | 58 passed: 53 core + 5 UI | `/tmp/lh-expansion-final-source-iphone.xcresult` |
| Final contrast and civic placement regression | 55 passed: 53 core + 2 UI | `/tmp/lh-expansion-visual-final.xcresult` |

The targeted iPhone run covers city boat selection, rotation, retained goals, bottom spacing, accessibility text and separate-coast persistence. It does not replace the two full runs. The final visual correction passed the core suite and city/goal UI flows; its screenshots were reviewed after the run. UI fixtures use test storage; none were imported into the owner’s QA town.

The signed development QA archive/export passed all 216 browser tests, 42 adapter checks, original-engine transaction parity, art manifests, all earned campaign continuations and both balance baselines. This is **Harbour QA 1.0.0 (15)**, identifier `com.ambrogio5.littleharbour.qa`, not a production App Store distribution. The final local IPA and exact source/hash record are retained in the ignored `.artifacts/native-build15/` directory. They contain development signing metadata and are not committed to the public repository. No upload or installation was performed after the owner left.

Reviewable screenshots are committed below. They are simulator captures of test towns, not App Store marketing claims or physical-device evidence.

- [Retained goal and landscape navigation](screenshots/build15-goal-landscape.png)
- [Individual city boat controls](screenshots/build15-city-boat.png)
- [Separate coast library](screenshots/build15-coast-library.png)
- [Completed civic town](screenshots/build15-completed-coast.png)
- [Projects and city partnership](screenshots/build15-projects.png)

Remote CI runs all 53 native core and 25 UI tests, plus the browser/adapter/campaign/art checks. Consult [PR #19 checks](https://github.com/ambrogio5/littleharbour/pull/19/checks) for the exact final commit; an older green run is not acceptance of a newer commit.

## Remaining non-automated gates

Human campaign pacing and late-game enjoyment; actual VoiceOver gestures; device interruption/recovery in ordinary use; prolonged thermals/battery/performance; final environment and animation art; production signing/App Store metadata, screenshots, privacy URL, ratings, rights review and owner-controlled submission. Duo and physical iPad were not available for this expansion's acceptance pass.
