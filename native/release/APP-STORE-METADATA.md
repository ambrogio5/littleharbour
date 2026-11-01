# Little Harbour — release metadata draft

Prepared for a TestFlight beta first. Nothing in this file has been submitted to App Store Connect.

## Product page

- Name: Little Harbour
- Subtitle: Grow a Mediterranean town
- Primary category: Games
- Suggested game categories: Simulation, Strategy
- Language: English (the app is currently English-only)
- Keywords: harbour,harbor,town,cozy,building,trade,farming,island,offline,strategy
- Support URL: https://github.com/ambrogio5/littleharbour/issues
- Privacy policy source: `native/LittleHarbour/Resources/Privacy-policy.txt`. Publish/confirm a permanent public URL before submission; the current beta branch’s GitHub file is reviewable but is not a permanent release URL.
- Price, territories, final age-rating questionnaire, copyright owner, review contact and trader status: owner decisions; do not infer these from the source repository.

## Description

Make a little harbour your own.

Begin with a wheat field, a stone mill and a bakery beside a Mediterranean bay. Turn harvests into cargo, earn the supplies for your first workshop, and choose how your town will grow.

Follow five chapters from the working quay to a living coastline. Restore the waterfront, open a market, plant inland terraces and build a fleet. Furnish homes, support your residents’ plans and welcome the first passenger ferry.

Every building has its place in a layered, painted town. Pan across the hillside, pinch to explore the coast, and tap a site to see its work. Native controls adapt to iPhone and iPad, with building lists and zoom buttons as alternatives to map gestures.

Play at your own pace. Time pauses when you leave, with no offline penalties or real-time deadlines. The entire game works offline, without accounts, advertising or in-app purchases. Export your town for safekeeping, import a compatible Little Harbour browser save, or review a recovery backup in Settings.

## App Review notes

No login, server, subscription or purchase is required. All gameplay and artwork are included in the binary. The original economic simulation runs locally in Apple’s JavaScriptCore; the app does not download or execute remote code and does not use a web view.

Opening route: Production → Harvest & replant → mill flour → bake bread → Trade → ship cargo. The current chapter objective provides continuing guidance. Settings & saves includes privacy information, save import/export and backed-up new-town recovery. Native saves and browser-compatible exports are distinct choices.

The iPad interface uses a side inspector when there is sufficient window width. Narrow windows and iPhones use an activity sheet with a Map button. Sites and Explore provide alternatives to pan/pinch gestures. Reduce Motion is respected. There is no audio in this beta.

## TestFlight “What to Test”

Please play a new town and report the device model, OS version and app version alongside any problem. Focus on:

1. First harvest, flour, bread and cargo; selecting fishing or olives; continuing chapter objectives.
2. Building taps, map zoom/pan, portrait/landscape, iPad split view and large text.
3. Backgrounding during production and voyages, force-quitting after actions, and resuming.
4. Exporting a save to Files, importing it, cancelling replacement, and restoring a dated backup.
5. Longer sessions: warmth, battery use, stutter, text readability and misplaced buildings.

Keep an exported copy before testing recovery. Towns stay on this device; there is no automatic browser/device synchronization.

## Submission gates

Use the checked-in Xcode project and a Release archive with the owner’s final bundle identifier and team. Do not upload the isolated `Harbour QA` identity as the production app. Complete the physical-device matrix and art review in `../docs/RELEASE.md`; do not label simulator evidence as device certification.

Apple’s current requirements page states Xcode 26 or later with iOS/iPadOS 26 SDKs or later for uploads from 28 April 2026. The local Xcode 27.1 build exceeds that SDK floor; confirm the chosen Xcode release is accepted by App Store Connect when uploading. Check the current requirements again immediately before submission:
https://developer.apple.com/news/upcoming-requirements/
https://developer.apple.com/app-store/review/guidelines/

App privacy draft: Data Not Collected, based on this binary’s offline implementation. No tracking or advertising identifiers. Confirm against the final signed archive and any added SDKs. Privacy manifest required reasons: system uptime for active-time intervals; UserDefaults for app-only settings. Encryption setting currently declares no non-exempt encryption. Confirm the final product’s questionnaire answers with the owner.
