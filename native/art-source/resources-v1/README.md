# Painted resource icons · v1

Created with the built-in ImageGen tool on 1 November 2026. `prompt.txt` is the exact final prompt; `atlas.png` is the unchanged generated transparent 4×6 atlas. No external image references were used. This extends the painted Mediterranean palette already used by the terrain and buildings.

The 24 icons cover all 23 economic goods plus coins. They are decorative companions to text and counts, never the sole indication of a resource. VoiceOver reads the existing resource labels; decorative images are hidden from accessibility.

`native/scripts/pack-resource-art.swift` extracts the principal alpha component in each cell, trims it and resizes it into a transparent 192×192 frame. This is deterministic asset packaging, preserving the generated artwork. It needs macOS and Swift, but opening/building the committed Xcode project does not need the packer or an image-generation service.

From the repository root:

```sh
node native/scripts/build-art.mjs
node native/scripts/verify-art.mjs
```

`resource-manifest.json` records source, packer and output hashes. CI validates complete engine-item coverage, dimensions, RGBA encoding and those hashes. The native bundle test also loads every icon. Commercial submission still requires the owner’s ordinary asset/provenance review; no third-party rights clearance is implied.
