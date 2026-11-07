# Little Harbour for iPhone and iPad

A working native client of the existing game, with SwiftUI controls, a SpriteKit world and the shipped simulation running locally in JavaScriptCore. **Version 1.0.0 (build 20) adds live task-voyage checklists, direct workshop links in supply plans, and a Harbour now overview. Build 19 makes the exact next task visible and actionable. Build 18 introduced the approved Sheltered Bay map: continuous quay terrain, registered neighbourhoods, separate close-view detail, open-water boat lanes and an expandable landscape map. Build 17 adds the approved harbour crews. Build 16 improves production stability, shared stock targets and consolidated building plans. Build 15 added the optional harbour year, persistent goals, five partners, eight branching civic projects, isolated coast saves, and the Porto Grande glaze/ceramics route. It retains the approved long-play economy, inline Keep 24, per-boat missions, dark appearance and compact bottom spacing. This is a QA candidate; human pacing and final release acceptance remain open.** No web view, remote engine, analytics, account, purchases or third-party runtime dependencies are used.

See [the three workflow improvements](docs/HARBOUR-WORKFLOW.md) for behavior and compatibility details.

## Build and run

1. Open `native/LittleHarbour.xcodeproj` in Xcode. The project and shared scheme are committed; **XcodeGen is not required to open or build it**.
2. Select the **LittleHarbour** scheme and an installed iPhone or iPad simulator, then Run.
3. For a physical device, add your Apple Developer account in Xcode → Settings → Accounts, then select your own Apple development team under Signing & Capabilities, choose a unique bundle identifier if necessary, connect the device, enable Developer Mode and Run. No signing identity or team is committed. `HARBOUR_BUNDLE_IDENTIFIER` and `HARBOUR_DISPLAY_NAME` build settings let you install an isolated QA copy without replacing the normal app.

Deployment target: iOS/iPadOS 17.0. Locally compiled using Xcode 27.2 (27B52) / Swift 6.4 in Swift 5 language mode, with complete concurrency checking. The earlier client also compiled and passed its core tests in CI with Xcode 16.4 / iOS 18.5; release hardening includes fixes for UI failures that run exposed. See the verification record for final CI status. The project uses Apple frameworks only.

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

Build 18: use **Explore → Home harbour** to see the new bay, **Expand map** in landscape to hide the activity panel, and **Sites** to find any real building. The plus button and pinch gesture reach a closer view. Old camera preferences recenter once by district; town saves, purchases, production and crew assignments are unchanged. See [Sheltered Bay implementation and limits](docs/SHELTERED-BAY.md).

Build 17: completing the **harbour school** unlocks the School team; completing the **regatta** unlocks the Regatta team. Expand **Harbour crews** inside a workshop or the selected boat to assign help, or use **Goals → People → Harbour crews**. Each team helps one workplace, with 25% extra work per game second (about 20% shorter completion time), unchanged supplies and rewards. Teams do not stack. Both old and new workplaces must be idle before moving a team; clear workshop queues or stop repeat sailings as needed. The decorating bench also accepts a team. Goals links to the relevant production bottleneck, and displayed batch/voyage times include assigned help. Team assignments persist in native save version 5; build 16 and older protect these saves instead of opening them. Browser copies omit crews and their speed benefit, retaining legitimately earned progress. See [the crew design and verification](docs/HARBOUR-CREWS.md).

Build 16: **Build** gathers workplaces, harbour/coastal works, homes, boat equipment, workshop refits and civic construction. Search a building or expand its section to review existing costs. **Production → Stock targets** shows every unlocked recipe in catalog order; set Off/Keep 6/12/24 individually or apply one target to all unlocked recipes (including recipes hidden by your search). Automation still uses normal ingredients and queue capacity. Bulk changes are atomic, do not spend or start batches themselves, and use the existing save versions. **Make** keeps recipes in place when queues and stock change. Feedback overlays the page instead of resizing it; readiness text reserves space, and accepted requests no longer jump ahead of other offers. Goal cards separate the intended outcome, the next action and the required supplies; civic projects show their ordered stages.


Use **Goals** on the map to keep a next step pinned while browsing workshops or boats. After the first festival, choose **Begin the harbour year**. **Today** holds three optional requests; **Projects** shows the next two civic possibilities and, after the harbour school, the city partnership; **People** holds partner work and new dated memories. Accepted requests never expire. Reserve supplies and use Plan to queue real workshop batches. Boats still depart individually from Fleet. **Choose a city boat** opens its City mission controls.

New coasts live in separate save slots under Settings → Town identity & coast library. Switching does not advance other towns. Export a native save for a complete backup: browser exports intentionally omit the native expansion and explain refunds/omissions before sharing. See [the expansion design and verification](docs/HARBOUR-YEAR-EXPANSION.md).

The town starts as Porto Lume and can be renamed in Settings → Town identity & coast library, and the native destination is Olive Island. Elena speaks alongside the next practical action. Completed chapters have a dismissible celebration and remain in Town → Town journal. Memories are derived from the save: retained evolution decisions show their saved season; chapter completions and the current residents/town-direction choices are marked undated where no timestamp exists. Importing or reopening an established town does not replay old celebrations. See [story voice and evidence limits](docs/STORY-VOICE.md).

Drag the map; pinch or use +/− to zoom. The map remembers your view between sessions. Manual pan/zoom survives rotation; a chosen district or Whole town refits to the new window size. Whole town fits the town in one tap. Painted hills, olive groves and open sea extend beyond its original frame; camera limits keep the visible view within the new scenery. This expands the view, not the economic/buildable land. Existing camera preferences migrate separately from town saves. Explore jumps between districts. Sites opens a searchable directory with each building’s artwork and construction state, including access with VoiceOver. Building labels can be hidden in Explore or Settings. Tap a building to open its current activity. On iPhone, activities open in a sheet; wider windows show an inspector beside the map. The threshold uses available window width, supporting iPad multitasking.

Elena’s Next step card opens a focused view of the next real action, relevant choices or work in progress. Guidance follows the current town and existing queues; it never spends automatically. The full activity list remains available. Paused guidance offers a Resume button.

Production, Trade and Build stay on the bottom bar and are also available inside the iPhone activity sheet. Town opens the journal, contracts, fleet, neighbourhood and ferry directly. Grow the town groups waterfront, market, inland, lighthouse, destinations, residents and layout; Manage work groups queues, refits and reservations. Automation targets (Off, Keep 6, Keep 12, Keep 24) sit beside each production recipe. Keep 24 increases the stock buffer, not the workshop’s queue capacity. Fleet starts with a boat selector, then a mission type, destination and cargo size; only the reviewed mission is displayed. Repeat routes and upgrades belong to the selected boat. The active destination is highlighted. Activities show compact expandable inventory, progress, search, and All actions / Ready now filters. Selecting a production site scopes its recipes; clear the site or switch off Only this site to browse the full category. Unavailable actions explain their requirements. Successful actions give brief visual feedback and optional haptics. A short shared cooldown prevents a repeated tap from queuing twice or activating a newly revealed next action beneath the same finger. Town ambitions exposes three optional directions: coastal development and commissions, civic projects and local orders, or automation and workshop refits. Each tracks saved milestones and links to its next action; later milestones repeat using the existing orders. The ambitions remain available alongside Chapter 6, Harbour Festival. Finishing the original five chapters and returning from a passenger service unlocks the festival in Town and on the courtyard. Prepare the site, choose a food fair or craft exhibition, supply it with real goods, complete two passenger returns from each coast, then fund the opening. The courtyard keeps its decorations; the journal records your theme; two festival requests offer a choice of work and coin rewards. Elena follows these stages and helps with missing ingredients. Existing production, trade, boats and reservations remain the original economy; festival contributions and rewards are a validated native extension.

Settings → Appearance offers System, Light and Dark. The preference stays on this device across launches and does not alter your town. Dark mode uses a high-contrast panel palette and gently dims the painted world; it does not add a simulated day/night cycle. The installed version is shown near the top of Settings to distinguish QA updates.

See [the festival implementation and checks](docs/HARBOUR-FESTIVAL.md). Coastal restoration and shipwright projects in the [gameplay roadmap](docs/GAMEPLAY-NEXT-STEPS.md) remain proposals, and a [whole-game review](docs/GAME-REVIEW.md) collects gameplay, story, interface and graphics findings with a suggested order of work. Festival pacing still needs human playtesting.

## Save transfer and recovery

Export a browser JSON town using the existing game's Settings. In the native app, open Settings → Import a town. The app validates the entire candidate before asking to replace the current town, then archives and verifies the current file before writing. Browser schema versions 1–13 migrate to shared schema 14 through `parseSave`; schema 14 also loads directly. The shared browser engine and controls include the same approved investments.

Native exports contain the shared version-14 town and a validated evolution snapshot in one atomic file. Saves use `nativeVersion: 1` normally, version 2 for Keep 24, version 3 once festival preparation is paid, or version 4 when native goals, identity, reservations or the harbour year are used. Version 5 is used after the first crew assignment and validates assignments inside that chronicle. Ordinary towns without crews retain their existing version. Versions 1–4 load without assigning teams automatically. Version 4 validates the complete chronicle and city extension alongside the town, festival and stock targets. Versions 1–3 load without losing existing work; older apps protect unsupported saves rather than overwriting them. **Export for updated browser** emits the ordinary town schema. Browser exports retain the deployed browser’s maximum target of 12, clearly disclosed beside Export when Keep 24 is active. Browser exports omit native festival progress, decorations and requests; contributed goods stay spent. A browser round trip cannot restore the festival, so keep a native export. Exporting changes neither the live native target nor festival progress. Browser exports do not carry the graphics preview's separately stored Living Harbour history, camera settings, pinned goals or browser-only target presets. Importing a plain browser town starts a fresh evolution model while retaining its economy and paid work. The deployed older browser cannot import schema 14. Settings explains this and offers a schema-13 export only before new investments, yield credits or reservations make it lossy. Keep the native backup to retain festival and Keep 24 state. There is no automatic/cloud synchronization.

The native slot is Application Support / LittleHarbour / `town.native.json`; browser storage is never read or written. Unknown, corrupt, empty and unreadable saves pause play and block automatic writes. Exact original bytes can be exported. Backups are visible in Settings and can be exported or reviewed for restoration. New backups are dated and shown newest first; older unnamed copies remain available. Start a new town uses the same explicit confirmation and exact-backup flow. Oversized damaged originals remain exportable, while imports are bounded to 150 KB before parsing. Backups are not automatically deleted. The first changed save after loading also preserves the pre-normalization bytes.

Checkpoints are every 15 active seconds, after actions and when leaving the foreground. Time pauses in the background and Settings, with no offline catch-up. Abrupt termination can lose progress since the last completed checkpoint. Atomic replacement protects against partial writes, not every filesystem/hardware failure. Native files have iOS data protection; use downloaded exports as independent backups. One process owns a town; unexpected external changes lock writes.

## Source and asset maintenance

```sh
# Regenerate the bundled engine after changing shared JS or native/bridge.js.
node native/scripts/bundle-engine.mjs
node native/scripts/bundle-engine.mjs --check
node --test native/scripts/bridge.test.mjs
node native/scripts/verify-art.mjs
node native/scripts/campaign.mjs --check
node native/scripts/festival-campaign.mjs --check
npm test

# Optional deterministic painted-asset repacking: macOS + Swift/Xcode tools.
# Source atlases are committed; no generation service/API key is needed.
node native/scripts/build-art.mjs
node native/scripts/build-icon.mjs

# Only if modifying project structure/settings; requires XcodeGen.
xcodegen generate --spec native/project.yml
```

The deterministic bundler strips only the repository's supported named/namespace imports and exports, includes the original sources without changing their bodies, and records SHA-256 source hashes. A CI freshness check prevents silently shipping an outdated economy. Parity tests compare native adapter actions with the original module engine. Native save tests also execute the generated bundle in Apple's JavaScriptCore. `node native/scripts/campaign.mjs --check` earns both full five-chapter campaigns, verifies every action against the original browser engine, and checks the committed action traces. The native campaign test replays all 1,252 player actions and 70 save/reload checkpoints in JavaScriptCore without injected resources. Two additional festival traces replay 335 earned actions and 26 reload checkpoints across the food and craft branches. These accelerated tests establish reachability and parity, not human pacing or enjoyment.

Art exports contain the original continuous 1800×2700 terrain, a generated 1536×1024 surrounding landscape ([prompts and registration](art-source/landscape-v1/README.md)), and 120 transparent 384×384 textures, covering 24 kinds and five visual variants. A 320-unit world frame keeps anchors consistent. The manifest checks source and packed-output hashes and dimensions. A separate painted olive tree supports town evolution. Twenty-four transparent resource icons cover every economic good plus coins; [source and prompt](art-source/resources-v1/README.md) are committed. Elena, three kinds of ambient townspeople and distinct base/upgraded cutter and coaster sprites extend this palette; [generation prompts and packaging](art-source/living-harbour-v1/README.md) are committed. People appear around developed sites, pause with the town, and remain still under Reduced Motion. They are cosmetic inhabitants, not additional simulated workers. Outbound and homebound views for both hulls and upgrade states keep bows facing along the journey and masts upright, with wakes trailing behind. Festival preparation posts, bunting and lanterns form a separate SpriteKit layer on the existing courtyard, combined with existing painted stalls and people; no new illustrated district is claimed. Every site remains its own SpriteKit node, ordered by world depth. Both specialist workshops remain visible after the charter; purchased neighbourhood plots retain their actual saved locations and furnishings. The painted source atlases, prompts, state reuse and registration details are documented in [painted art provenance](art-source/painted-v2/README.md).

See [the landscape and open-play report](docs/LANDSCAPE-AND-OPEN-PLAY.md), [the device-feedback improvement report](docs/DEVICE-FEEDBACK.md), [the graphics and UX improvement report](docs/GRAPHICS-UX.md), [architecture and repository audit](docs/ARCHITECTURE.md), [verification](docs/VERIFICATION.md) and [release requirements](docs/RELEASE.md).

## Review order

[PR #13](https://github.com/ambrogio5/littleharbour/pull/13) contains the engine/art foundation. [PR #14](https://github.com/ambrogio5/littleharbour/pull/14) contains this client and is stacked on the foundation branch. Review/merge the foundation first, then retarget the client to main. The current build-15 expansion is [PR #19](https://github.com/ambrogio5/littleharbour/pull/19), based on `codex/native-ios` and including the unmerged build-14 prerequisite from [PR #18](https://github.com/ambrogio5/littleharbour/pull/18). Its description separates those review sections. No PR is automatically merged or deployed by this work.

## Preparing a local release archive

The release target is a **free App Store download**, without advertising or in-app purchases. Build 4 was installed on the owner’s iPhones and supplied the feedback for build 5. Installation and informal play are not a complete physical-device acceptance pass.

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

## Build 14 long-play increment

See [approved values, compatibility and verification](docs/LONG-PLAY-ECONOMY.md). After the lighthouse, open a workshop’s Advanced profiles or Town → Refits. The third market plot needs the courtyard and both original businesses; Town → Market selects one business with inline automation. The third berth needs the finished ferry, both developed destinations and two boats; choose Berth 3 in Fleet. Each boat keeps its own cargo/circuit/passenger mission. Optional ambitions point toward these investments.

The seven-increment [programme ledger](docs/LONG-PLAY-PROGRAMME.md) records the build-14 foundation and the implemented build-15 seasons, partner ladders, civic life, chronicle projects, coast library and city partnership. The approved balance is implemented; human pacing, full physical acceptance and the documented environment/animation art remain release gates.
