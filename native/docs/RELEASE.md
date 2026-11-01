# Release work still required

This repository delivers a working native beta and reviewable source. It does not deliver an App Store submission, signed archive, physical-device certification, final art approval or a validated full-length commercial campaign.

## Before TestFlight

- Set the owner's bundle identifier and development team; provision/sign a Release archive using the owner's Apple Developer account. An unsigned generic-iOS compile is not an installable IPA.
- Exercise real iPhones and iPads, including the oldest intended supported hardware, with Instruments: frame pacing, memory/texture pressure, battery, thermals, background interruption, system document pickers, share sheets, migration/recovery, long sessions and app termination. Check Stage Manager, split view, orientation and accessibility text sizes.
- Complete a human progression playthrough through all five chapters using earned resources and both specialist paths. Existing engine tests cover much of the progression, but no native full-campaign duration/balance claim is made.
- Finish art direction review against the original approved mockup. The v0.2 painted terrain/building pass is integrated, with source images and prompts committed. Review construction-family reuse, upgraded annex proportions, ground contact and remaining overlaps against the original concept. Add worker, mill-wheel and richer maritime/construction effects plus sound/music; basic production smoke is already present. Confirm asset provenance, rights and commercial terms. Verify map-label/site collisions and near-coast hit targets at every developed layout.
- Review the generated app icon as final branding. The v0.2 icon is a newly generated painted harbour scene; its source and prompt are committed.
- Complete VoiceOver, Reduce Motion, contrast, Switch Control and extreme Dynamic Type testing. Add localization as required for the intended storefronts.

## App Store preparation

- Create the App Store Connect record; supply final name, description, screenshots, age rating, category, support URL, privacy-policy URL and review contact/instructions.
- Review the privacy manifest against the shipping binary and any future SDKs. This build uses monotonic uptime to measure active simulation intervals and declares the corresponding required-reason API. It contains no analytics, advertising, tracking or account service. The monotonic-time declaration follows [Apple’s system boot time required reasons](https://developer.apple.com/documentation/bundleresources/app-privacy-configuration/nsprivacyaccessedapitypes/nsprivacyaccessedapitype). Reconcile App Store privacy answers with the actual signed build.
- Verify current SDK/submission requirements, encryption/export declarations, all artwork/audio rights and applicable commercial terms at submission time. No claim of App Review approval is made here; use the current [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/) at release time.
- Decide premium purchase/distribution details. StoreKit, payments, achievements, Game Center, iCloud and multiplayer are not implemented. The existing game has no such runtime systems to port.
- Preserve the economy version and native wrapper version independently; add explicit migrations before accepting newer versions. Keep the native bundle and art manifest checks required in CI.

## Explicit beta limitations

The UI exposes the existing game's systems, including advanced actions, through native activity panels. It does not reproduce every browser presentation convenience: persistent pinned goals, three browser target-preset slots, and a named town editor remain absent. Native plain-browser import starts new evolution history because browser evolution lives under a separate storage key. Camera preferences are session-only. There is no automatic synchronization between browser and native saves.

Campaign pacing, final art approval, advanced activity animation and authored-site placement remain release limitations despite the integrated painted-art pass. This port does not silently reclassify those as finished production content. Existing browser play remains on main until the user separately chooses to merge; no deployment changes or automatic merge are part of this work.
