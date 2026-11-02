# Device-feedback improvement pass · 1.0.0 (5)

This pass addresses confusing repeated taps, clumsy navigation, unclear next tasks, the missing guide/inhabitants, boat art and camera range. The deployed browser game and its original economy are unchanged.

## Interaction and guidance

Elena’s persistent Next step card is derived from the authoritative engine and current action registry. It routes to actual production, trade, construction, contracts, waterfront, market, inland, fleet, neighbourhood, residents and ferry work. Missing goods lead to an available upstream recipe where possible; existing incoming production is counted. Choices remain choices. Guidance changes after actions and completed work, while the current chapter remains visible for context.

The focused panel removes action search and availability filters, shows relevant actions and goal supplies, explains waiting, and offers Resume when paused. Browse all activities remains available. Production, Trade and Build can be switched inside the phone sheet; Map remains a direct return. Successful action feedback and a 650 ms shared cooldown prevent repeated taps from spending twice or triggering a different action newly placed under the same finger. Legitimate repeated batches work after the cooldown. The engine still revalidates every transaction.

Building selection covers the roof as well as the centre. Pans and pinches must fail before a tap can select; additional taps cannot reopen panels during modal navigation. The searchable Sites directory remains the accessible alternative.

## Living town and view

Eight new transparent assets add Elena, farmer, docker, vendor, cutter, coaster and an upgraded version of each hull. Boats on the map and fleet cards use the actual owned type and upgrade state. Decorative coastal traffic uses the same art family. People appear along routes near the opening workshops, quay, developed market and homes. Animation is restrained translation/facing/bobbing, pauses with the town, and becomes static with Reduced Motion. These are decorative residents; no extra workers, wages or resource generation have been added.

Whole town is available directly in the map toolbar. The fitted view adds coastal margins, maximum manual zoom scale increases from 8 to 16, and pan bounds extend from 1800×2700 to 2400×3400. The original 1800×2700 terrain and saved building coordinates remain intact: this is a larger navigable view, not additional buildable land. Camera preference version 2 accepts version 1 for migration; economic saves remain native version 1 / browser version 13.

## Verification

See the final validation record below. Test towns are isolated from player saves. No App Store upload is part of this pass.

## Limits before release

This build still needs hands-on phone/iPad acceptance, particularly sustained play, touch feel, performance, interruptions and VoiceOver with a person. Automated checks establish correctness and reachability, not enjoyment or pacing. The guide supports the existing milestones but is not a general planner for every optional redevelopment or unusual reservation arrangement; the full action panels and project plans remain available.

The people use single-frame painted sprites, not skeletal or multi-frame walking animations. Sail refits and hull upgrades share one upgraded appearance per boat type. Existing building-art reuse remains as documented in the painted-art provenance. This version remains English-only and silent. Final distribution signing, owner details/privacy URL, store metadata/ratings/regions and App Store review remain release requirements.
