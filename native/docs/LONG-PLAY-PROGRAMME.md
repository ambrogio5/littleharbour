# Long-play programme — implementation ledger

The owner's 3 November 2026 prompt replaces the earlier roadmap order. It does not mean all proposals are implemented. The initial prompt required a design note and separate PR per increment. On 5 November the owner approved one integrated expansion PR for increments 2–7, with separate review sections and evidence. Approved values and implementation differences are recorded in [the expansion note](HARBOUR-YEAR-EXPANSION.md). Human pacing was deferred by the owner and is still unverified. No merges, force pushes, browser deployments or App Store submissions are authorized by this programme.

## Existing foundation

Build 13 contains the original economy, festival, inline Keep 24, per-boat missions, guide/townspeople, directional boats, map surround, dark appearance and the bottom-space correction. PR 16 added 26 Elena lines, four named partners, evidenced memories and consistent native place names. These are useful foundations, not the new relationship/season systems. Old saves have no chapter timestamps or full focus-change history: do not fabricate dated memories.

PRs 13 → 14 remain the foundation/native stack. PRs 15, 16 and 17 target `codex/native-ios`; this proposal branches from PR 17's final head to preserve their fixes. No PR has been merged by this work. Build 13 was previously installed and launched on Duo; build 14 implements increment 1; its verification/distribution status is recorded in the increment note.

## Ordered delivery

| Increment | Deliverable and explicit boundary | Current status |
| --- | --- | --- |
| 1. Economy and sinks | Shared rebalance, 12 workshop refit families, third market plot and third berth. Shared schema 14 migration and browser compatibility. | [Approved values implemented](LONG-PLAY-ECONOMY.md); automated verification and QA build 14. Human pacing deferred by the owner. |
| 2. Harbour year | Four seasons, approximately 20 simulated minutes each at 1×; 2–3 save-sized requests; one choice event per season; pause-on-exit; tint/decor static under Reduce Motion. | Implemented: four 20-minute seasons, three stable optional offers, frozen 6/12/18 supply sizes, accepted work retained, two-boat visitor requests, branch choices and seasonal decoration. No winter travel penalty; it was not approved. |
| 3. Partners | Existing four people plus ferry captain; five earned relationship steps: commission, discount, second choice, site cosmetic, personal project. | Implemented: five named partners, five earned thresholds, four personal supply commissions, cheaper trusted commission, assigned adviser that reopens unpaid choices, cosmetic recognition. Adviser replaces the originally proposed second simultaneous commission; no price multiplier. |
| 4. Civic life | Save-sized household needs, town standing, school/bell tower/sea wall access. | Implemented: actual homes/furnishings determine household places; bread contributions earn standing that gates the corresponding civic projects. |
| 5. Chronicle | Eight projects, two visible at a time; branching choice, two distinct boats, permanent painted result; each targets two satisfying 15–20-minute sessions. | All eight playable with two branches, real materials, both coastal routes using different boats, reservations, persistent memories and 24 finished/construction textures. Earned paths replay in Node and JavaScriptCore. Session enjoyment and 15–20-minute target remain unverified. |
| 6. New coasts | Multiple slots with current town selected by default; rocky/marsh/windy layouts and one modifier; cross-town memories/partners album. | Implemented: up to 16 isolated towns, validated atomic library, individual recovery histories, original town retained, three request modifiers and cross-town memory album. Coast scenery uses variants of the existing map, not three independently authored terrain layouts; the album does not transfer partner rewards. |
| 7. City port | Coaster plus Expanded hold, four-minute voyages, glaze and ceramics; native envelope 4, explicit lossy browser export/refund boundary. | Implemented under the separately approved native-only boundary: Expanded hold coaster, four-minute voyages, glaze imports, ceramics crafting, three collections and two chosen expeditions. Human pacing remains pending; this is not evidence of enjoyable balance. |

Season content: spring planks/tiles for Pietra Cove; summer passengers/bread; autumn preserves/oil/wine; winter cloth/furniture and slower island crossings. Events offer alternatives (repair a quay or accept temporary loading friction; one-time ship trade; market fair). No destructive storm, lost town, deadlines, energy or paid acceleration. Winter and event travel effects require a validated native dispatch modifier; do not rewrite the shared catalog in increments 2–5 or multiply a running trip again after reload. Reserve and Plan supplies appear for every seasonal goal; Elena routes to the actual bottleneck.

Chronicle order: **coastal restoration → shipwright's exhibition → sea wall → bell tower → lighthouse keeper's garden → harbour school → regatta → winter market**. Deliver/test/tune each before the next. A civic unlock and the corresponding chronicle construction are one project/reward, not two competing versions of the same landmark. The earlier restoration-only envelope proposal is superseded by the shared native chronicle extension. Partner discounts and any economic project rewards must respect the approved economy rules; do not introduce another unchecked compounding income bonus.

## Carry forward every presentation proposal

The historical presentation list below is retained for traceability. Current expansion delivery and remaining art/UI gaps are recorded in HARBOUR-YEAR-EXPANSION.md; this table is not a claim that all proposals shipped.

| Proposal from the whole-game review | Delivery point |
| --- | --- |
| Primary action before explanations; remove repeated guide/action titles | Increment 1 refit/market controls; apply consistently to workshops and festival. |
| Collapse map chapter card to an expandable pill; preserve next action | Increment 1 UI pass, with portrait/landscape and VoiceOver tests. |
| Town painted tile grid; remove dock duplicates; ambitions art | Increment 2 seasonal/partner board entry. |
| Build “Show on map”; move/swap by selecting a neighbourhood destination | Increment 1 new site placement and increment 4 civic planning. Preserve original engine actions. |
| Landscape map toast and fading scroll-chip affordance | Increment 1 boat/market presentation. Keep inline automation and per-boat controls. |
| Festival request reservation/planning support and second-boat visitor hint | Increment 2 shared native goal adapter; retain actual arrival counting. |
| Early town name and bakery awning choice | Increment 3 identity pass; validated native persistence, no economy effect. |
| Ground repaint, connected paths, walls/cypress/terrace details; repair surround seam | Art proposal before finished assets; incremental work alongside 1–2. Keep existing sprite anchors. |
| Contact shadows, upper-left lighting, footprint/scale normalization | Increment 1 scene pass; preserve hit targets and readable buildings. |
| Surveyed empty plots, large-building scaffolds and distinct upgraded silhouettes | Increment 1 new investments and increment 4 civic works. |
| Living shoreline/water; two-frame walking/work routes tied to real sites | Increment 2 world-life pass, static under Reduce Motion, measured performance. |
| Painted festival decorations and permanent project layers | Festival visual pass alongside increment 2; each increment-5 project needs its own approved lasting art. |
| Evening terrain palette and warm windows | After ground pass; current dark mode is interface/scene tint, not a finished night scene. |
| Dated journal memories | Increment 5 chronicle for newly recorded events; historical unknown dates remain explicitly undated. |

Before finished art, present a coherent reference comparison using the existing Mediterranean whole-map direction: terrain plus individual plot/construction/built/upgraded layers, shared light and scale. Do not substitute a flattened illustration for interactive buildings. SpriteKit world, SwiftUI controls and JavaScriptCore remain the architecture; no WebView or downloaded engine. The expansion adds separately layered painted project art; it does not replace the playable map with a flattened image.

## One extension and explicit release gates

Native envelope **4** has one validated `chronicle` object holding season, partners, standing and projects. Native versions 1–3 keep loading. Unsupported-newer-save tests must demonstrate byte protection in older clients. Browser exports omit chronicle/festival and clearly disclose this; canonical schema 14 is a separate increment-1 compatibility concern. Paid contributions and rewards commit exactly once through `act`; projections and reloads cannot mutate progress. Stage IDs and epochs reject stale/double submissions.

Every playable increment needs adapter branch coverage, earned continuations from both festival paths, reload checkpoints, CI freshness checks, JavaScriptCore replay and iPhone 16 Pro-sized UI tests. Add browser tests explicitly to the shared-change CI path: the increment-1 workflow now runs `npm test`, all trace checks and both baseline comparisons. Select/record the simulator actually used rather than assuming the current workflow pins Xcode 16.4/iOS 18.5; it now prefers iPhone 16 Pro and records its actual runtime, with an available-iPhone fallback. Run one large simulator at a time.

For human pacing, record active decisions versus waiting, coin/material changes and boat allocation for modest and wealthy earned towns at 1×/3×, then per season and project stage as those exist. Automation setup/counters are not evidence of enjoyment. A wealthy player spending saved goods quickly is valid; add decisions rather than confiscating stock or raising timers.

The release remains **free, no ads/purchases/subscriptions, English-only and silent**. Outstanding acceptance includes full human pacing, physical layout/VoiceOver/Dynamic Type checks, interruptions/save recovery, sustained device performance/battery/thermals, final art consistency, store screenshots/metadata/privacy disclosures and owner-controlled signing/upload/review. A successful build or install does not close those gates.

### Increment-1 presentation accounting

Implemented: selected-workshop profiles and batch preview, one selected market business with inline automation, three individual boat missions, primary purchase before long explanations, collapsed objective pill, subtle building contact shadows and actual-state placement for the third market/berth/boat. Reused existing surveyed/construction/painted upgraded sprite families. The dedicated Town grid, landscape toast/scroll affordance, universal Build “Show on map”, ground/path repaint, unique tier-3 silhouettes and broader lighting/scale art review are **not completed**; they remain explicitly in the table above, alongside the future seasonal art work. No new finished raster art was generated in this increment.
