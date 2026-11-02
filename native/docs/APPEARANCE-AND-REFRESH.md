# Appearance and device refresh — 1.0.0 (9)

The device inventory showed Harbour QA build 8 on iPhone Duo and build 7 on Ambrogio 17bis. This pass builds the same build-9 QA client for both, retaining the bundle identifier and app data. Settings now displays the installed app name/version near the top to make it easy to distinguish QA updates. The build-8 viewport framing remains included.

Appearance offers System (default), Light and Dark. The choice persists in UserDefaults independently of town saves. UI/persistence-test preferences use an isolated key. System delegates to the device appearance; unknown values fall back to System. Sheets and native controls inherit the selected appearance.

Dark mode adapts paper, cards, text, muted text, accent links and selection backgrounds. Filled actions use a separate colour to keep white text legible. The map receives a noninteractive, accessibility-hidden blue shade below its goal overlay. This softly reduces glare without recreating the SpriteKit scene, moving the camera, changing hit testing or touching the economy. It is not a painted night scene, day/night simulation or new lighting system.

Verification covers text/background contrast in both palettes, appearance persistence across app relaunch, Light/System restoration, map/navigation, save recovery and the existing gameplay suite. Actual dark map/settings screenshots are reviewed. A recovery UI check needed shorter scroll gestures inside the centred Settings sheet after the new section changed its height; its recovery assertions remain intact. Final counts and installation/launch results are recorded in PR #14 and local `.artifacts/appearance-build9/`.

The [longer-game proposal](GAMEPLAY-NEXT-STEPS.md) is a separate design deliverable grounded in the current catalog, five chapters and earned campaign replays. No proposed project or reward is represented as implemented.
