# Longer play after the ferry — roadmap

The [November 3 long-play programme](LONG-PLAY-PROGRAMME.md) supersedes the ordering and future save design below. In particular, increment 1 proposes shared town schema 14, and increments 2–5 use one native envelope-4 `chronicle` object, not a separate `restoration` envelope. The festival evidence remains valid; future projects below remain historical proposals, not implemented features.

Build 10 implements the first increment, Harbour Festival: two supply themes, real passenger returns, a permanent courtyard reward, a journal memory and two rotating request choices. See [implementation and evidence](HARBOUR-FESTIVAL.md). The remaining projects below are proposals, not playable content. The original design target of two or three 15–20-minute sessions has not been validated by human playtests.

## What runs out now

The five chapters end with the ferry. The three ambitions then expose existing coastal projects/commissions, residents/local orders and automation/refits. Completed tracks advance to another multiple of five orders or 25 deliveries. Those counters provide direction but little new decision-making. Coastal commissions cycle through three requests per destination; neighbourhood orders cycle through three recipes. Keep 24 and repeat voyages make those cycles easier to sustain, so larger quotas alone would mostly lengthen waiting.

The game already has useful competing demands: bread/preserves for freight and passengers, timber for construction or furniture, cloth for homes or sails, and two boats shared between cargo and ferry work. Build the next arc around those decisions. Keep pause-on-exit, no deadlines, no paid acceleration, and no loss of the existing town.

## First playable increment: a harbour season

After the ferry chapter, Elena opens a board with three named projects. The player may switch projects freely; paid contributions remain recorded. Each project has a visible final reward and four authored stages: preparation, supply choice, delivery/service and celebration. Only the first project needs to ship initially; develop and balance it before multiplying content.

| Project | Decisions and existing systems | Proposed lasting result |
| --- | --- | --- |
| Harbour festival — implemented in build 10 | Choose a food stall or craft exhibition; allocate bread/preserves or cloth/furniture; run passenger services to bring visitors; finish with a mixed local order. | A visibly decorated square and journal scene; unlock a new pool of mixed local requests. |
| Coastal restoration | Choose which partner to support first; balance timber/stone returns against island earnings; supply a repair project using cargo and coastal commissions. | A visible repaired waterfront landmark and additional authored commission choices. |
| Shipwright’s exhibition | Prepare one boat for passengers and the other for cargo; use sails, fittings and workshop refits to satisfy different stages. | A distinct cosmetic pennant/boat finish and new optional fleet challenges. |

Rewards must be granted exactly once. Avoid another permanent income multiplier: the current town focus, residents proposal and coastal bonuses already compound. New projects consume real goods through validated actions. Cosmetic rewards need separate layered art, including construction/completed states. Do not present these as new buildable map districts until actual sites and interactions exist.

The four stages should vary the player's decision, not repeat an identical delivery four times. Requirements must account for existing incoming goods and reservations. Offer a useful parallel action when supplies are already queued. Elena should explain the bottleneck and route directly to the required workshop or selected boat. A player with a substantial stockpile may finish the initial supply stage immediately; do not confiscate stock or inflate costs to stop them.

## Then add variety and strategic depth

1. Expand commission/local-order pools with two or three simultaneously visible choices and clear costs/rewards. Avoid random exclusive resources and refresh fees. Different choices should favour the player's actual production setup.
2. Add a route-planning summary showing what each boat consumes, returns and waits for. Keep repeat controls on the boat and automation on the workshop. This should help balance passenger income against scarce construction materials.
3. Introduce one genuine new destination only after these loops are enjoyable. It requires its own route data, boat travel art, projects, planner/guide support, validated saves and browser-export behavior. A decorative island or another delivery counter is not a new destination.

## Persistence and economy boundaries

Preserve the canonical browser-compatible town. Project progress/rewards need a separately validated, versioned native extension, transactional with the goods it consumes. Define how older native versions protect it and how browser exports omit native-only project state before implementation. Do not put project progress in UI preferences or grant rewards from computed ambition projections. Reloading, importing, cancelling a preview and tapping twice must never duplicate a contribution or reward.

Use the existing original-engine actions for existing work. Native-only contributions need explicit cost validation, reservation handling and failure recovery; do not fake them by incrementing delivery totals. Keep the deployed browser engine and schema unchanged unless a separate browser feature is intentionally proposed.

## Pacing and acceptance before claiming a longer game

Target the first project at roughly two or three satisfying 15–20-minute sessions for a modest ferry-complete town. This is a design target, not a measured claim. The existing 1,252-action automated campaign replays prove reachability, not human enjoyment or duration.

Measure active decisions and idle waiting at both 1× and 3× with: a modest earned save, a wealthy automated save, both early specialisations and both residents choices. Record time per stage, blocked chains, coin/material changes and whether two boats offer a meaningful choice. Tune costs after those playtests, rather than raising all timers.

Required automated coverage: reachable stages without injected goods; every branch; incoming goods and reservations; rewards exactly once; invalid/old/future saves; background pause; double taps; reload during each stage; full-board and focused-guide navigation. Physical checks: the next action is understandable without opening several menus, the board fits Duo landscape, and stages remain readable in large text and both appearances.

Recommended sequence: finish the current layout/appearance acceptance → implement and test Harbour festival → tune its pacing using earned saves → add the other two projects → evaluate a third destination. Build 10 ships only the festival increment. Coastal restoration, shipwright projects and a new destination remain unimplemented.

## Festival pacing from the earned traces (build 10)

The two committed festival traces are serial scripts on one boat, replayed against the shipped engine. They measure reachability with earned goods, not human play. Per stage, counting only the time the script had to let the clock run:

| Trace | Prepare | Supply | Visitors and opening supplies | Two requests | Total at 1× |
| --- | --- | --- | --- | --- | --- |
| maritime / food | 9 actions, 110 s | 42 actions, 464 s | 51 actions, 626 s | 49 actions, 520 s | 1,720 s ≈ 29 min |
| estate / craft | 5 actions, 76 s | 29 actions, 494 s | 99 actions, 1,236 s | 51 actions, 564 s | 2,370 s ≈ 40 min |

Observations for human tuning rather than changes made now:

- The visitor stage is the long one, and it is where a second boat matters: the script sails Pietra Cove and Olive Island alternately on berth 1 only. A player using both boats halves the waiting but must fund two passenger services at once. That is the intended choice; it has not been measured with people.
- The craft branch pays more for its welcome stage because its earned base has fewer coins for passenger provisions; it finishes richer (2,612 coins against 1,560) because craft requests pay in goods the estate town already makes. Both branches end with two requests fulfilled and no stock injected.
- At 3× the whole arc is under 14 minutes of waiting, so the 15–20-minute-session target is bounded by decisions, not timers. Raising costs would mostly add waiting; if playtests show the arc is too short, add decisions (a third visitor source, or a request that needs both boats) instead.
- On an iPhone 16 Pro-sized screen the chapter's primary action sits below the fold of the Festival panel in the activity sheet, under the Production/Trade/Build bar until the player scrolls. Elena's card on the map still routes to it. A shorter stage-3 reward note or moving the action above the requirement list would surface it without changing the compact layout; this is a presentation decision for the next pass.

## Proposed next increment: coastal restoration

The next coherent step after the festival is the second project from the table above, **coastal restoration**, because it reuses the loops the festival left idle (cargo voyages, coastal commissions and the two destinations' development tracks) and adds the strategic choice the roadmap asks for: timber and stone returns against island earnings. It should ship alone, tuned, before the shipwright's exhibition.

Design, grounded in the current code:

1. **Unlock.** Available once the festival is open (`festival.stage === 4`) and both coastal development tracks are complete (`fleet.development.quarry + island === 6`), so the project arrives after the open-play ambitions have been used, not instead of them. Elena presents it in Town beside the festival.
2. **Stage 1 — survey.** Pay coins and planks. Lasting change: survey posts along the home waterfront, drawn like the festival's posts on the existing quay art.
3. **Stage 2 — choose a partner.** Pietra Cove (masons: the repair wants stone, tiles and planks, and pays in a permanent +1 timber/stone on that route's tier-3 returns) or Olive Island (chandlery: oil, wine and cloth, paying a permanent passenger-service coin bonus). The choice is free until the first repair contribution, exactly like the festival theme. Keep only one such multiplier per town, and keep it small; the roadmap warns against compounding another income bonus on top of focus, residents and coastal bonuses.
4. **Stage 3 — repair voyages.** Three cargo voyages to the chosen partner after the contribution, counted the same way festival visitors are counted (completed trips only; recalls and ferry runs do not count), plus two commissions from that destination. This is where the player balances the boats: cargo for the repair against passengers for coins.
5. **Stage 4 — unveil.** Pay the finishing goods. Lasting change: a repaired breakwater and mooring lanterns on the home waterfront (separate SpriteKit layer, static under Reduced Motion), a journal memory naming the partner, and the commission board for that destination showing two simultaneous choices instead of one.

Boundaries that follow from the festival implementation:

- A new `native/restoration.js` module beside `festival.js`, with its own `offers`, `mutate`, `restore` and `view`, registered in `bridge.js` under category `Restoration`. The browser town stays schema 13; the bundle is regenerated and its manifest checked.
- Native envelope **version 4** adds a validated `restoration` object. Versions 1–3 keep loading; the version-3 reader of build 10 already protects unsupported newer files instead of overwriting them, which should be covered by a new test that loads a version-4 file in the current reader. Browser exports omit restoration progress, as they omit the festival, and the Settings disclosure gains one sentence.
- Stage identifiers and a repair epoch reject stale or repeated contributions; rewards are granted once from `act`, never from snapshots.
- Coverage before claiming it: adapter tests for every branch and for cargo/ferry/recall counting; an earned trace continued from each festival trace with reload checkpoints, checked in CI like the festival traces; native JavaScriptCore replay; UI tests on an iPhone 16 Pro-sized simulator so the primary action is proven reachable in the sheet; iPad and landscape captures.
- Pacing target: two 15–20-minute sessions for a festival-complete town, measured by people before costs are frozen.

The shipwright's exhibition and a third destination remain after this, in that order.
