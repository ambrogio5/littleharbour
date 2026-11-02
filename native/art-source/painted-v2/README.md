# Painted Mediterranean art · v2

These are committed project assets created with the **built-in ImageGen tool**, not external runtime downloads. `prompts.json` records the final prompts. The previous chat described an approved painted Mediterranean whole-map direction but did not expose its original concept image; this pass interprets that direction using the repository's playable layout, rather than claiming a pixel-exact recreation of the unavailable concept.

| Source | Role |
| --- | --- |
| `terrain.png` | Continuous sunlit limestone/olive/turquoise coast, no baked gameplay buildings |
| `architecture.png` | 12 independent commercial/coastal building designs |
| `village.png` | 12 independent gardens, homes, crafts, market, square, quarry and boat designs |
| `states.png` | Empty plots, scaffolding, growing wheat, olive tree, upgrade annexes, furnished house and upgraded boat |
| `icon.png` | Opaque native app icon in the same visual direction |

The atlas images are approximately 4×3 layouts. `pack-painted-art.swift` extracts the principal alpha component from overlapping cells to eliminate neighbouring fragments and isolated alpha debris, trims it, and packs it into the stable 384×384 / 320-world-unit frame. It preserves the generated alpha and painted pixels; it does not substitute vector illustrations for the painted sprites. The source images remain unchanged. Cropping, resizing and assembling upgrade annexes are deterministic packaging steps using Apple's image libraries. No API key, model call or network access is needed to rebuild.

There are 120 named state textures for 24 kinds, plus one separate olive tree and the terrain. These are **not 120 separately painted designs**: empty plots and construction share three visual families (town, coastal, agricultural); ordinary upgrades add a painted annex/pergola; houses and boats use distinct upgraded silhouettes. Ripe wheat changes from green to gold. Unused ripe variants intentionally reuse built artwork. Building states, visible upgrades and crops remain driven by actual engine data. There are no ornamental pretend production buildings baked into the terrain.

The native renderer registers four fixed coastal landmarks to this artwork's shoreline without changing saved plots, economy coordinates or browser assets. Labels travel with boats, remain readable over terrain, and can be hidden. Progress feedback respects Reduce Motion and paused simulation.

The artwork is an integrated painted game pass, not final artist approval. Construction-family reuse, projected architectural proportions, terrain resolution at extreme zoom and some sprite scale relationships remain appropriate targets for further art direction. No physical-device memory/frame-budget certification or final animation/audio package is implied.

Regenerate from the repository root:

```sh
node native/scripts/build-art.mjs
node native/scripts/build-icon.mjs
node native/scripts/verify-art.mjs
```

The packer requires macOS and the installed Swift/Xcode command-line tools. The committed PNGs and Xcode project build without running the packer. Source/output SHA-256 checks run in Linux CI too.
