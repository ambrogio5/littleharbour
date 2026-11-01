# Little Harbour for iPhone and iPad

A working native client of the existing game, with SwiftUI controls, a SpriteKit world and the shipped simulation running locally in JavaScriptCore. **Version 1.0.0 (build 4) is prepared as a free-release candidate. Physical-device testing and App Store submission remain pending.** No web view, remote engine, analytics, account, purchases or third-party runtime dependencies are used.

## Build and run

1. Open `native/LittleHarbour.xcodeproj` in Xcode. The project and shared scheme are committed; **XcodeGen is not required to open or build it**.
2. Select the **LittleHarbour** scheme and an installed iPhone or iPad simulator, then Run.
3. For a physical device, add your Apple Developer account in Xcode → Settings → Accounts, then select your own Apple development team under Signing & Capabilities, choose a unique bundle identifier if necessary, connect the device, enable Developer Mode and Run. No signing identity or team is committed. `HARBOUR_BUNDLE_IDENTIFIER` and `HARBOUR_DISPLAY_NAME` build settings let you install an isolated QA copy without replacing the normal app.

Deployment target: iOS/iPadOS 17.0. Locally compiled using Xcode 27.1 / Swift 6.4 in Swift 5 language mode, with complete concurrency checking. The earlier client also compiled and passed its core tests in CI with Xcode 16.4 / iOS 18.5; release hardening includes fixes for UI failures that run exposed. See the verification record for final CI status. The project uses Apple frameworks only.

From the repository root:

```sh
xcodebuild -project native/LittleHarbour.xcodeproj -scheme LittleHarbour \
  -destination 'generic/platform=iOS Simulator' CODE_SIGNING_ALLOWED=NO build

xcrun simctl list devices available
# Substitute an installed simulator ID from the list.
xcodebuild -project native/LittleHarbour.xcodeproj -scheme LittleHarbour \
  -destination 'platform=iOS Simulator,id=SIMULATOR_UUID' \
  -parallel-testing-enabled NO CODE_SIGNING_ALLOWED=NO test

# Unsigned device-architecture compile; this does not run on a physical device.
xcodebuild -project native/LittleHarbour.xcodeproj -scheme LittleHarbour \
  -configuration Release -destination 'generic/platform=iOS' \
  CODE_SIGNING_ALLOWED=NO build
```

`LittleHarbourTests` runs the actual JavaScriptCore engine and native filesystem recovery tests. `LittleHarbourUITests` exercises native navigation, harvests, save/relaunch, map gestures, site selection and landscape layout. UI tests use a separate disposable application-support namespace, never the player's town. Tests that request `--ui-testing` reset their own in-memory town; persistence tests use `--persistence-testing` and explicitly reset only that namespace.

## Playing

Drag the map; pinch or use +/− to zoom. The map remembers your view between sessions. Manual pan/zoom survives rotation; a chosen district or Whole town refits to the new window size. Explore jumps between districts. Sites opens a searchable directory with each building’s artwork and construction state, including access with VoiceOver. Building labels can be hidden in Explore or Settings. Tap a building to open its current activity. On iPhone, activities open in a sheet; wider windows show an inspector beside the map. The threshold uses available window width, supporting iPad multitasking.

Production, Trade and Build stay on the bottom bar. Town opens the journal, contracts, fleet, neighbourhood and ferry directly. Grow the town groups waterfront, market, inland, lighthouse, destinations, residents and layout; Manage work groups queues, circuits, refits, automation and reservations. The active destination is highlighted. Activities show compact expandable inventory, progress, search, and All actions / Ready now filters. Selecting a production site scopes its recipes; clear the site or switch off Only this site to browse the full category. Unavailable actions explain their requirements. Successful actions give brief visual feedback and optional haptics. The chapter objective follows the existing progression engine. All costs, queues, rewards and unlocks use the original economy.

## Save transfer and recovery

Export a browser JSON town using the existing game's Settings. In the native app, open Settings → Import a town. The app validates the entire candidate before asking to replace the current town, then archives and verifies the current file before writing. Browser schema versions 1–13 migrate through the original `parseSave`; the browser source is unchanged.

Native exports contain `nativeVersion: 1`, the original version-13 town and a validated evolution snapshot in one atomic file. **Export for browser game** emits the ordinary town schema. Browser exports do not carry the graphics preview's separately stored Living Harbour history, camera settings, pinned goals or browser-only target presets. Importing a plain browser town starts a fresh evolution model while retaining its economy and paid work. There is no automatic/cloud synchronization.

The native slot is Application Support / LittleHarbour / `town.native.json`; browser storage is never read or written. Unknown, corrupt, empty and unreadable saves pause play and block automatic writes. Exact original bytes can be exported. Backups are visible in Settings and can be exported or reviewed for restoration. New backups are dated and shown newest first; older unnamed copies remain available. Start a new town uses the same explicit confirmation and exact-backup flow. Oversized damaged originals remain exportable, while imports are bounded to 150 KB before parsing. Backups are not automatically deleted. The first changed save after loading also preserves the pre-normalization bytes.

Checkpoints are every 15 active seconds, after actions and when leaving the foreground. Time pauses in the background and Settings, with no offline catch-up. Abrupt termination can lose progress since the last completed checkpoint. Atomic replacement protects against partial writes, not every filesystem/hardware failure. Native files have iOS data protection; use downloaded exports as independent backups. One process owns a town; unexpected external changes lock writes.

## Source and asset maintenance

```sh
# Regenerate the bundled engine after changing shared JS or native/bridge.js.
node native/scripts/bundle-engine.mjs
node native/scripts/bundle-engine.mjs --check
node --test native/scripts/bridge.test.mjs
node native/scripts/verify-art.mjs
npm test

# Optional deterministic painted-asset repacking: macOS + Swift/Xcode tools.
# Source atlases are committed; no generation service/API key is needed.
node native/scripts/build-art.mjs
node native/scripts/build-icon.mjs

# Only if modifying project structure/settings; requires XcodeGen.
xcodegen generate --spec native/project.yml
```

The deterministic bundler strips only the repository's supported named/namespace imports and exports, includes the original sources without changing their bodies, and records SHA-256 source hashes. A CI freshness check prevents silently shipping an outdated economy. Parity tests compare native adapter actions with the original module engine. Native save tests also execute the generated bundle in Apple's JavaScriptCore. `node native/scripts/campaign.mjs --check` earns both full five-chapter campaigns, verifies every action against the original browser engine, and checks the committed action traces. The native campaign test replays all 1,252 player actions and 70 save/reload checkpoints in JavaScriptCore without injected resources. These accelerated tests establish reachability and parity, not human pacing or enjoyment.

Art exports contain the current continuous 1800×2700 terrain and 120 transparent 384×384 textures, covering 24 kinds and five visual variants. A 320-unit world frame keeps anchors consistent. The manifest checks source and packed-output hashes and dimensions. A separate painted olive tree supports town evolution. Twenty-four transparent resource icons cover every economic good plus coins; [source and prompt](art-source/resources-v1/README.md) are committed. Every site remains its own SpriteKit node, ordered by world depth. Both specialist workshops remain visible after the charter; purchased neighbourhood plots retain their actual saved locations and furnishings. The painted source atlases, prompts, state reuse and registration details are documented in [painted art provenance](art-source/painted-v2/README.md).

See [the graphics and UX improvement report](docs/GRAPHICS-UX.md), [architecture and repository audit](docs/ARCHITECTURE.md), [verification](docs/VERIFICATION.md) and [release requirements](docs/RELEASE.md).

## Review order

[PR #13](https://github.com/ambrogio5/littleharbour/pull/13) contains the engine/art foundation. [PR #14](https://github.com/ambrogio5/littleharbour/pull/14) contains this client and is stacked on the foundation branch. Review/merge the foundation first, then retarget the client to main. Neither PR is automatically merged or deployed by this work.

## Preparing a local release archive

The release target is a **free App Store download**, without advertising or in-app purchases. Device testing is deferred until the owner makes a test device available.

Build 4 adds painted resource icons, illustrated district/activity navigation, a more compact chapter card, collision-aware map labels, boat wakes and direct camera focus for selected sites. The earlier save protections and earned campaign replays remain intact. Read [release polish](docs/RELEASE-POLISH.md) and [release hardening verification](docs/RELEASE-HARDENING.md) for evidence and remaining gates. Version 1.0 has no sound.

The local helper runs engine/art/campaign checks, archives and exports. It never uploads or submits anything. Configure the owner’s actual identifier and team; the example values below are placeholders:

```sh
HARBOUR_TEAM_ID=YOUR_TEAM_ID \
HARBOUR_APP_ID=com.yourcompany.littleharbour.qa \
HARBOUR_RELEASE_KIND=qa \
bash native/scripts/release-build.sh
```

Use `HARBOUR_RELEASE_KIND=store` with the production identifier for an App Store Connect export. The account must have the necessary distribution credentials and provisioning permissions. The script writes under `.artifacts/native-release` (ignored by Git); `HARBOUR_OUTPUT` can select another folder. Export requires valid profiles; a successful signed archive alone does not prove that it can be installed on every device or accepted by App Store Connect.

[Release metadata and TestFlight notes](release/APP-STORE-METADATA.md) are prepared for review. The in-app privacy policy is bundled in `LittleHarbour/Resources/Privacy-policy.txt`; a permanent published URL and final owner details remain submission requirements.
