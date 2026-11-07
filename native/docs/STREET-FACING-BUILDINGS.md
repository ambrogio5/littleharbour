# Street-facing buildings — build 21

Buildings now form staggered groups on the painted terraces, with opposing façades around the central approach. The main stairs remain clear. The quay, extra berth, fishing hut, ferry and lighthouse have revised ground contacts so they sit on the corresponding stonework rather than beyond it.

## Rendering contract

`BayLayout` owns each site's ground anchor, scale and left/right facing. Facing is tied to the stable site ID, so an empty plot, construction, a different business and an upgraded building all retain the same orientation. The third market uses its canonical market slot regardless of business identity.

These are existing painted 2.5D sprites with authored horizontal reflection and modest per-site scale changes, not new 3D models or arbitrary-angle artwork. No screen-space tilt is applied: vertical walls remain vertical. Labels and progress badges remain upright and readable. Shared contact shadows, decorative props, partner details, selection rings and touch bounds follow the site's placement. Draw order uses the ground contact rather than the sprite centre. Resident paths avoid the revised workshop fronts.

Engine coordinates, site IDs, costs, saves, boat routes and browser rendering are unchanged. The map bounds and viewport coordinate system are unchanged, so saved camera positions remain valid; viewport version stays at 4. Native app build is 21.

## Verification

- All 72 native unit tests passed, including all-site selection, ground-based depth, mirrored roof selection, stable facing through construction/upgrades/business changes, stair clearance and byte-identical saves after rendering.
- All 55 native bridge tests and 216 browser tests passed. Art, bundle, earned campaign and progression baseline checks passed in the release script.
- The landscape map flow checks Explore, the terrace view, site-directory search, opening the Bakery, returning to the expanded map, zoom and overview. Final iPhone 16 Pro and iPad Pro 13-inch M5 / iOS 26.5 runs passed. Screenshots were inspected at overview and close zoom.
- Signed Release archive/export and strict code-signature verification passed.
- Build 21 installed and launched on Duo. All 31 save files matched byte-for-byte before and after installation, before launch. No town reset or test fixture was applied to the real device.

The first local UI attempt remained in portrait because the simulator ignored orientation changes; a simulator restart restored rotation. The test now asserts landscape explicitly. The new Explore screenshot step also needed to scroll the short landscape list before selecting Neighbourhood. These setup/navigation issues were corrected before the successful run.

Physical installation and launch are verified; a full manual play session on Duo is not claimed. The existing artwork's baked lighting and two façade orientations remain limitations; freely rotated buildings would require separately painted views or 3D assets.

## Build and review

Generate with `xcodegen generate --spec native/project.yml`, open `native/LittleHarbour.xcodeproj`, and run the `LittleHarbour` scheme on an iOS 17+ simulator/device. Signed QA packaging uses `native/scripts/release-build.sh` with the owner's team ID and the separate QA bundle ID. No App Store submission, PR merge or browser deployment is performed.

Local evidence and the installable QA package are in `.artifacts/native-build21/`. That directory is ignored and contains private device-save backups; do not commit or upload it wholesale.
