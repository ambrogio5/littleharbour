# Release hardening — native 0.2.0 build 3

This pass prepares a TestFlight candidate. It does not claim App Store readiness, successful device installation, human campaign certification or App Review approval.

## Improvements

- Invalid imports clear any previously prepared replacement. A dedicated confirmation state prevents SwiftUI alert dismissal from changing the pending town during view updates.
- Start a new town uses the same validation, confirmation, exact backup and atomic replacement as imports. Cancelling leaves both live and saved towns unchanged.
- Reads stop at 150 KB before parsing, including document-picker and backup imports. Oversized corrupt originals remain exportable and can be recovered through a verified streaming backup. New saves above the supported limit cannot overwrite a valid town.
- New backups encode their creation time in the filename, appear newest first and display readable dates. Older UUID backups remain available. File timestamp APIs are no longer requested. Backup and export files receive the same iOS file-protection setting as the primary save.
- Sites now opens a searchable native directory with painted thumbnails and construction states. It avoids the live-updating long menu that produced intermittent invalid accessibility hit points. Selection resolves the current entity and opens its relevant activity after the directory dismisses.
- Native map controls now sit in a toolbar outside the SpriteKit surface, addressing inaccessible overlay hit regions found by CI on iOS 18.5. The persistence UI test compares the saved wheat inventory instead of depending on how quickly the runner pauses a growing field.
- A paused simulation no longer republishes unchanged snapshots every half second. Actions still refresh/save immediately, and the monotonic clock continues resetting so resuming does not catch up paused time.
- Exported files use distinct temporary folders, preventing a later export from changing an earlier share-sheet attachment.
- Settings now includes an offline privacy policy, public project support link and the version/build from the actual application bundle.
- Build settings support a separate QA identifier and display name. The local archive/export helper checks engine, artwork and campaign freshness and never uploads anything.

## Earned campaign verification

`native/scripts/campaign.mjs` starts two fresh towns. One takes the maritime path and public garden; the other takes the estate path and commercial square. Both reach completed passenger service through actual harvests, production, cargo, contracts, charter, waterfront, market, inland, fleet, lighthouse, neighbourhood, home furnishings, sail refits and residents’ deliveries.

No coins, inventory or unlock flags are injected. Every exposed native action and simulated time step is checked against the original browser economy. Saves reload throughout construction, supply deliveries and paid voyages. The committed action traces are replayed through Apple's JavaScriptCore in the application test host and compared with the complete earned final economy.

| Path | Player actions | Save/reload checkpoints | Earned ordinary deliveries |
| --- | ---: | ---: | ---: |
| Maritime | 605 | 35 | 56 |
| Estate | 647 | 35 | 40 |

This establishes reachability, cost/progression parity and persistence. Accelerated automated play does not measure human playtime, balance, enjoyment or on-device battery use.

## Verification record

Local environment: Xcode 27.1, Swift 6.4 in Swift 5 language mode, iOS deployment target 17.0.

- Browser regression suite: **207/207 passed**.
- Native adapter suite: **8/8 passed**, including 290 transaction scenarios compared through both ESM and the generated bundle.
- Bundle/art manifests and committed earned campaign trace checks: **passed**.
- Native recovery/engine tests: **23/23 passed**, including both complete campaigns in JavaScriptCore.
- Focused final iPhone recovery/privacy UI tests: **2/2 passed**. The privacy screen also passed XCTest’s sufficient-element-description and trait audits. This is not a full VoiceOver/contrast/Switch Control audit.
- Smaller iPhone 17e, iOS 26.5: **26/26 passed** (23 engine/recovery and three UI checks for AX5 text, gestures/landscape and new-town recovery). The full pre-toolbar iPhone 18 Pro and iPad Pro 11-inch (M5) suites each passed **33/33** on iOS 27.0. The final toolbar/directory iPad run also passed **33/33**. After the paused-refresh optimization, the final-source iPad engine suite plus site search, ferry, developed navigation and save/relaunch checks passed **27/27**. See PR #14’s current verification/checks for subsequent full iPhone and remote runs; these counts describe the evidence available when this report was committed.
- Local Release QA archive: **succeeded**. Codesign verification passed; offline privacy policy and privacy manifest are present; archive includes debug symbols. App bundle is approximately 44 MiB on disk, not an App Store download-size measurement.
- Release helper shell syntax: **passed**. Archive/export through the final production account, IPA export and App Store upload are unverified.

The previous remote run on Xcode 16.4 / iOS 18.5 built successfully and passed all 14 then-existing native tests, but four UI tests failed: three inaccessible map-menu hit regions and one timing-dependent harvest assertion. Those failures prompted the toolbar and inventory-persistence changes above; the updated remote run must pass before the PR is considered green.

The initial new-town UI test failed because it expected an offscreen lazy-list row to exist without scrolling. It also exposed a view-update publication warning in the original alert-binding pattern. The final flow separates alert presentation state, waits for the successful replacement message, and scrolls to the recovery action. The focused replacement/privacy rerun passed without that warning.

Local result artifacts (not committed):

- `/tmp/littleharbour-release-recovery-review.xcresult`
- `/tmp/littleharbour-release-directory-iphone.xcresult` (before paused-refresh optimization)
- `/tmp/littleharbour-release-final-iphone.xcresult` (before toolbar/directory changes)
- `/tmp/littleharbour-release-directory-ipad.xcresult` (before paused-refresh optimization)
- `/tmp/littleharbour-release-paused-ipad.xcresult` (final-source 27-test verification)
- `/tmp/littleharbour-release-final-ipad.xcresult` (before toolbar/directory changes)
- `/tmp/littleharbour-release-small-phone.xcresult`
- `.artifacts/LittleHarbour-QA-0.2.0-3.xcarchive`

## Physical-device and distribution gates

The Mac has a valid development signing identity. A generic-device QA build and archive signed successfully with the separate `Harbour QA` identifier. These facts do **not** imply device-install or distribution readiness.

Installation on the paired iPhone initially failed because the device was locked. The paired iPad was reachable, but installation rejected the cached provisioning profile. Inspection showed that none of the three paired physical devices is included in that profile. A device-specific build with automatic provisioning then reported **“No Accounts”** in Xcode and that the profile excludes the selected iPad.

The owner needs to add the Apple Developer account in Xcode Settings → Accounts, provision the intended devices and leave a test device unlocked. No account credentials, private key or signing team is committed. No physical gameplay, Instruments frame pacing, memory, thermals, battery or interruption measurements have been completed. Do not cite simulator tests as hardware certification.

Before external TestFlight or App Store release, also complete a human playthrough, final art/provenance review, oldest supported hardware/OS and full accessibility checks, permanent public privacy URL, final app identity and App Store Connect metadata. The current app is English-only and silent; audio, final commercial art approval and the other explicit beta limitations in `RELEASE.md` remain open.

No browser source, deployed assets or publish workflow changed in this pass. No PR was merged and nothing was uploaded to App Store Connect.

## Actual simulator captures

These are unedited running-app screenshots, not concept renderings or App Store uploads:

- [Searchable site directory on iPad](screenshots/release-site-directory-ipad.png)
- [Landscape town and inspector](screenshots/release-ipad-landscape.png)
- [Dated recovery backups](screenshots/release-save-recovery-ipad.png)
