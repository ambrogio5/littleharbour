# Architecture and repository audit

Baseline inspected: `ambrogio5/littleharbour` main `5bb5bdc`, including merged PRs 10–12, not just the older checkout. Read the referenced Mac Work Session Status conversation; it confirms the Mediterranean whole-map quality target and distinguishes existing vector improvements from final painted assets. The original approved mockup image was not attached to that retrieved conversation; the committed playable visual preview and its terrain/building assets are the reproducible visual reference available here.

## Existing repository

| Area | Actual systems and port treatment |
| --- | --- |
| `dist/catalog.js`, `dist/engine.js` | Entire economy: 24 recipes, queues/refunds/priorities, harvest/replant, targets, construction, refits, specialisation, contracts, charter, focus bonuses, trade, restoration, market demand/auto supply, inland crops/kiln/preserves, fleet, circuits, visits, coastal projects/commissions, neighbourhood, furnishing/moves/redevelopment, residents, ferry, reservations and schemas 1–13. Bundled unchanged. |
| `dist/progression.js`, `world-guide.js` | Five-chapter objective retained through `currentObjective`. Browser-only routing replaced by native activity selection. |
| `dist/planning.js`, `project-planning.js`, `project-ui.js` | Dependency-aware production planning and reservation-aware queueing retained. Native automation exposes per-recipe targets. Browser UI target-preset slots and pinned-goal persistence are presentation features not yet transferred. |
| `dist/world-model.js`, `districts.js`, `world-map.js`, `world-art.js` | Authoritative world geometry/state, districts and camera behavior inspected. Native entities use shared positions and saved phases, with separate boatyard/estate positions so charter-owned specialists can coexist. UIKit camera gestures replace browser pointer handlers. |
| `dist/lab/` | Latest playable whole-map premium architecture and Living Harbour experiment. Pure `evolution.js` bundled; successful engine actions drive the same trade/nature/community/craft effects. DOM/localStorage bridge replaced by atomic native envelope. |
| `dist/app.js`, `lab/app-v2.js`, `v2-ui.js`, `ui-renderer.js`, HTML/CSS, neighbourhood/fleet/ferry/coast/inland/project UI | Existing controls and prerequisites audited; native descriptors and SwiftUI replace templates, DOM, dialogs and navigation. No embedded HTML or WebView. |
| `dist/scene.js`, boat/ferry art, old district images | Activity and visual routes inspected. New SpriteKit nodes provide state-driven boats, layered terrain, structures, ornaments and selection. Detailed worker/smoke/wheel animation parity is not yet complete. Earlier collage photographs are not combined into district panels. |
| `dist/save-store.js`, `demo-town.js` | Exact-byte save protection, validation and independent sample semantics retained in native design. Existing sample supports test fixtures; ordinary launch always opens the player's native town or a fresh town. |
| Tests, scripts, docs and workflows | Existing 207 regression tests, browser interaction tests, packaging and deployment examined/run. Existing long-term roadmap describes unimplemented campaign/balance/art goals; these are not represented as shipped features. Native files are additive; Pages still publishes only `dist/`. |

## Rendering decision

Use **SwiftUI + SpriteKit**, with a small `SKView` representable for camera gestures. SwiftUI handles adaptive sheets/inspector, Dynamic Type, native buttons/menus, accessibility, document import and sharing. SpriteKit handles GPU-rendered independent textured layers, depth ordering and touch coordinates. This fits an authored 2.5D map with tens of sites; custom Metal would add substantial rendering/resource/lifecycle code without measured evidence of a benefit. Pure SwiftUI Canvas would require more custom hit testing/camera infrastructure and would not provide the same scene graph. A full SceneKit/RealityKit 3D conversion would require an entirely different model/lighting asset pipeline and would not preserve the approved composition.

SpriteKit integrates with SwiftUI and provides Apple's 2D rendering framework: [SpriteKit](https://developer.apple.com/documentation/spritekit), [SpriteView](https://developer.apple.com/documentation/spritekit/spriteview). We use SKView directly to control gesture recognition and lifecycle precisely. No custom Metal shader or claim of measured physical GPU performance is made.

The authoritative simulation remains **JavaScript**, executed locally by Apple's [JavaScriptCore](https://developer.apple.com/documentation/javascriptcore). This is deliberately not described as a Swift rewrite. Reusing it preserves the actual economy, action validation, captured paid voyage rewards, queue durations, save migration and all existing tests. Swift decodes typed presentation snapshots and invokes an allowlisted action identifier; it never evaluates imported save data as executable code. No remote scripts or browser runtime are used.

`native/bridge.js` creates descriptors by trying original engine actions on detached copies. Actual actions look up a fresh descriptor, mutate a transaction copy, validate it with `parseSave`, then publish the town and evolution together. Stale construction, stage and order identifiers cannot spend twice. Reservations and project plans reuse the original engine. Tick uses the original simulation, including its intentional pause/no-offline semantics.

`EngineRuntime` confines JavaScriptCore to the main actor and checks exceptions at each call. `GameStore` owns lifecycle, snapshots and saving. `SaveRepository` is a narrow filesystem boundary with atomic writes, verified backups and unexpected-write detection. CPU work remains on the main actor at this scene size; physical profiling may justify moving the runtime to a dedicated actor later.

## Graphics pipeline

The existing whole-map SVG is rasterized once at build-authoring time. The current terrain raster is clipped to its authored coastline, with the same roads, retaining walls, sunlight, trees and sea. Buildings are exported independently, with transparent backgrounds and a shared anchor; excavation, scaffolded work, completed structures, upgraded architecture and ripe crops remain distinct textures. World state selects textures, never a single baked town screenshot.

The 120 textures are 24 kinds × five visual variants; not every kind has an economic upgrade or ripe state. Redundant variants ensure a total lookup across site states and avoid missing-resource fallback. Engine refits, furnished homes and progressive waterfront/lighthouse/ferry stages select visibly upgraded artwork; purchased or unbuilt plots are not drawn as completed houses. Most state variants reuse the repository's detailed SVG architecture; this is not a new hand-painted sprite collection.

A single terrain texture is about 19 MB decoded (1800×2700×4), before GPU overhead. Each 384×384 sprite is about 0.56 MB decoded. Textures are cached on demand. Render rate is capped at 30 FPS; the economic interface refreshes at most twice per second. No physical memory, thermal, battery, frame-rate or oldest-device budget is certified yet. Atlas packing, texture compression and terrain tiling should follow real profiling, not a speculative engine replacement.

## Accessibility and interaction

Native text uses semantic font sizes; management content scrolls. Controls provide named labels, disabled-state explanations and generally at least 44-point touch areas. Explore and Sites provide alternatives to pan, pinch and tiny world objects. VoiceOver receives action-result announcements. Reduce Motion suppresses moving voyage sprites. Map labels are decorative; the Sites menu is the authoritative accessible building list. Full VoiceOver, Switch Control, contrast and extreme Dynamic Type audits on devices remain release work.
