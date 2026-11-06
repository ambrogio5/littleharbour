# Sheltered Bay — build 18

The owner selected concept A on 6 November 2026. This is its first playable implementation, focused on a connected working waterfront and a coherent replacement for the previous strip map. It keeps the existing painted buildings and real game systems. It is not a claim that the concept illustration is already reproduced at final production quality.

## What changes

A single building-free landscape supplies a curved limestone quay, shared market paving, stepped village ground, stream, farmland, open harbour mouth and lighthouse platform. Six exact adjoining terrain tiles replace the old centre/surround blend. No gameplay buildings or boats are baked into the new terrain.

`BayLayout` registers each canonical site ID to a ground-contact anchor. The bakery, market, warehouse/quay, boatyard and ferry face connected paving. Six neighbourhood plots retain their original ownership and types. All eight chronicle projects, the third market and berth, specialist workshops and agricultural plots remain independently selectable and retain their real unbuilt/construction/built/upgraded artwork. Unbuilt markers are quieter; completed sites receive separate working-yard props. Painted village lanes and stairs connect the terraces; completed plots receive independent yard props. Existing scenery no longer adds decorative lookalike shops and boats to the harbour.

Three berth positions and southbound/returning boat paths stay within open water and west of the breakwater. Directional hull art is selected for the new direction, keeping masts upright; wakes follow the travel tangent. People use the new ground paths and continue to respect pause and Reduce Motion.

Close-view paving and transparent cargo, fishing gear, benches and timber add independent detail. Small props disappear at overview scale. District labels replace most individual labels when zoomed out; selection retains its own label. The closest camera scale changes from 0.65 to 0.5. A landscape Expand map control temporarily hides the inspector and objective banner; Sites, Goals and activity controls remain available, and site selection opens its activity sheet.

## Persistence and compatibility

This is presentation-only. The canonical JavaScript world coordinates, economy, native save envelope, browser export and deployed browser game are unchanged. `MapViewport` version 4 stores the new camera. Versions 1–3 are read safely and recentered by district once; obsolete free-camera coordinates recenter on the opening district or harbour. Valid version-4 custom cameras restore normally, including paused towns and per-coast preferences. Town save bytes remain identical across map changes. No new gameplay costs or balance changes.

## Art and rendering

Generated sources, approved reference and prompt record live in `native/art-source/sheltered-bay-v1`. `swift native/scripts/pack-bay-art.swift` deterministically crops terrain tiles and prop cells and packages the paving; it makes no model call. `node native/scripts/verify-art.mjs` validates source/output hashes, tile sizes and prop alpha. Xcode builds from committed PNGs and project files.

The source terrain is 1536×1024, displayed in a 3840×2560 world. Tiling retains source pixels; it does **not** invent additional resolution. Close-view paving is a separate generated material with feathered edges; four separately packaged props preserve their generated alpha. Existing building art remains 384px and retains its original state-family reuse, including small annexes painted into some upgrade textures. Seasonal and partner dressing now uses independent props instead of miniature buildings. Hills, vegetation and water away from the detailed quay can still soften at maximum zoom. A future final-art pass can replace individual terrain tiles and building families without changing game IDs or saves. No camera rotation or fully modelled 3D architecture is claimed.

The viewport is bounded to authored ground; depending on device aspect ratio, Whole town may require panning to see the full north/south extent. This avoids showing a rectangular terrain edge over blank water. Final hardware memory, thermal, frame-pacing and touch-comfort acceptance remain required.

## Verification

Presentation checks cover every earned-town site remaining selectable, canonical save-byte preservation, camera migration/restoration/clamping, open-water boat lanes and return positions, construction/state texture distinctions, pause and Reduce Motion. The new UI journey covers the full-width landscape harbour, searchable bakery selection and close view, and overview navigation. Existing native, browser and adapter suites remain required. See the PR for the exact final commit, results and screenshots; an intermediate test run is not final acceptance.

Visual review also removed flat procedural lane/slipway overlays that crossed painted retaining walls; the authored paths and independent dock sprites supply those connections.

The first local UI check could not find the bakery below the visible portion of the landscape site list. The journey now uses the real directory search before selecting it. No gameplay assertion was removed. No owner-device installation, merge, browser deployment or App Store submission is part of this map change.
