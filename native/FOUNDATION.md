# Shared native foundation

This additive package keeps Little Harbour's existing browser engine and map art available to a native client. It does not alter `dist/` or Pages deployment.

- `bridge.js` is the presentation/transaction adapter for the full economy, progression, project planning and Living Harbour evolution.
- `scripts/bundle-engine.mjs` deterministically packages eight existing/presentation modules for local JavaScriptCore, with source hashes. It does not transpile the economic functions or fetch runtime code.
- `scripts/bridge.test.mjs` checks 290 transactions in both the ESM adapter and generated runtime against the original engine, historical save migration, future-data protection, reservations/planning, state textures and a sandboxed generated bundle.
- `scripts/build-art.mjs` packs the native terrain and 120 transparent state textures. The v0.2 client supersedes the initial shared-vector exports with committed painted source atlases; see `art-source/painted-v2/README.md`. `verify-art.mjs` checks dimensions plus source/output hashes.
- `LittleHarbourTests/late-town.json` is a validated late-game fixture prepared using the original engine actions. Its ample test-only stock is deliberately not a campaign balance or earned-progression claim.

Run from the repository root:

```sh
node native/scripts/bundle-engine.mjs --check
node --test native/scripts/bridge.test.mjs
node native/scripts/verify-art.mjs
npm test
```

The dependent native application adds SwiftUI, SpriteKit, a committed Xcode project, local persistence and simulator tests. The current v0.2 branch integrates painted art and a UI/UX pass; final art approval and physical-device certification remain open. See `docs/GRAPHICS-UX.md` for the current evidence.
