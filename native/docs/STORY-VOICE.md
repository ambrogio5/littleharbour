# Story voice — Step 1, build 11

This native-only pass adds 26 short Elena lines: six chapter openings, six chapter reactions, five festival-stage lines, three waiting remarks and six contextual remarks. The practical action and its requirements remain alongside her voice. Four partners introduce their existing work: Matteo, the Pietra Cove mason; Lucia, the Olive Island chandler; Sofia, the market steward; and Nico, the residents’ spokesperson. No new currency, cost, reward or gameplay unlock is attached to dialogue.

The native header and evolution events both call the town **Porto Lume**. **Olive Island** is used throughout native snapshots, action text, plans, guidance and displayed logs. This is presentation normalization; canonical catalog strings, browser files and exported town data remain unchanged. The application/product name remains Little Harbour (Harbour QA for the isolated development app).

## Memories without invented history

Journal cards derive from existing chapter milestones, the paid residents’ choice, the current town focus, festival completion/theme and retained evolution history. Existing painted art illustrates the cards. The activity log remains below them.

The save contains **no chapter-completion timestamps or separate history of town-focus switches**. It cannot support an exact calendar-dated retrospective timeline without adding storage. To honor the no-save-change boundary, these milestones explicitly say their date was not recorded; only the current town focus is reconstructed. Evolution decisions show their actual saved season. Its retained history is limited to 32 entries and is not a complete lifetime log. Generic evolution effects are labelled as community/waterfront priorities rather than falsely asserting that the native festival or a particular building was completed.

This is a deliberate limit relative to the requested dated memories and direction-change history. Actual historical dates cannot be recovered. A future opt-in journal-history feature would need a separately specified persistence strategy; this pass does not silently invent or store that data in preferences.

## Chapter moments

A newly observed chapter completion displays Elena, the relevant painted landmark and her reaction, with Close and Continue controls. The journal preserves the memory. Loading/importing an established town establishes the observation baseline and does not replay its chapters. Refreshing/dismissing does not pay, grant rewards or change the save. The presentation does not set the simulation’s settings-modal flag, and action/background/checkpoint saves continue normally while it is visible. It adds no animation or flash. Large text can scroll, and VoiceOver receives a focused title while covered game content is hidden from accessibility.

The narrative observer is session-only. Relaunch reconstructs memories from the town rather than restoring a pending popup. A replaced/reset town clears the observer. A later completion can replace an earlier still-open moment; both remain represented by the journal’s milestones.

## Verification

PR 15’s preceding test-helper fix passed GitHub run [41577869073](https://github.com/ambrogio5/littleharbour/actions/runs/41577869073). This branch starts from that unmerged fix, retaining its bounded scrolling helper. Its PR targets `codex/native-ios` as requested, so the dependency commits remain visible until PR 15 is merged.

New coverage verifies deterministic read-only story snapshots, unchanged native exports, one island name, named partners without changed invocation IDs, evidenced chapter/season memories, saving while a celebration is visible, and no celebration replay on import/relaunch. The festival UI test now verifies and dismisses the completion moment before continuing to the request board and journal. Original and festival earned traces retain the same expected economic saves.

Full current test/build results and screenshot evidence are recorded in this step’s PR. Simulator coverage does not certify physical VoiceOver, comfort, thermal behavior or human enjoyment. The following interface, graphics, festival-support, balance and coastal-restoration steps are not represented as implemented by this change.
