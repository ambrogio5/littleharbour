# Sheltered Bay source art

Generated with the built-in image generation tool after the owner selected proposal A. `approved-concept.png` is the selected planning illustration, not a runtime backdrop. `terrain.png` contains no functional buildings or boats. `props.png` contains four independent alpha clusters (cargo, fishing gear, bench/planters, shipbuilding timber). `paving.png` is a close-view limestone material. The original generations are retained without destructive edits.

`native/scripts/pack-bay-art.swift` crops six 512px terrain tiles from the 1536×1024 painting and four prop cells, and copies paving. It preserves source pixels and alpha, writes output hashes, and does not upscale the terrain or claim genuine 4K detail. Props and paving are cosmetic; only canonical site sprites can be selected or produce goods. The main scene remains SpriteKit with SwiftUI controls.

Summarized prompt intent and requested output dimensions are recorded in `prompts.json`. Generation did not honour the requested larger pixel dimensions; the implementation documents and validates actual dimensions instead. The source paintings are not proof of seamless tiling for arbitrary repetition; only the fixed, adjoining ground crops are used, and close-view paving is restricted to feathered overlays.
