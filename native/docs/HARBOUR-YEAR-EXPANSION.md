# Harbour year and city partnership — build 15

Implementation and review record, 5 November 2026. This is an integrated expansion on the unmerged build-14 economy branch, not a browser deployment or App Store release. The owner explicitly approved one integrated PR for these interdependent increments on 5 November. The original programme asked for design notes before implementation; this note consolidates decisions and approvals after implementation began and does not pretend otherwise.

## Player problem and resulting loop

The owner found the late game repetitive and the next action hard to locate. A persistent goal now survives browsing another workshop or boat. The map opens Goals directly; Today, Projects and People separate short requests, lasting construction and relationships. Production automation remains inside workshops and missions remain attached to the selected boat. Background refresh no longer takes over navigation.

After the first festival the player explicitly begins the harbour year. Three optional offers change with the season; accepted work never expires. A request can be supplied, visitors can be welcomed with two different boats, or the player can choose the kind of gathering to support. Supplies may be reserved from real stock and planned through the real production graph. There are no gifts of a finished economy, offline penalties, energy systems or extra coin rewards.

The longer arc is eight branching civic projects, followed by a city partnership: equip a coaster, import glaze, craft decorated ceramics, complete three collections and choose two expeditions. Project completions also provide themes for later optional gatherings. The goal is a continuing choice of work, not a claim of infinite authored content.

## Approved numbers and boundaries

The owner approved these values in this chat before their dependent work:

| System | Implemented rule |
| --- | --- |
| Season | 1,200 active simulated seconds at 1×; the normal speed control applies; no off-app progression |
| Requests | Three offers; supply amounts 6/12/18 based on unlocked workshops and frozen when offered; accepted offers retained across seasons |
| Visitors | Two completed passenger arrivals using different boats, dispatched after acceptance; Windward coast also requires both shores |
| Partners | Earned thresholds 1/3/6/10/15 completed requests |
| Civic projects | Paid goods stages 12/24/36, plus completed voyages with different boats and both quarry/island routes; no extra coins |
| City access | Completed harbour school, a coaster with the existing **Expanded hold** upgrade (`cargo`) |
| City voyage | 240 simulated seconds; 6 provisions + 6 cloth + 6 wine → 6 imported glaze |
| Decorating | 2 glaze + 2 jars → 2 ceramics in 30 simulated seconds |
| Collections | 6/12/18 ceramics; two authored expedition choices between collections; no extra coins |
| Export | Native envelope 4; city progression/imports omitted from browser copies, active city cargo and queued jars refunded in that copy |

The earlier phrase “hull upgrade” is implemented using the real existing Expanded hold; no duplicate upgrade or new upgrade price was introduced. A cutter can be rebuilt as a coaster for the existing coaster catalog cost so an all-cutter fleet cannot block the city permanently. This is an explicitly confirmed destructive action in the UI and preserves fitted equipment.

## Review sections

1. **Intent and planning:** `GameStore`, `GoalsPanel`, the map entry and selected-boat controls. Pinned goals remain visible while browsing. Plan distinguishes stock, incoming work and held supplies; locked recipes link to building plans. The Town activity grid removes Production/Trade/Build duplicates and supports search and larger text.
2. **Harbour year and partners:** `chronicle.js`. Four seasons, frozen requests, individual festival ticket refresh, five named partners, personal commissions, a cheaper trusted commission, an assigned adviser who can reopen an unpaid/unreserved branch, and permanent visual recognition. The adviser is the implemented alternative to the old proposal for a second simultaneous commission. No winter travel penalty or coin multiplier was added.
3. **Civic life and chronicle:** household capacity comes from actual homes/furnishings, not the legacy proposal counter. Bread contributions earn standing for civic access. The eight projects are restoration, exhibition, sea wall, bell tower, garden, school, regatta and winter market. Every project has two branches, real contributions, distinct-boat route tracking and a permanent painted result. The branch also selects cargo versus passenger work on each coast: a public landing welcomes families, the school brings teaching crews/students, the sea wall needs cargo and the regatta/winter gathering connect visitors. A wrong mission type cannot fulfill its assigned coast. The project opens the exact boat mode/destination and prefers an unused idle boat; it never dispatches automatically. All voyage prices/durations/fares remain those of the original catalog, without an additional native coin reward. New memories record actual game time; old unknown dates are not invented.
4. **Coast library:** `TownLibrary`, `CoastLibraryView`. The original save remains at its original path. Up to 16 separately stored towns have individual recovery histories and clocks. The library index is atomic, validated and guarded against external changes. Destination saves are validated before active selection changes. Rocky, marsh and windy request modifiers and scenery are implemented; these currently reuse the base terrain, not three wholly new authored maps. The album reads memories without advancing towns and does not transfer relationship rewards.
5. **City:** `city-port.js`, `CityPortPanel`, selected-boat City mode. Native voyages occupy real boats and block canonical repeat/circuit/upgrade actions until return. Recalls refund cargo but grant no arrival. Crafting and rewards commit once. Collections require the actual selected expeditions; reload cannot manufacture arrivals. Imports live outside the shared catalog, as approved.
6. **Art:** source atlases, deterministic packers, source/output hashes and native bundle tests. Eight landmarks each have construction and two completed branch images. Twelve advanced workshops have separate tier-3 silhouettes and previews. Existing site anchors, native hit targets and original state textures remain. No flattened whole-map image replaces interactive buildings.

## Persistence and browser compatibility

The canonical economy remains shared schema 14 from build 14. Native envelopes 1–3 load without silently starting the year. Envelope 4 adds one strictly validated chronicle, city data, identity, optional pin and reservations. New actions work on copies; invalid requests/loads leave the current town intact. Stage/epoch tokens reject duplicate or stale contributions. Saves are written through the existing verified backup repository.

Native reservations physically remove the held goods from ordinary stock so existing automation cannot sell or consume them. Releasing returns the exact held goods. Browser export works on a copy, returns held native supplies and eligible active city cargo, and clearly omits the native year, partners, civic projects, festival progress, imports, ceramics, identity and expeditions. Already contributed goods remain spent. A native export is the complete town backup; it exports the selected town, not the whole coast library.

The currently deployed older browser cannot load shared schema 14. Conditional legacy export remains available only when the engine says it is lossless for the shared investments. No browser bundle, deployment branch or live deployment has been changed. `dist/project-planning.js` adds reusable explicit-cost helpers while preserving existing callers; browser regression tests cover that shared change.

## Earned progression evidence

The committed traces continue the two previously earned festival/economy campaigns without free goods. They fund investments by production and trade, checkpoint reloads, and compare the exact final save. Both are replayed through Node and the application's JavaScriptCore engine.

| Continuation | Food path | Craft path |
| --- | ---: | ---: |
| All eight projects | 652 actions, 9,969 simulated seconds, 72 reloads | 803 actions, 13,222 simulated seconds, 72 reloads |
| City collections and both expeditions | 166 actions, 4,238 simulated seconds, 38 reloads | 169 actions, 4,391 simulated seconds, 37 reloads |

These are deterministic progression checks, not human session timings or evidence that the game is fun. They exercise both project branches and both expedition branches across the two paths. The earned city trace exposed the need to unlock the vineyard chain; it now earns that investment normally, and the UI exposes locked-production blockers.

## Verification and remaining acceptance

Final run identifiers, counts, screenshots and CI links are recorded in `EXPANSION-VERIFICATION.md`. Earlier failures and interrupted phone runs remain documented; a green targeted rerun is not mislabeled as a complete device pass.

Still requiring human acceptance: decisions versus waiting at 1×/3×, whether branches and boat allocation feel meaningful, text comprehension, actual VoiceOver gestures, extended device thermals/battery and interruptions in ordinary use. The owner took the phones away during the 5 November acceptance work; simulator work can continue, but any remaining device checks must wait for their return.

Art limits: the new building layers are usable generated raster assets with provenance and reproducible packing, not a claim of final art-director approval. Walking samples with unusable opaque backgrounds were rejected; existing people still translate/bob rather than use authored two-frame strides. The base terrain/surround seam, connected ground paths, full evening terrain/warm-window art and three independently authored coast layouts still need a cohesive environment pass. The bakery colour choice currently tints the bakery sprite, rather than isolating only its awning. These are not hidden behind a release-ready label.

The intended release remains free, offline, English-only and silent, with no ads, purchases, subscriptions, analytics or account service. Final App Store screenshots, public privacy URL, copyright/art rights review, rating/contact/territory metadata, production signing identity, TestFlight acceptance, current submission requirements and owner-controlled upload/review remain release gates. Nothing is automatically merged, deployed, uploaded or submitted.
