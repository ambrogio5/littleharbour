# Build 20: a harbour that is easier to manage

Three improvements build on the exact-task guidance from build 19.

## Live voyage checklist

Accepted passenger requests and civic transport stages show each boat's contribution: completed, qualifying trip underway, idle, or busy on an unrelated trip. The tracker reads the engine's registered departure slots; merely being at sea does not count. Trips begun before acceptance, recalls and the wrong mission type are excluded. Distinct boats and the windy coast's two-shore requirement remain unchanged.

When enough qualifying journeys are underway, the instruction becomes “wait for their return” and the boat shortcut opens a travelling boat. Otherwise it selects an unused boat and the missing destination. Timers are game seconds, with no offline progress. The checklist does not dispatch or recall anything automatically.

## Supply plans that lead to production

“Queue available production” appears before the requirements list. Each missing recipe links to its workshop with the exact recipe in view, including when the player previously used Stock targets or a search filter. “All at this workshop,” choosing Stock targets, browsing another activity or tapping another building clears this temporary focus. The existing planner still validates ingredients, queue capacity and reservations; recipes with unfinished ingredients do not start early.

## Harbour now

An expandable overview in Goals → Today shows accepted requests, active civic projects, tasks ready to finish, each boat and current production. Review links open the relevant task without spending supplies or replacing the saved pin. Boat links select the individual berth; production links open the existing queue controls. Entries stay in catalog/berth order rather than reshuffling with each timer tick.

## Compatibility and verification

Only presentation fields were added to snapshots. Save envelopes, the shared schema, costs, rewards and browser gameplay are unchanged. The economy probe's only change is the bundled source fingerprint.

Regression coverage includes qualifying/earlier/wrong-type voyages, two distinct boats, both coasts, recalls, save-read purity, preview without spending or repinning, workshop navigation and clearing recipe focus. UI tests cover the three new flows alongside existing task/pin and crew navigation. Test towns are synthetic and isolated from player storage. See the PR and local build verification for executed results; simulator testing and successful installation are not full physical-device or App Store acceptance.
