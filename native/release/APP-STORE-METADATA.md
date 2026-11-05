# Little Harbour — release metadata draft

Candidate: **1.0.0 (13)**.

Build 13 reclaims unused bottom space for the map and activity pages while retaining home-gesture clearance and full-size touch targets.

Build 11 adds Elena’s chapter/festival voice, four named partners, journal memories from existing milestones, consistent Porto Lume/Olive Island naming and dismissible chapter celebrations. No economy or save-format change. Historical dates absent from the save are explicitly marked unrecorded.

Build 10 adds Chapter 6, Harbour Festival: choose a food fair or craft exhibition, fund its supplies, welcome passengers from both coasts and open a permanently decorated courtyard. A journal memory and repeatable festival requests continue play afterward. Native save version 3 preserves this extension; browser exports omit festival progress while retaining spent goods. Human pacing and physical acceptance remain pending.

Build 9 adds persistent System/Light/Dark appearance, adaptive panels and gently dimmed world artwork, plus a prominent installed-build label in Settings.

Build 8 removes idle feedback spacing, anchors the map between framed top/bottom bars and uses single-row landscape navigation.

Builds 6–7 add a denser landscape layout, extended painted scenery, boat-first cargo/circuit/ferry planning with directional sailing artwork, workshop stock targets up to 24, and three optional town ambitions. Keep 24 is preserved in native saves; browser exports use the browser-compatible maximum of 12. Physical acceptance and final App Store materials remain pending. See `../docs/LANDSCAPE-AND-OPEN-PLAY.md` for scope and limitations.

Release target: **free App Store download**, confirmed by the owner on 1 November 2026. TestFlight remains available for prerelease testing; it is not the chosen final destination. Nothing in this file has been submitted to App Store Connect.

## Product page

- Name: Little Harbour
- Subtitle: Grow a Mediterranean town
- Primary category: Games
- Suggested game categories: Simulation, Strategy
- Language: English (the app is currently English-only)
- Keywords: harbour,harbor,town,cozy,building,trade,farming,island,offline,strategy
- Support URL: https://github.com/ambrogio5/littleharbour/issues
- Privacy policy source: `native/LittleHarbour/Resources/Privacy-policy.txt`. Publish/confirm a permanent public URL before submission; the current review branch’s GitHub file is reviewable but is not a permanent release URL.
- Price: **Free**. No advertising, in-app purchases, subscriptions or paid unlocks are included.
- Territories, final age-rating questionnaire, copyright owner, review contact and trader status: remaining owner decisions; do not infer these from the source repository.

## Build 15 candidate

Adds persistent goals, an optional four-season harbour year, five partner ladders, eight branching civic projects, separate coast saves, and Porto Grande voyages importing glaze for decorated ceramics. The new native envelope 4 is intentionally richer than browser exports. See the expansion verification record before distribution; final device and human acceptance are not implied by this draft.

## Description

Make a little harbour your own.

Begin with a wheat field, a stone mill and a bakery beside a Mediterranean bay. Turn harvests into cargo, earn the supplies for your first workshop, and choose how your town will grow.

Follow five chapters from the working quay to a living coastline, then bring the coast together for a harbour festival. Restore the waterfront, open a market, plant inland terraces and build a fleet. Furnish homes, support your residents’ plans and welcome the first passenger ferry. Choose a food fair or craft exhibition, bring visitors from both shores and earn lasting courtyard decorations.

After the festival, begin a harbour year of optional requests and lasting projects. Help familiar neighbours, reserve supplies for a chosen goal, and decide how eight civic places will grow. Open a city partnership with your own coaster, bring home glaze and make decorated ceramics. Create a separate coast when you want a fresh town while keeping the original.

Every building has its place in a layered, painted town. Pan across the hillside, pinch to explore the coast, and tap a site to see its work. Native controls adapt to iPhone and iPad, with building lists and zoom buttons as alternatives to map gestures.

Play at your own pace. Time pauses when you leave, with no offline penalties or real-time deadlines. The entire game works offline, without accounts, advertising or in-app purchases. Export your town for safekeeping, import a compatible Little Harbour browser save, or review a recovery backup in Settings.

## App Review notes

No login, server, subscription or purchase is required. All gameplay and artwork are included in the binary. The original economic simulation runs locally in Apple’s JavaScriptCore; the app does not download or execute remote code and does not use a web view.

Opening route: Production → Harvest & replant → mill flour → bake bread → Trade → ship cargo. Elena’s Next step card provides focused guidance, including missing ingredients, queued work and choices. Settings & saves includes privacy information, save import/export and backed-up new-town recovery. Native saves and browser-compatible exports are distinct choices.

The iPad interface uses a side inspector when there is sufficient window width. Narrow windows and iPhones use an activity sheet with a Map button. Sites and Explore provide alternatives to pan/pinch gestures. Reduce Motion is respected. Version 1.0 has no audio.

## TestFlight “What to Test”

Please play a new town and report the device model, OS version and app version alongside any problem. Focus on:

1. Elena’s Next step: harvest, flour, bread and cargo; choosing fishing or olives; waiting for queued supplies and resuming a paused town.
2. Repeated taps and switching Production, Trade and Build inside the phone activity panel.
3. Building taps, map zoom/pan, portrait/landscape, iPad split view and large text.
4. Backgrounding during production and voyages, force-quitting after actions, and resuming.
5. Exporting a save to Files, importing it, cancelling replacement, and restoring a dated backup.
6. After the first returned passenger service: Town → Harbour festival. Try both supply themes in separate towns, follow visitor goals, open the festival and fulfil its requests. Confirm progress after relaunch.
7. Longer sessions: warmth, battery use, stutter, text readability and misplaced buildings.

Keep an exported copy before testing recovery. Towns stay on this device; there is no automatic browser/device synchronization.

## Submission gates

Use the checked-in Xcode project and a Release archive with the owner’s final bundle identifier and team. Do not upload the isolated `Harbour QA` identity as the production app. Complete the physical-device matrix and remaining submission checks in `../docs/RELEASE.md`; do not label simulator evidence as device certification.

Apple’s current requirements page states Xcode 26 or later with iOS/iPadOS 26 SDKs or later for uploads from 28 April 2026. The local Xcode 27.1 build exceeds that SDK floor; confirm the chosen Xcode release is accepted by App Store Connect when uploading. Check the current requirements again immediately before submission:
https://developer.apple.com/news/upcoming-requirements/
https://developer.apple.com/app-store/review/guidelines/

App privacy draft: Data Not Collected, based on this binary’s offline implementation. No tracking or advertising identifiers. Confirm against the final signed archive and any added SDKs. Privacy manifest required reasons: system uptime for active-time intervals; UserDefaults for app-only settings. Encryption setting currently declares no non-exempt encryption. Confirm the final product’s questionnaire answers with the owner.

Build-15 acceptance: keep a goal while browsing; reserve supplies while automation runs; finish both boats’ visitor requests; pause/reload at every civic stage; recall and complete city voyages; craft ceramics; switch separate coasts and verify the original town remains intact. Browser exports deliberately omit native progression: retain a native backup.
