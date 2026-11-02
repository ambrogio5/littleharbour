# Elena, townspeople and working fleet

Generated with the built-in ImageGen tool on 1 November 2026, in generation mode with a transparent background. `boats-prompt.txt` and `people-prompt.txt` contain the exact prompts. `boats.png` and `people.png` are the unchanged generated 2×2 source atlases. No external reference images were supplied. The prompts extend the existing Mediterranean painted art direction.

The fleet atlas contains cutter, coaster, upgraded cutter and upgraded coaster, in that order from top left. The people atlas contains Elena (harbour guide), farmer, dock worker and market vendor. Elena's portrait appears beside contextual guidance. The three full figures populate routes around developed sites; these are cosmetic inhabitants, not additional simulated workers or sources of goods. Walking uses translation, facing changes and a restrained bob, not multi-frame character animation. Reduced Motion shows static people, and pausing the simulation stops movement.

`native/scripts/pack-living-art.swift` deterministically extracts each cell's principal alpha component, trims surrounding transparency and packs the original generated pixels into a 512×512 RGBA frame. `living-manifest.json` records source, prompt, packer and output hashes. Run `node native/scripts/build-art.mjs` to repack on macOS, then `node native/scripts/verify-art.mjs` to check the committed assets. Xcode builds use the committed PNGs and require no image-generation service.

Installed boat upgrades and sail refits share the upgraded appearance for each hull. Hull types and base/upgraded states are distinct; each individual upgrade does not yet have separate art. Commercial submission still requires the owner's ordinary provenance review.
