#!/bin/bash
# Local-only signed archive/export; never uploads, submits or changes the browser deployment.
set -euo pipefail
cd "$(dirname "$0")/../.."
: "${HARBOUR_TEAM_ID:?Set HARBOUR_TEAM_ID to your Apple Developer team.}"
: "${HARBOUR_APP_ID:?Set HARBOUR_APP_ID to the final app identifier, or a separate QA identifier.}"
HARBOUR_RELEASE_KIND="${HARBOUR_RELEASE_KIND:-qa}"
HARBOUR_OUTPUT="${HARBOUR_OUTPUT:-$PWD/.artifacts/native-release}"
case "$HARBOUR_RELEASE_KIND" in qa) HARBOUR_EXPORT_METHOD=debugging; HARBOUR_NAME='Harbour QA';; store) HARBOUR_EXPORT_METHOD=app-store-connect; HARBOUR_NAME='Little Harbour';; *) echo 'HARBOUR_RELEASE_KIND must be qa or store.' >&2; exit 2;; esac
if [[ "$HARBOUR_APP_ID" == com.littleharbour.game ]]; then
  echo 'Choose an owner-controlled identifier instead of the repository placeholder.' >&2; exit 2
fi
if [[ "$HARBOUR_RELEASE_KIND" == store && "$HARBOUR_APP_ID" == *.qa ]]; then
  echo 'Use the production identifier for a store archive, not the isolated QA app.' >&2; exit 2
fi
node native/scripts/bundle-engine.mjs --check
node native/scripts/verify-art.mjs
node native/scripts/campaign.mjs --check
node native/scripts/festival-campaign.mjs --check
node native/scripts/long-play-campaign.mjs --check
node native/scripts/chronicle-campaign.mjs --check
node native/scripts/city-campaign.mjs --check
node --test native/scripts/bridge.test.mjs native/scripts/chronicle.test.mjs
npm test
mkdir -p "$HARBOUR_OUTPUT"
xcodebuild -project native/LittleHarbour.xcodeproj -scheme LittleHarbour \
  -configuration Release -destination 'generic/platform=iOS' \
  -archivePath "$HARBOUR_OUTPUT/LittleHarbour.xcarchive" \
  -derivedDataPath "$HARBOUR_OUTPUT/DerivedData" \
  "DEVELOPMENT_TEAM=$HARBOUR_TEAM_ID" "HARBOUR_BUNDLE_IDENTIFIER=$HARBOUR_APP_ID" \
  "HARBOUR_DISPLAY_NAME=$HARBOUR_NAME" -allowProvisioningUpdates archive
export HARBOUR_EXPORT_METHOD HARBOUR_TEAM_ID HARBOUR_OUTPUT
python3 - <<'PY'
import os, plistlib
settings = dict(method=os.environ['HARBOUR_EXPORT_METHOD'], destination='export',
                signingStyle='automatic', teamID=os.environ['HARBOUR_TEAM_ID'],
                manageAppVersionAndBuildNumber=False, stripSwiftSymbols=True)
with open(os.path.join(os.environ['HARBOUR_OUTPUT'],'ExportOptions.plist'),'wb') as f:
    plistlib.dump(settings,f)
PY
xcodebuild -exportArchive -archivePath "$HARBOUR_OUTPUT/LittleHarbour.xcarchive" \
  -exportOptionsPlist "$HARBOUR_OUTPUT/ExportOptions.plist" \
  -exportPath "$HARBOUR_OUTPUT/Export" -allowProvisioningUpdates
printf 'Local archive and export complete: %s\n' "$HARBOUR_OUTPUT"
printf 'Nothing uploaded. Review device tests, metadata and privacy before distribution.\n'
