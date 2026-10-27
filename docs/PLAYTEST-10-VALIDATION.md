# Playtest 10 validation

Implemented the planning and inland-chain slices together. Automated suite: 86 tests passing. Standalone build succeeds.

## Automated coverage

- Both specialist paths progress from a fresh town through the waterfront, market, three local orders, inland access, terraces, kiln, preserves export and courtyard using earned resources.
- Save version 8 migration, invalid phase/recipe rejection, reservation protection, construction payment once, pause and reload.
- Independent crop choices, shared kiln capacity, crop-specific preserving recipes and shared-output target accounting.
- Ledger explanations, escaped search values, target presets, station-specific queue indices, district construction visibility and courtyard payouts.
- The sample town parses as a valid save and returns independent state.

## Browser checks

- Existing main town loaded after migration with its previous 4566 coins and inventory intact.
- In the separate sample town, queued jars completed, ledger search remained filtered, a production plan was saved and applied, a preserves export returned 216 coins / 8 timber / 6 stone, and courtyard construction completed.
- Market displayed upgraded rewards of 75 fish-order coins and 113 provisions-order coins. Reload retained the completed courtyard and chapter 5 progress.
- Returning to the original town retained its original coins and inventory.
- Checked desktop district navigation and phone-width (390 × 844) ledger controls. Browser error log was empty during the checked flow.
- Fixed the saved-plans disclosure collapsing when a batch completed. Replaced flat crop placeholders with matching photographic orchard/garden layers.

## Remaining limits

This is browser responsive-layout testing, not physical iPhone/iPad validation. Accelerated timers are retained; long-session pacing, new-player comprehension and sustained device performance have not been established. Terraces use fixed plots and crop choices cannot yet be changed. Tiles currently fund one courtyard improvement. Fleet logistics remains the next roadmap milestone.
