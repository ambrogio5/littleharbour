# Playtest 13 balance review

This is a mathematical review of the recipe and progression definitions, not a report of human playtesting. All times below are simulation seconds at 1×, exclude navigation/tapping and assume ingredients are available unless a chain is explicitly described. Actual sessions will take longer. The 3× clock changes wall time, not the resource tradeoffs.

## Existing constraints that carry into the neighbourhood

Each workshop processes one batch at a time. Queue capacity is waiting-room capacity, not simultaneous production. Speed refits improve throughput; queue refits mainly reduce supervision.

A basic cutter circuit to both coastal settlements consumes 8 preserves, 6 bread, 2 empty jars and 2 tiles. Producing the preserves requires 4 additional jars. The six jars occupy the kiln for 54 seconds; two tiles consume half a four-tile batch, an amortized 11 seconds. This is 65 seconds of kiln occupancy per circuit against a 53-second sailing time before pilot or rigging improvements. The kiln is therefore an important steady-state bottleneck even before adding lighthouse or settlement construction. Making the boat faster alone cannot sustain more departures.

Vegetable preserves require 24 preserving-room seconds for eight preserves; fruit preserves require 48. Both consume the same jars and wood. Mixed terraces support variety, while garden-heavy supply has a throughput advantage. That advantage should remain visible in production planning rather than be hidden by larger coin rewards.

Existing material and inland routes remain renewable fallback sources. A new district should not require a finite starting stock or a specific old specialisation to bootstrap. Any demolition/redevelopment mechanic must leave a route back to producing its own construction inputs.

## Neighbourhood costs and throughput

The six distinct buildings (one home, carpenter, weaving studio, sail loft, public square and flax garden), their six plots and access cost **1,420 coins, 104 timber, 88 stone and 8 tiles**. Furnishing the home adds 120 coins, 6 furniture and 4 cloth; it is not included in that construction total.

| Output | Recipe | Dedicated station occupancy |
| --- | --- | --- |
| 4 flax | Free renewable harvest | 18 seconds |
| 2 cloth | 4 flax | 24 seconds |
| 2 furniture | 4 timber | 24 seconds |
| 2 sails | 4 cloth + 2 timber | 30 seconds |

One full three-order rotation earns 980 coins and 28 timber. Its crafted inputs consume 17 timber: 12 for six furniture, 4 for four sails and 1 for the jars used by four preserves. Net timber is therefore +11, before any unrelated production or construction. The rotation also consumes 10 bread and raw crop inputs. It needs 14 cloth overall (6 delivered directly and 8 stitched into sails), occupying the weaver for 168 seconds. Flax harvesting takes 126 seconds, furniture 72, sails 60 and bread baking 60; these stations can overlap. This identifies weaving as the principal steady-state bottleneck for the new order loop, rather than asserting a 168-second achievable whole-session duration.

The public square reduces future neighbourhood recipe times by 10%; the corresponding weaving occupancy becomes 151.2 seconds. Existing paid jobs keep their original duration. Homes add queued batches, not workers: a home raises neighbourhood capacity from two to three; furnishing it raises capacity to four. A second furnished home would raise it to six but consumes the sixth plot that could hold the public square. This trades longer unattended production against throughput.

A permanent sail refit costs 120 coins, 4 sails and 8 timber. Crafting those sails consumes another 8 cloth, 16 flax and 4 timber. Its benefit multiplies future voyage time by 0.9, alongside rigging and pilot bonuses. A fully rigged cutter with pilots takes 23 rounded simulation seconds for the quarry supply run before this refit and 21 after it. This is a modest optimisation, not an answer to missing cargo production; describe it accordingly.

## Recovery and design risks

- **Finite space:** all six distinct buildings fit, but two homes plus all five other types do not. The UI states the tradeoff. Free swaps preserve building upgrades. Redevelopment keeps the purchased plot and returns half the original building coin cost, while permanently consuming its materials and furnishing cost. Workshop removal is blocked by active work; home removal is blocked when the smaller queue would strand queued jobs.
- **Order lock:** orders rotate in a fixed furniture → cloth → sails sequence. Without all three chains, a player can temporarily stop on an order they cannot fulfil. This is a progression prompt, not a permanent softlock, because plots can be redeveloped and ordinary food/material trade remains available. A future choice of two simultaneous local orders would make specialisation more meaningful without requiring every workshop forever.
- **Autoproduction:** furniture and sails consume renewable-but-earned timber. Aggressive stock targets can drain construction supplies. Reservation controls and clear shortages are important; the food routes remain the recovery path.
- **Repeated chores:** the three-order cycle is deterministic and instantly delivered. It creates resource allocation choices, but does not by itself establish a varied long-term campaign. Observe how quickly players recognise the cycle before increasing its costs or adding more tiers.
- **Validation scope:** unit fixtures with generous stock exercise presentation and spending rules. They are separate from earned-resource progression tests and should not be cited as evidence of balanced pacing.

## Validation limits

Automated progression tests can prove that a legal resource path exists. They cannot establish that the path feels interesting, that its workload is appropriate on a phone, or that the economic rewards produce a satisfying session length. Those remain playtest questions.
