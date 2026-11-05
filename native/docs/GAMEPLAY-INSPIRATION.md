# Gameplay direction after the build-14 playtest

Research and design proposal, 5 November 2026. Inspected source: `f14c172c22cb9e7ca89847b5f17cd182e929c7dc`, PR #18, still unmerged when checked. This is the original research proposal. The later 5 November implementation is recorded separately in [the expansion note](HARBOUR-YEAR-EXPANSION.md); do not treat every recommendation below as delivered. The [programme ledger](LONG-PLAY-PROGRAMME.md) remains the implementation record.

## What the owner reported

The owner played the game and found it pleasant, but increasingly boring, sometimes unclear about what to do next, and particularly dull in the final phase. Gameplay is now the priority over graphics. This is qualitative human feedback, not a measured session: duration, speed, exact save state and boat allocations were not reported. Do not treat it as evidence that the pacing acceptance gate has passed, or ask for those measurements before doing useful design work.

Recommendation: turn the established harbour into a place with changing opportunities and people to help. The next release should combine goal continuity, the harbour year and the first partner progression. More permanent upgrades alone will not solve the reported problem.

## What the current game actually does

- `native/festival.js` has four repeatable request templates. Completing either visible offer refreshes both; the repeating rewards are coins. A festival-complete town has no further authored festival stages.
- `native/directions.js` eventually advances ambitions to the next multiple of five commissions/orders or 25 deliveries. Before that, build 14 introduces useful investments, but they remain a finite set of purchases.
- `native/guidance.js` falls back to “Choose your next ambition” after completion. In `native/bridge.js`, the specific festival guidance override stops at stage 4. The repeat requests lack the integrated goal planning and reservations that a new board needs.
- `GameStore.navigate` and `select` clear `directionFocus`. `refresh` can change the displayed category/site while guidance or a direction is active. Thus an activity screen, the player's longer-term intention and the guide's next action are not independent. This is a plausible contributor to the reported confusion, not a reproduced record of the owner's taps.
- Existing stock targets, queues, cargo, ferry services and reservations already provide the machinery for interesting allocation. Retain them. The missing layer is a reason to reconsider allocations, along with clear consequences.

The rebalance was useful groundwork. It did not establish a renewable late game. The earned investment traces cover mill/bakery profiles and the new market/berth; separate branch tests cover all 12 workshop families. Neither proves sustained human enjoyment.

## Research: what to borrow and how to adapt it

This is a review of official descriptions, developer notes and support documentation, not a claim to have personally played these games during this session. Adaptations below are design judgments, not measured evidence that these features will improve Little Harbour.

| Reference and verified mechanic | Useful principle | Little Harbour adaptation |
| --- | --- | --- |
| **Fallout Shelter:** dwellers have suitable jobs, trainable abilities, equipment and expeditions. [Bethesda's developer description](https://apps.apple.com/us/app/fallout-shelter/id991153141). | People can connect production, preparation and exploration. | Develop a small cast of recognizable partners. Their requests unlock capabilities and expedition alternatives. Later, test a few assignable specialists; avoid turning every resident into a staffing chore. |
| **Against the Storm:** its Event Choices redesign gives different approaches different requirements and rewards. The same update adds objective markers distinguishing producing, delivering and other verbs. [Developer design notes](https://eremitegames.com/explorers-choice-update/). | A decision changes both what you commit and what you receive; clear verbs make goals readable. | Let a seasonal problem be solved through different supply/boat plans. Label objectives explicitly: produce, contribute, complete a voyage, or choose. |
| **Spiritfarer:** combines boat-building, exploration, crafting and caring for recurring characters. [Thunder Lotus](https://thunderlotusgames.com/games/spiritfarer/). | Production can serve a person and a story. | Matteo's landing and Lucia's workshop should become recognizable projects, with reactions and lasting changes, rather than anonymous delivery totals. |
| **Hay Day:** town visitors request service at one to three buildings. [Supercell support](https://support.supercell.com/hay-day/en/articles/town-visitors-2.html). | Connected requests give several production chains a shared purpose. | Ferry arrivals can bring a visible visiting group with a coherent itinerary and request chain. Start with a few authored groups, not individual simulation for every passenger. |

Bethesda also documents a dedicated quest entry point through the Overseer's Office: [quest support](https://help.bethesda.net/app/answers/detail/a_id/34926/). Little Harbour similarly needs a recognizable home for goals, reachable from the map. That does not require moving workshop automation or boat dispatch into that board.

Keep the established free, offline, pause-on-exit design. Do not import combat, resident death, destructive incidents, loot boxes, paid acceleration, compulsory daily attendance or settlement resets. These are product boundaries, not criticisms of the reference games.

## First priority: preserve the player's intention

Introduce a single **Goals** entry from the map, with three visible horizons: the chosen project, a relevant opportunity, and something longer to work toward. Unlock these progressively; a new player should still see Elena's clear opening steps. The underlying directory can remain available for browsing systems.

Separate a pinned goal ID from the currently open activity. Selecting a building, returning to the map or inspecting another boat must not abandon the goal. Persist a valid pin with the town's native state; restore a sensible fallback if its stage is complete. A pin is not an authority to spend goods or dispatch boats.

Every goal needs:

1. **Purpose and outcome:** who is asking, what changes on completion, and the important alternative being passed over.
2. **Progress with explicit verbs:** distinguish goods held, goods being made, reserved goods, paid contributions and completed arrivals. Never count a departure as an arrival.
3. **One useful next action:** open the exact workshop or selected boat; show a missing prerequisite if it is locked. Keep the parent goal visible as a breadcrumb.
4. **A real waiting state:** say what is in progress and why. If another independent step is available, offer it; otherwise acknowledge that the chosen step is waiting. Do not invent busywork to hide a timer.
5. **Predictable navigation:** Back returns to the goal and retains relevant selection/scroll context. Status may update while a panel is open, but a background refresh must not unexpectedly move the player into another category.

Illustrative copy, not a live save: “Matteo's landing · prepare repair supplies. Planks are queued; tiles are missing. Open the kiln.” When the second boat can help, show its actual competing job: “Boat 2 is idle. Use it for visitors, or keep it available for building materials.” If both are busy, show that honestly.

Add Plan supplies and Reserve to festival requests as well as new goals. Pinning/accepting an offer must keep its requirements stable when another offer is completed. Existing automatic stock targets and repeat sailings remain where they are, with explicit reservation conflicts and release controls.

## Next gameplay release: a harbour year with people

Develop increments 2 and 3 together, as the programme permits. Seasons should change which plans are attractive. A colour change plus larger shopping lists would repeat the current problem.

**Seasonal board.** Use the programme's proposed approximately 20 simulated minutes per season at 1× as an initial tuning value, not an enjoyment target or wall-clock deadline. Advance only while simulation runs. Show up to three readable opportunities: a supply request, a transport/visitor request, and a choice event. Do not require completing all of them to continue playing.

**Content changes by season.** Spring emphasizes coastal materials and planting/repair stories; summer emphasizes visitors, food and public life; autumn emphasizes preservation and trading preparations; winter emphasizes cloth, furniture and indoor community activities. Requests should exercise different combinations of existing systems, not merely rename the same two ingredients.

**Accepted work survives the calendar.** An accepted goal retains its cost, contributions and reservations across season changes, pausing, saving and reopening. Unaccepted opportunities can rotate with an explicit notice. No lost paid progress or surprise penalties for missing a season. Define and test limits on accepted work before implementing the board.

**Scale to capability, not accumulated wealth.** Generate eligible goals from completed buildings, unlocked production chains and usable boats. Use bounded capacity bands; don't raise every price merely because someone saved coins. Freeze the generated requirements when the offer is created. Exclude impossible recipes and provide prerequisite previews for future goals. The exact bands, costs and rewards need the next numeric proposal and earned-save checks.

**Make choices affect later play.** Supporting a visiting crafts group can expose a craft-focused follow-up; supporting a food gathering can expose a food/visitor follow-up. The player chooses an approach, sees the goods and boats it occupies, and gets a different opportunity afterward. Show alternatives before commitment. Do not hide the consequences behind flavour text.

**Give people continuity.** Retain Matteo, Lucia, Sofia and Nico from `native/story.js`, then introduce the ferry captain through actual ferry work. Their request sequences should have beginnings, choices and payoffs. Follow the planned relationship ladder with genuinely different unlocks: commission access, a bounded benefit, additional commission choice, site cosmetic and personal project. Exact discounts or other economic effects remain unapproved; avoid stacking further unconditional income multipliers.

**Proposed change to the older roadmap:** defer slower winter crossings and the storm/loading penalty in the first playable seasonal release. The owner is already finding waiting dull. Prefer voluntary opportunities with competing commitments first. This is a recommendation requiring agreement, not a silent change to existing route durations.

## How a session could feel

Example of the intended decisions, not implemented content or a measured playthrough:

1. Return to a short summary of actual completed work and the pinned goal. Matteo offers a coastal materials request; Sofia has a visitor-linked opportunity.
2. Choose whose request to pursue and see its outcome. Reserve the critical materials, leaving the other request available for later.
3. Assign one existing boat to the scarce cargo and decide whether another should earn income or carry the requested visitors. Show the real costs and projected returns before dispatch.
4. While that trip runs, Elena routes to a missing ingredient or a separate stage that is actually actionable. Workshop controls keep their inline automation.
5. Complete the contribution and see the partner react. The reward opens a different follow-up or an available service choice, rather than only increasing the coin total.
6. Choose whether to pursue that follow-up or return to the longer project. The next session starts from the chosen intention, not an empty “what now?” screen.

There must be an opportunity cost even for a wealthy automated town, such as which follow-up to pursue or which boat assignment to prioritize. Wealth can legitimately bypass procurement work. Do not manufacture scarcity by removing stock, imposing upkeep or forcing arbitrary delays.

## Give the final phase an authored arc

After the seasonal/partner loop and civic foundation are tested, deliver the chronicle one project at a time, starting with coastal restoration as already planned. Each project should vary the activity between stages: investigate/choose an approach, arrange supplies and transport, resolve a follow-up decision, and reveal the permanent result.

For restoration, a public waterfront and a working landing are possible branches: they would emphasize visitors/community and cargo/craft opportunities respectively. Their exact rewards, costs and art require a dedicated proposal. Neither branch should be the obvious best source of coins. Require two distinct boats at the relevant stage, not every owned boat, so the optional third berth stays optional.

The sea wall, bell tower, school, regatta and other planned projects must introduce different decisions. Delivering a larger pile of goods for eight different pictures would not meet this goal. Full worker assignment and new expedition discoveries are promising later experiments inspired by Fallout Shelter; they expand the current programme and should not delay proving the first seasonal loop. Keep the third destination in its existing later phase.

## Implementation boundaries and proof

Use SwiftUI for goals and partner presentation, SpriteKit for visible results, and the existing JavaScriptCore engine for actual work. Keep a single validated native envelope-4 `chronicle` extension for seasons, partners, standing and projects, with versions 1–3 still loading. Preserve the browser town and explicitly disclose omitted native progress when exporting to the browser.

The current native `reserve`, `plan` and `queuePlan` entry points delegate to shared-engine goal validation. Adding native seasonal goals therefore needs a native goal adapter and reservation accounting; a new button alone will not make this work. Audit any existing “season” terminology in town evolution before exposing a new calendar, so two different concepts do not appear as competing clocks.

Contributions and rewards must be transactional, with saved offer/stage IDs and epochs. Acceptance, expiry/rotation, pinning, selection and projection must not duplicate rewards or spend goods. Production and paid voyages retain their captured terms. Never put new progress in UI preferences, modify an owner's save for tests or backfill invented historical dates.

Next implementation order:

1. Goal continuity, explicit states and exact destination navigation; integrate festival goal help.
2. A complete small seasonal/partner loop with distinct request types and consequences, using an agreed numeric specification. This is the next playable increment, not all later projects at once.
3. Tune it on the modest and wealthy earned towns at 1× and 3×, then deliver civic life and the first chronicle project under the existing staged programme.

Required checks include reload during every offer/stage, accepted-work carryover, reservation contention with automation, stale/double input, paid-voyage completion, old/future save protection, and background pause. Extend both earned campaign branches and replay them in JavaScriptCore. Verify that a player can pin a goal, visit a workshop, inspect another boat, return to the map and resume the same goal on iPhone/iPad, including landscape and large text.

For human acceptance, observe whether the player can name the goal and its next action without help, whether choices change a boat/production plan, whether the rewards alter the next decision, and how much time is only waiting. Record voluntary decisions separately from taps or automated deliveries. Test at both ends of wealth and with automation enabled. If both branches lead to the same plan, or the player only waits for a larger counter, revise the design before adding more content. These are evaluation criteria, not results already achieved.

Graphics should support these decisions first: show the active project on its site, the assigned boat/visiting group, and a meaningful completed change. The larger terrain/art pass can follow. No art or gameplay implementation was changed by this research session.

## Session verification

Loaded the committed maritime festival-complete state and `long-play-ready.json` into the bundled engine in an isolated Node VM. Both reported festival stage 4, “Choose your next ambition”, and the same picnic/workshop request pair. The investment-complete sample offered five-commission and five-neighbourhood-order ambitions. Snapshot reads left each serialized save unchanged. This was a read-only inspection of test fixtures, not the owner's save or a new playtest. Documentation whitespace was checked. No runtime code changed; no new app build, device installation, commit or PR was made, and the application test suite was not rerun for this research-only document.
