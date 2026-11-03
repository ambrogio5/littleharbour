# Increment 1 — economy and meaningful investments

**Approved by the owner, including the compatibility boundary; implemented in QA build 14; human pacing deferred.** Prepared against build 13, `8ddeaed`, 3 November 2026. The supplied long-play prompt explicitly asks for proposed numbers and agreement before changing the catalog. This note is that review gate. [Programme and remaining proposals](LONG-PLAY-PROGRAMME.md).

## Checkout and evidence

The starting checkout was clean on `fix/native-bottom-space`, matching its remote. PR 15's run [41577869073](https://github.com/ambrogio5/littleharbour/actions/runs/41577869073) passed. PR 17's final build-13 run [41587997148](https://github.com/ambrogio5/littleharbour/actions/runs/41587997148) also passed; PR 17 is ready for review, not merged. This branch preserves PRs 15–17 and targets `codex/native-ios`; their unmerged changes remain visible in its aggregate diff.

Source corrections to the handoff: there are **24 recipes**, not 26. Island tier 3 has an **84-second base**: 63 seconds on an unmodified cutter, 105 on a coaster, before sails/pilot improvements. A developed island and expanded-hold coaster currently return **3,519 coins**, including the existing 15% coastal bonus. Cargo volume scales inputs as well as rewards; it is not a free income multiplier.

The two earned festival endpoints contain 1,560 and 2,612 coins, respectively. Their festival continuations took 1,720 and 2,370 simulated seconds. These are scripted reachability results, not human pacing measurements. See the reproducible [current-economy probe](../scripts/long-play-baseline.mjs) and [raw measurements](long-play-baseline.json); it runs isolated copies of committed traces, never the owner's save. The probe's unattended windows measure automation, not decisions or enjoyment. No proposed values below have been playtested.

### Measured baseline, before changes

Each window advances 1,200 simulated seconds, taking 1,200 clock seconds at 1× or 400 at 3×. The probe supplies ticks without real-time sleeping. All time in the window is deliberately unattended: **zero interventions**, not a measurement of a human's decision count. Reload checkpoints verify byte-stable persistence. Full deltas for all 23 goods and source hashes are in the JSON report.

| Starting policy | Speed | Coins start → end | Timber / stone delta | Quarry / island arrivals |
| --- | --- | --- | --- | --- |
| Modest, one cutter; all unlocked Keep 24 targets, island tier 3 repeat | 1× | 1,560 → 1,560 | −100 / 0 | 0 / 0 |
| Same modest start | 3× | 1,560 → 1,560 | −100 / 0 | 0 / 0 |
| Wealthy, coaster to island, cutter to quarry, both tier 3 | 1× | 15,764 → 19,844 | +647 / +918 | 17 / 0 |
| Same wealthy start | 3× | 15,764 → 19,844 | +647 / +918 | 17 / 0 |

Modest setup used 19 actions. The wealthy save was earned from the craft endpoint using 38 setup actions, including 16 materials orders and a second-boat purchase, plus 4,026 simulated preparation seconds. No goods/coins were injected. Setup actions are counted separately from measured windows.

These are stress policies, not optimized play: enabling every target competes for timber and shared queues. The modest policy stalled; the richer policy funded more quarry departures while its island coaster waited. Seventeen quarry returns alone earned 4,080 coins. This does **not** prove that the island route is unprofitable or that every town runs itself. It shows why boat allocation, reservations and guide explanations need to accompany the economy change. Future comparisons must include deliberate supply prioritization and actual people, not merely this unattended policy.

The first probe attempt failed to earn the second boat from a zero-timber start; another earned the boat but stalled below the required 10,000-coin wealthy threshold. The final setup adds real materials trades, retaining both assertions. An attempted selection of an already-selected order was also rejected correctly; the probe now avoids that no-op. These were probe setup failures, not failing game regression tests.

Verification for this proposal: **207/207 browser tests, 22/22 adapter tests**, bundle freshness, all art/source checks, both earned campaign paths and both festival continuations passed. The baseline is reproducible with `node native/scripts/long-play-baseline.mjs --check`. No new Xcode build or physical install is needed for this documentation/probe-only change; build 13's existing passing CI is reported separately from the new PR's checks.

## Approved and implemented numeric changes

Amounts below are base values before cargo scaling and existing eligible bonuses. All existing recipe costs, production times, route cargo costs and route times stay unchanged.

| Existing payout | Before | Build 14 |
| --- | ---: | ---: |
| Olive Island tier 1 coins | 340 | 240 |
| Olive Island tier 2 coins | 425 | 300 |
| Olive Island tier 3 coins | 1,020 | 600 |
| Pietra Cove tier 3 timber / stone | 42 / 54 | 56 / 72 |
| Pietra Cove tier 3 coins | 240 | 240 |
| Island commission: Harbour feast | 720 | 480 |
| Island commission: Roofing the waterfront | 620 | 420 |
| Island commission: Chandlery provisions | 820 | 540 |

Reducing only tier 3 would leave tier 2 dominant: two current tier-2 loads earn 850 coins for the same supplies as tier 3. The proposed 300/600 pair preserves equal coins per input while tier 3 improves throughput (600/84 versus 300/48: 14.3% higher). Tier 1 pays 5 base coins per second, tier 2 pays 6.25, tier 3 pays 7.14; actual supply availability and boat configuration still matter. The commission reductions prevent a large unchanged income bypass; these additional reductions are explicitly part of the requested approval, not assumed permission.

Cap each payout's **currently eligible combined coin bonus at ×1.5**, before its existing rounding. Do not extend a bonus to new transaction types:

| Payment | Current maximum eligible multiplier | Proposed maximum |
| --- | ---: | ---: |
| Regular trade: charter × trading-port focus | 1.62 | 1.5 |
| Market: courtyard × community focus × residents' square | 2.53125 | 1.5 |
| Neighbourhood orders: community × residents' square | 2.025 | 1.5 |
| Island cargo: coastal development | 1.15 | 1.15 |

Passenger fares, contract rewards and other flat rewards retain their current rules. Volume remains separate: a developed island trip with a coaster and expanded hold would return **2,070** coins (600 × 3 × 1.15), not 900. Existing completed investments are retained; no coins or stock are taken away.

### Workshop refits: efficiency or output

Cover the 12 processing stations: mill, bakery, fishing, olive workshop, boatyard, estate, kitchen, kiln, preserving room, weaver, carpenter and sailmaker. Field, clay pit, terraces and flax garden are harvest sites rather than this refit family.

| Purchase per station | Cost | Choose one advanced effect |
| --- | --- | --- |
| Tier 2, after the lighthouse and station are complete | 600 coins, 12 planks, 4 fittings, 8 tiles | Duration ×0.85 **or** output ×1.25 |
| Tier 3, after tier 2 and both coastal development tracks are complete | Additional 1,400 coins, 20 planks, 8 fittings, 16 tiles | Duration ×0.70 **or** output ×1.50 |

Tier 3 replaces tier 2's effect. Effects are relative to the existing paid station setup: legacy speed/queue refits and residents' bonuses remain the baseline. An advanced profile never grants both its speed and yield bonus. This preserves old investments and makes the new choice faster deliveries versus fewer inputs per finished good. Preview the actual duration, batch output and ingredient cost, not just a percentage.

Retuning an owned tier costs **150 coins at tier 2 / 350 at tier 3**, no materials. Restoring the original setup is free and keeps the purchased rank; reactivating a dormant advanced profile uses the same retune fee. Only idle stations can change profiles. Existing queues keep their purchased duration and output. No upgrade timer or new delivery quota.

Yield uses deterministic quarter-unit credits per recipe (0–3 retained quarters, with whole output awarded on completion); e.g. a two-unit recipe at ×1.25 alternates two and three units. Capture the job's paid profile/output entitlement; cancellation refunds actual inputs and must not advance yield credit. Switching, reordering, loading or previewing cannot mint or lose credits. Include pending output in Keep 24 and planner calculations. Require tests for multi-job and cancellation ordering before shipping.

### Third market plot

Unlock after the existing courtyard is finished and both current market businesses exist. Opening the reserved third plot costs **1,000 coins, 24 planks, 16 tiles and 8 furniture**. Choose:

| Business | One order costs | Pays |
| --- | --- | --- |
| Provisioners' stall | 6 bread, 4 preserves, 2 oil | 210 base coins; maximum 315 with eligible bonuses |
| Craft exchange | 4 cloth, 2 furniture | 1 sail and 2 fittings; no coins |

Use existing demand rules: three orders stored, one replenished per 60 simulated seconds, existing eight-second construction. Switching costs **250 coins and 6 planks**, preserves demand and its recovery clock, and requires no reserved order against the old business. Show a direct release-reservation action when blocked. Never refill demand by switching. Put automation on the selected stall, not in a new menu.

### Third boat berth

Unlock after the ferry and both coastal development tracks are complete, with two owned boats. Cost: **4,000 coins, 60 planks, 20 fittings, 80 stone, 24 tiles and 8 sails**. Opens a vacant berth; buying its cutter/coaster uses the existing 240/360-coin hull cost and existing materials. No extra quota or longer construction timer; unlock is one atomic purchase. The third boat is optional; later requirements for “both boats” mean two distinct boats, not all owned boats.

This requires extending the engine's two-slot validators, fleet ticking, route/reservation IDs, browser selection and world anchors, native registry/planner and boat cards. It is not just a catalog constant. The boat-first mission flow and directional navigation sprites remain intact. Third-berth art needs a coherent harbour placement and review, not another menu row.

Across all 12 stations, both advanced ranks cost 24,000 coins; with the new market and berth, the finite investment total is **29,000 coins**, excluding hulls/retunes. This is a set of choices, not proof of lasting gameplay. Wealthy towns may afford it immediately; recurring seasonal decisions in later increments must carry the long game.

## Approved save and browser boundary

Schema 13 strictly rejects a third boat, occupied third market plot and new refit data. Propose **shared town schema 14** for increment 1, with tested migrations from 1–13. This is distinct from **native envelope 4**, reserved for one `chronicle` object in increments 2–5. Keep native envelope 1–3 support; do not invent one new envelope per feature.

Migration preserves every existing town, queue, reservation and paid voyage. Legacy in-flight trips must finish with their captured old reward/duration; new departures use the new values. Migration cannot recompute a paid reward or make a legacy trip fail the new reward validator. Keep recoverable backups; unsupported future versions must protect original bytes. Test the old reader's rejection without overwriting the file.

An old deployed schema-13 browser **cannot read a schema-14 export**. Updated browser code and native code will read it, but deployment is a separate owner-controlled action. Settings must explain this before export. Offer a legacy export only when it is genuinely lossless; otherwise disable that option with a reason, never silently discard a boat or investment. This is a material compatibility boundary included in the proposal, not a claim that today's deployed browser already supports the new sinks.

`dist/*.js` is maintained source here; there is no hidden TypeScript transpilation step. After agreement: edit source, update standalone packaging/cache freshness as needed, run the standalone builder and native bundle generator, regenerate both earned campaign paths and both festival paths. Do not edit the generated native bundle alone or deploy the browser.

## Acceptance before the next increment

1. **Before:** ask the owner to play build 13 on Duo for 15–20 minutes, using the existing town, and report what they chose, where they waited and whether boat allocation mattered. Record missing feedback as pending, never replace it with script counters.
2. **After approval:** implement shared rules, migration, browser interactions and native controls together. Add exhaustive branch/rounding, double-tap, stale-action, reservation, queue/yield-credit, downgrade and in-flight migration tests. Extend earned festival continuations for both choices without injecting goods; reload at every purchase/choice and replay in JavaScriptCore/CI.
3. Run browser tests, adapter tests, bundle/art verification, earned/festival/new traces; iPhone 16 Pro UI tests with the reveal helper, iPad/Duo landscape and large-text/dark checks; unsigned Release build. Read executed test counts and GitHub conclusions. One large simulator at a time. Do not replace assertions with weaker checks.
4. Compare modest and wealthy earned towns at 1×/3×. Record coin/material deltas, blocked chains, boat choices, scripted interventions and idle time separately. Seasons/project-stage measurements begin only when those systems exist. No timer increases to meet a session target.
5. Install a new numbered QA build in place when authorized; report installation and launch separately from playtesting. Request a matching owner after-playtest. Tune based on actual decisions; do not begin increment 2 until this increment's checks and human pacing review are complete.

**Owner decision:** approved the full proposal and compatibility boundary, then directed “go ahead ill test later.” Before-change human testing is deferred; automated implementation and verification may proceed. Human pacing is still unverified.

## Build 14 implementation and evidence — 3 November 2026

All approved values above are implemented in the shared catalog/engine and both native/browser controls. No recipe/route base timer was increased. New boats retain per-boat missions; workshop and market automation stay inline. The selected action comes before its longer explanation. The map objective collapses to a pill, and buildings receive static contact shadows. New sites reuse the current painted sprite families; unique final tier-3/berth art and the terrain repaint are not claimed complete.

The same frozen, earned schema-13 starts are compared under both engines, avoiding a changed starting inventory. Four 1,200-simulated-second unattended windows yield:

| Policy at 1× and 3× | Before | After | Interpretation |
| --- | --- | --- | --- |
| Modest: coins; timber/stone change; quarry/island returns | 1,560→1,560; −100/0; 0/0 | Identical | All-target policy stalls; not proof of a balanced human session. |
| Wealthy: coins; timber/stone change; quarry/island returns | 15,764→19,844; +647/+918; 17/0 | 15,764→19,844; +885/+1,224; 17/0 | Quarry goods increase as approved; competing supply targets starve the island boat. |

Zero interventions occur inside these windows. They are not human decision counts. Both use the same 38-action, 4,026-simulated-second wealthy preparation with 16 materials orders. Route/commission reductions and eligible bonus caps are verified separately in unit tests. [Before](long-play-baseline.json) and [after](long-play-after.json) include source hashes and every stock delta.

Earned continuations from both regenerated festival branches buy all 12 tier-2/tier-3 profiles, change/restore profiles, choose/switch the third stall, open/buy the third berth and sail cargo plus passengers on separate boats. Maritime/food: **743 actions, 8,926 simulated seconds, 37 reloads**. Estate/craft: **729 actions, 10,501 simulated seconds, 37 reloads**. These are scripted reachability traces for the whole optional investment set, not measured 15–20-minute human sessions. No trace injects goods or coins.

Fixture provenance: `legacy-engine-v13.js` and `legacy-festival-campaigns-v13.json` are frozen from commit `f75df1323b1c739acb6c3e1fcf77b05a884ae2b5`. `legacy-paid-voyages.json` contains four deliberately funded **unit-test** fixtures generated with that old engine (cargo on both routes, a circuit and ferry), distinct from earned pacing traces. `long-play-campaigns.json` and `long-play-ready.json` are regenerated through real actions by `long-play-campaign.mjs`; UI tests load these only into isolated test storage.

Verification: 216 browser tests and 24 adapter tests pass, including native/shared transaction equivalence, all 12 stations, old paid voyages, fractional output/cancellation/planning, reservations, stale/double submissions, third-boat modes and actual old-reader rejection. The first full iPhone 16 Pro/iOS 26.5 run passed 45 core tests and 21 of 22 UI tests; the new UI test initially used the wrong dismissal identifier and passed after correction. iPad bottom spacing, appearance and large-text tests passed; the investment test needed its dismissal path adapted to the regular-width inspector. The corrected focused investment test also passed on iPad 13-inch M5/iOS 26.5. Both browser entry points passed real profile restore, inline market automation, third-boat selection and reload checks; the general browser smoke passed at small-phone, phone, tablet and desktop sizes. Final full-run and CI conclusions are recorded in PR #18.

The unsigned Release and development-signed QA builds compile. Physical play, full accessibility, interruptions, sustained performance, battery/thermals and final store materials remain outstanding. The owner deferred human testing: no claim of longer enjoyable sessions, all seven increments complete, or App Store readiness. Increment 2 still needs its own agreed costs/design and the pacing review specified above.

### Older-iOS CI follow-up

The final local iPhone run passed **67/67** tests with zero skips. GitHub run `41661663956` on iPhone 16 Pro/iOS 18.5 passed all **45 core** tests and **21/22 UI** tests. Its failure artifact showed the Town directory’s Refits row at y=817.7…900.4 in an 874-point window: XCUITest reported it hittable, but the tap hit the lower sheet area and never opened Refits. The new test now uses a bounded, held-drag helper for the directory’s actual collection/table view and requires the full row below the navigation bar and above the home area before tapping. It also waits explicitly for the destination panel. Assertions and production code are unchanged. The follow-up CI result is recorded in PR #18.

The development-signed **build 14 installed and launched successfully on Duo**. Read-only save verification confirmed schema 14, native envelope 3, the existing 50 deliveries and completed festival, with the preceding schema-13 backup still present. No reset, uninstall or fixture import was used. This is migration/install evidence, not human pacing or sustained device acceptance.

GitHub run `41667608983` passed the adapter job, all 45 core tests and 21/22 UI tests, including the new investment flow. The older boat-navigation test hit a separate test-helper race: the feedback toast expired between its live existence check and its second frame lookup. The helper now reads inset bounds from one immutable accessibility snapshot, preserving the same occlusion constraints without querying a disappearing element twice. This changes tests only; the installed build 14 is unchanged. Final rerun evidence is recorded in PR #18.

The snapshot fix passed the focused boat test. Its full local rerun passed 66/67 tests (45 core + 21 UI); festival preparation tapped as the preceding four-second feedback inset closed, shifting the measured action position. That test now asserts the previous feedback has gone, reveals the next action, waits for it to be enabled and checks full visibility immediately before tapping. The focused festival rerun passed with its original preparation, theme, supply and ferry-navigation assertions retained. This additional synchronization is test-only; PR #18 records the final CI conclusion.

The next full local run passed 67/67 with zero skips. Hosted run `41673217283` passed 45 core and 21/22 UI tests, including the boat and festival fixes, but the investment test failed before reaching restore. Its captured hierarchy still showed Speed selected after `Original.tap()`. The test now reveals the child segment itself, taps its centre and explicitly waits for Original to be selected before finding the restore action. It retains the restore-enabled assertion and records the pre-selection hierarchy. This test-only follow-up is tracked by its final CI result in PR #18.
