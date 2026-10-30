# Roadmap implementation evidence

Base: main `cf9fa15a0880654329f1fa13c79876d1cc515b1a` (v0.19.0), verified 30 October 2026.
Baseline: 163 Node tests pass. Existing main tests and Pages run succeeded independently.

## Increment 1: Save protection and publication gate

- Dedicated persistence boundary validates writes and locks after failed reads, parse failures, quota failures or competing-tab changes. An empty saved string is also protected.
- Exact original bytes remain in the primary slot until an explicit import/reset/restore; those actions require a verified, separate backup before replacement. Backups are never automatically pruned. If storage fills, replacement stops; export remains available.
- The first write after a valid load archives the exact source before normalization/migration. No change to the version 13 schema or valid player progression.
- Recovery dialog and persistent recovery button offer original-byte export, import, backup export/restore and reload. Gameplay pauses while the save is protected. Unknown future versions fail explicitly.
- Timer validation uses a bounded one-day persistence limit rather than current balance durations; preserves paid remaining work when recipes/refits change. Structural, resource, unlock and capacity validation still apply.
- Rendering does not save. Writes occur after user actions (deduplicated), at 15-second simulation checkpoints, and on visibility/pagehide. No offline catch-up is added.
- Pages calls the same reusable test workflow as PRs and has `needs: test`. Syntax, Node regressions, browser smoke and standalone packaging must pass before publication.

Validation: 172 Node tests pass. Real Chromium viewport tests at 390×844, 1024×768 and 1440×900 pass. Additional real-browser recovery regressions exercise exact-byte export, dialog dismissal, action clicks, lifecycle flushes, reload and explicit backed-up replacement for empty, malformed and future-version saves.

Limitations: localStorage cannot provide an atomic compare-and-swap across simultaneously executing tabs. Comparison detects prior competing writes; avoid editing the same town in multiple tabs. Device backups share browser storage and are not a substitute for downloaded exports. Abrupt process termination can lose at most the work since the last successful checkpoint; browser lifecycle events are best-effort.
