# Version 1.0 graphics and UI polish

Candidate: **1.0.0 (4)**, prepared for a **free App Store download**. No advertising, purchases, subscriptions, upload, submission, merge or browser deployment is included.

## Changes

- Twenty-four painted goods/coin icons extend the existing Mediterranean buildings into inventory, supply plans and the header. Exact generated source/prompt and deterministic packing are committed under `art-source/resources-v1`.
- Illustrated district and town activity lists retain native scrolling, accessible buttons and descriptive text.
- The chapter card uses less map space while preserving direct objective navigation and expandable guidance.
- Map labels resolve collisions with selected sites first and ready harvests next. Sites focuses the actual building, including its current boat position. The ocean outside the terrain has subtle chart waves; moving boats leave a wake, disabled under Reduce Motion.
- Active bottom destinations and simulation speed now expose explicit accessibility state. Resource images are decorative; text and quantities remain accessible.

The original economy, save schema and browser source are unchanged by this pass. Existing safe migration, atomic writes, dated recovery backups and remembered camera views remain in place.

## Verification

The first complete iPhone 18 Pro / iOS 27 simulator run passed all 37 existing tests with the new UI and artwork. Three additional native tests cover label precedence, complete packaged resource artwork and site camera targeting. Final test results are recorded on PR #14 and in the local release receipt. Screenshots are actual simulator captures; developed-town images use the existing deterministic gameplay fixture, with no composited gameplay claims.

Reproduce the complete suite using the commands in `../README.md`. The checked-in Xcode project needs no asset-generation service or XcodeGen to build. CI also checks economy bundle freshness, art/source hashes, adapter parity and both earned campaign traces.

## Remaining release gates

Physical-device testing is deferred at the owner's request, including performance, thermals, real document/share pickers and hardware accessibility. A signed isolated QA archive is not a distribution export or installability certificate. The production developer team/bundle identifier, App Store record, public privacy URL, owner/contact details, territories, ratings and final privacy/export answers still need completion. The app is English-only and silent; construction art shares three families and ordinary upgrades use annexes. No App Store acceptance or human pacing certification is claimed.
