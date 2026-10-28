# Playtest 14 planning and economy review

This document analyses catalog values and deterministic production rules. It is not a human playtest or a measured session-length claim.

## Terminal investment

The passenger terminal costs 950 coins and nine supply batches across three stages. Total delivered goods are 24 timber, 12 tiles, 24 bread, 18 furniture, 18 cloth and 12 preserves. Each completed batch is permanent progress; funding and delivery use expected-stage/batch tokens to prevent duplicate spending.

If all crafted inputs are made from raw materials, the total timber commitment is 69: 24 delivered directly, 36 for furniture, 6 for tiles and 3 for preserve jars. The textile chain needs 36 flax. Dedicated station occupancy includes 216 seconds each for furniture and cloth, 162 for flax, 144 for bread baking, and 120 in the kiln (66 for tiles plus 54 for jars). Crop, mill and preserving work add further dependencies. Stations can overlap; these figures must not be summed into a player-facing completion ETA.

## Passenger services versus cargo

For an unmodified cutter, the quarry passenger route uses 4 bread and 2 preserves, returns 180 coins and takes 27 simulation seconds. The island passenger route uses 6 bread and 2 preserves, returns 220 coins and takes 36 seconds. Gross voyage rates are therefore about 6.67 and 6.11 coins per second. Neither figure accounts for producing the food.

The quarry service is more efficient when bread or boat time is the constraint. The island service earns more per two preserves, making it relevant when preserves are scarce or the kiln is busy with construction. Passenger services consume no tiles and provide no construction materials. They do not advance cargo relationships. Island cargo still offers substantially higher fares per departure but needs more preserves and tiles; comparing coin totals alone would obscure the production tradeoff.

The 950-coin fee could be recovered in six basic quarry departures if considering gross fares alone. This is not an economic payback estimate: it excludes terminal goods, voyage food, and the earnings forgone by using a cargo berth. Do not market terminal construction as a fast coin upgrade.

## Existing dominant constraints

The neighbourhood three-order loop still needs 14 cloth per rotation and 168 weaving seconds before the square bonus. Home upgrades add queue capacity, not production speed. The baseline two-stop cargo circuit still consumes at least 65 amortized kiln seconds versus 53 cutter sailing seconds. Faster boats cannot resolve those supply bottlenecks.

The project planner makes these constraints visible without changing recipe rewards or adding free output. It counts stored goods and queued output once, protects final project requirements before allocating upstream inputs, and lists remaining new work by station. The displayed station workload is a bottleneck comparison, not a guaranteed finish time; existing queue occupancy and dependency ordering can delay completion.

## Queue-action contract

“Queue project” makes one conservative pass. It starts only currently affordable batches in available queue slots, uses no goods reserved for another purpose, protects the selected project's final unreserved goods, and neither changes stock targets nor silently creates reservations. Clicking again while the same needed output is already queued starts no duplicate work. Future dependent batches require another click after ingredients finish. Ripe wheat is reported as a harvest action rather than collected silently.

A locked recipe is reported as a missing workshop. Coins, timber and stone without a production recipe remain trade requirements. The planner chooses a usable recipe deterministically, preferring one with available inputs; it does not claim to globally optimise alternate recipes or schedule work across every workshop.

## Follow-up playtest questions

- Does nine-batch terminal delivery feel like visible progress or repetitive submission?
- Can players understand the difference between projected station workload and work that can start now?
- Do passenger runs remain useful once both cargo partnerships and neighbourhood orders are established?
- Does bread availability make the quarry passenger service the default too often? Rebalance only after observing actual production constraints.
