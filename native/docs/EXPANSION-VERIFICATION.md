# Expansion verification — build 15

Work in progress on 5 November 2026. This record is updated with final runs before the expansion PR is marked ready. A successful local build does not imply App Store or human pacing acceptance.

## Completed before final presentation pass

- Browser engine: 216 tests passed after the additive project-planning refactor.
- Native adapter: 42 tests passed (24 original adapter checks and 18 chronicle/city checks); 453 original-engine transactions matched the generated runtime.
- Core iPhone simulator tests: 52 passed, including earned JavaScriptCore continuations, save protection and coast isolation.
- Separate physical acceptance app on Ambrogio 17bis: 52 core tests passed. The owner QA save was not replaced or seeded with fixtures.
- The focused pinned-goal UI test previously passed on the reachable phone.

## Failures retained in the record

The first full phone run encountered a call indicator, black captures and a locked screen. It is not clean acceptance. The second run started after the owner reported the phone unlocked, idle and off-call. All 52 core tests passed; its UI run was interrupted when the owner left with the phones. Its recorded UI failures include the Fleet navigation test and later unavailable/missing UI elements; this is not a completed device pass.

The initial full simulator run had one Fleet navigation failure: the test tapped an offscreen activity without scrolling. The test now scrolls to a named activity surface. A new city test found a real portrait Goals entry bug: selection changed without presenting the inspector. That entry was fixed. The city flow subsequently passed, including selected City mode and rotation. The activity grid then exposed a test query that selected the background inspector scroll view; it now identifies the activity grid explicitly rather than changing geometry assertions.

The final iPhone run, iPad run, archive and CI results are pending below. No device installation of the final source or final physical acceptance is claimed at this point.

## Final evidence

Pending final run completion.

## Remaining non-automated gates

Human campaign pacing and late-game enjoyment; actual VoiceOver gestures; device interruption/recovery in ordinary use; prolonged thermals/battery/performance; final environment and animation art; production signing/App Store metadata, screenshots, privacy URL, ratings, rights review and owner-controlled submission. Duo and physical iPad were not available for this expansion's acceptance pass.
