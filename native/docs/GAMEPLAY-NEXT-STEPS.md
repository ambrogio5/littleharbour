# Longer play after the ferry — roadmap

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
