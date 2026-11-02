# Device-feedback improvement pass · 1.0.0 (5)

This pass addresses confusing repeated taps, clumsy navigation, unclear next tasks, the missing guide/inhabitants, boat art and camera range. The deployed browser game and its original economy are unchanged.

## Interaction and guidance

Elena’s persistent Next step card is derived from the authoritative engine and current action registry. It routes to actual production, trade, construction, contracts, waterfront, market, inland, fleet, neighbourhood, residents and ferry work. Missing goods lead to an available upstream recipe where possible; existing incoming production is counted. Choices remain choices. Guidance changes after actions and completed work, while the current chapter remains visible for context.

The focused panel removes action search and availability filters, shows relevant actions and goal supplies, explains waiting, and offers Resume when paused. Browse all activities remains available. Production, Trade and Build can be switched inside the phone sheet; Map remains a direct return. Successful action feedback and a 650 ms shared cooldown prevent repeated taps from spending twice or triggering a different action newly placed under the same finger. Legitimate repeated batches work after the cooldown. The engine still revalidates every transaction.

Building selection covers the roof as well as the centre. Pans and pinches must fail before a tap can select; additional taps cannot reopen panels during modal navigation. The searchable Sites directory remains the accessible alternative.

## Living town and view

Eight new transparent assets add Elena, farmer, docker, vendor, cutter, coaster and an upgraded version of each hull. Boats on the map and fleet cards use the actual owned type and upgrade state. Decorative coastal traffic uses the same art family. People appear along routes near the opening workshops, quay, developed market and homes. Animation is restrained translation/facing/bobbing, pauses with the town, and becomes static with Reduced Motion. These are decorative residents; no extra workers, wages or resource generation have been added.

Whole town is available directly in the map toolbar. The fitted view adds coastal margins, maximum manual zoom scale increases from 8 to 16, and pan bounds extend from 1800×2700 to 2400×3400. The original 1800×2700 terrain and saved building coordinates remain intact: this is a larger navigable view, not additional buildable land. Camera preference version 2 accepts version 1 for migration; economic saves remain native version 1 / browser version 13.

## Verification

Test towns are isolated from player saves. No App Store upload is part of this pass.

| Check | Result and scope |
| --- | --- |
| iPhone 17 Pro Max simulator, iOS 26.5 | Final source: 49/49 tests (36 native + 13 UI), zero runtime warnings. `/tmp/lh-feedback-phone-final.xcresult`. |
| iPad Pro 13-inch M5 simulator, iPadOS 26.5 | 49/49 at `a32cc80`, before the final queued-supply explanation and phone-only labelled navigation refinement. `/tmp/lh-feedback-ipad-reboot.xcresult`. |
| Browser regression suite | 207/207; browser implementation and deployment unchanged. |
| Native adapter and guidance | 11/11; 290 transactions per runtime match the original engine; 1,322 guidance snapshots checked across earned campaigns. |
| Earned campaigns | Both five-chapter paths complete: 1,252 player actions and 70 save/reload checkpoints. Actual JavaScriptCore replay also runs in native tests. |
| Packaged artwork | 120 state textures, terrain, 24 resource icons and 8 new character/fleet textures pass geometry and source/output hash checks. |
| Device build | Signed Debug QA build 1.0.0 (5), signature verified; unsigned Release device build also compiles. Neither is an App Store submission. |
| iPhone Duo simulator, iOS 27.1 | Not verified: simulator system shell failed before the test runner launched (`NSPOSIXErrorDomain 64`, host down). No Duo simulator pass is claimed. |

The first iPad run exposed two matching Whole town buttons in the test query; distinct identifiers fixed it. A subsequent simulator stopped responding to rotation; restarting that simulator restored rotation and the full suite passed. A camera test also needed a 0.01-world-unit tolerance for SpriteKit floating-point rounding. Phone screen review caught icon-only activity navigation and a UIKit toolbar warning; replacing that toolbar with a labelled SwiftUI bottom inset removed the warning, verified by the final 49-test run.

Final phone and iPad screenshots were reviewed, including Elena’s focused task, townspeople, whole-town framing, distinct boats, large text and landscape. Local selected captures and the installation receipt live in `.artifacts/feedback-build5/` (not versioned). Source atlas/prompt provenance is in `../art-source/living-harbour-v1/README.md`.

Build 5 was installed as an update to the existing Harbour QA identity on both paired iPhones, without deleting their app containers. The 17bis connection initially failed, then retry installation and launch succeeded. The Duo installation succeeded; launch was denied because the phone was locked. Open Harbour QA after unlocking. This verifies installation, not a hands-on gameplay/performance acceptance pass.

GitHub run [41378935655](https://github.com/ambrogio5/littleharbour/actions/runs/41378935655) passed adapter and simulator jobs at `a32cc80`. The final follow-up changes have a separate PR check; see PR #14 for its current status rather than treating the earlier green run as validation of a later commit.

## Limits before release

This build still needs hands-on phone/iPad acceptance, particularly sustained play, touch feel, performance, interruptions and VoiceOver with a person. Automated checks establish correctness and reachability, not enjoyment or pacing. The guide supports the existing milestones but is not a general planner for every optional redevelopment or unusual reservation arrangement; the full action panels and project plans remain available.

The people use single-frame painted sprites, not skeletal or multi-frame walking animations. Sail refits and hull upgrades share one upgraded appearance per boat type. Existing building-art reuse remains as documented in the painted-art provenance. This version remains English-only and silent. Final distribution signing, owner details/privacy URL, store metadata/ratings/regions and App Store review remain release requirements.
