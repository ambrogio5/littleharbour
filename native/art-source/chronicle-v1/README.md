# Painted civic landmarks

Generated with the built-in ImageGen tool on 5 November 2026, using `painted-v2/village.png` as a style reference. The initial prompt is retained in `prompt.txt`. These are game assets, not screenshots of gameplay.

Three transparent 4×2 atlases are retained without destructive edits:

- `landmarks.png`: promenade, shipwright exhibition, sea wall, bell tower, keeper's garden, school, regatta pavilion, winter market.
- `landmarks-alternate.png`: alternate architectural treatment for each project branch, in the same order and perspective.
- `landmarks-construction.png`: unfinished stonework, timber framing, supplies and scaffolding for each of those eight projects.

The alternate and construction follow-ups requested the same grid, warm limestone/terracotta/teal palette, upper-left light and transparent background. This is a description of the follow-up intent; the exact full follow-up prompts were not retained. The initial background-removal follow-up was performed by ImageGen. No opaque failed walking-animation sample is used in the app.

`pack-chronicle-art.swift` crops each cell and sizes it into a 384px transparent texture. It does not paint new detail, erase a background or recolour the source. The winter-market base/alternate cells are assigned to match the branch descriptions. Both source and output SHA-256 hashes are committed and verified by `verify-art.mjs`.

These are generated raster assets. Human art-direction/rights review remains part of release acceptance; no independent legal clearance is claimed.
