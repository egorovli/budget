#!/usr/bin/env bash
# Downloads the Needle 3 iOS static libraries (Cactus Compute, Apache-2.0) at a pinned
# revision, verifies their SHA-256, and assembles ios/Needle.xcframework by hand, so no
# `xcodebuild -create-xcframework` is needed.
#
# Usage:
#   scripts/fetch-needle.sh
#   NEEDLE_SOURCE_DIR=/path/with/ios-arm64-and-ios-sim-arm64 scripts/fetch-needle.sh
#     (copies already downloaded files instead of downloading; hashes are still verified)
set -euo pipefail

REVISION="d6c7d6a2e9655505e0f8e23339356dd1705900eb"
BASE_URL="https://huggingface.co/Cactus-Compute/needle3/resolve/${REVISION}"

DEVICE_LIB="ios-arm64/libneedle.a"
DEVICE_LIB_SHA256="3e931f1d52319c1396901f3a16244ea47776d18acbf28543b62da408de45158a"
SIMULATOR_LIB="ios-sim-arm64/libneedle.a"
SIMULATOR_LIB_SHA256="75f836ada53fc55cd27a30e0edaea8bf5dcbcca6e30c9f0202fa192db20cea80"
# The header is identical in ios-arm64 and ios-sim-arm64.
HEADER="ios-arm64/needle.h"
HEADER_SHA256="a27dac4b3239eead91d124b7f7dbce5495c13019903fd817b68c16d39b055a99"

MODULE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUTPUT="${MODULE_DIR}/ios/Needle.xcframework"

WORK="$(mktemp -d "${TMPDIR:-/tmp}/needle.XXXXXX")"
trap 'rm -rf "${WORK}"' EXIT

fetch() {
	local relative="$1" destination="$2" expected="$3"
	mkdir -p "$(dirname "${destination}")"
	if [[ -n "${NEEDLE_SOURCE_DIR:-}" ]]; then
		cp "${NEEDLE_SOURCE_DIR}/${relative}" "${destination}"
	else
		curl --fail --location --silent --show-error --output "${destination}" "${BASE_URL}/${relative}"
	fi
	local actual
	actual="$(shasum -a 256 "${destination}" | awk '{print $1}')"
	if [[ "${actual}" != "${expected}" ]]; then
		echo "SHA-256 mismatch for ${relative}: expected ${expected}, got ${actual}" >&2
		exit 1
	fi
	echo "Verified ${relative}"
}

STAGE="${WORK}/Needle.xcframework"
fetch "${HEADER}" "${WORK}/needle.h" "${HEADER_SHA256}"
fetch "${DEVICE_LIB}" "${STAGE}/ios-arm64/libneedle.a" "${DEVICE_LIB_SHA256}"
fetch "${SIMULATOR_LIB}" "${STAGE}/ios-arm64-simulator/libneedle.a" "${SIMULATOR_LIB_SHA256}"

for slice in ios-arm64 ios-arm64-simulator; do
	mkdir -p "${STAGE}/${slice}/Headers"
	cp "${WORK}/needle.h" "${STAGE}/${slice}/Headers/needle.h"
done

cat >"${STAGE}/Info.plist" <<'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>AvailableLibraries</key>
	<array>
		<dict>
			<key>BinaryPath</key>
			<string>libneedle.a</string>
			<key>HeadersPath</key>
			<string>Headers</string>
			<key>LibraryIdentifier</key>
			<string>ios-arm64</string>
			<key>LibraryPath</key>
			<string>libneedle.a</string>
			<key>SupportedArchitectures</key>
			<array>
				<string>arm64</string>
			</array>
			<key>SupportedPlatform</key>
			<string>ios</string>
		</dict>
		<dict>
			<key>BinaryPath</key>
			<string>libneedle.a</string>
			<key>HeadersPath</key>
			<string>Headers</string>
			<key>LibraryIdentifier</key>
			<string>ios-arm64-simulator</string>
			<key>LibraryPath</key>
			<string>libneedle.a</string>
			<key>SupportedArchitectures</key>
			<array>
				<string>arm64</string>
			</array>
			<key>SupportedPlatform</key>
			<string>ios</string>
			<key>SupportedPlatformVariant</key>
			<string>simulator</string>
		</dict>
	</array>
	<key>CFBundlePackageType</key>
	<string>XFWK</string>
	<key>XCFrameworkFormatVersion</key>
	<string>1.0</string>
</dict>
</plist>
EOF

if command -v plutil >/dev/null 2>&1; then
	plutil -lint "${STAGE}/Info.plist" >/dev/null
fi

rm -rf "${OUTPUT}"
mv "${STAGE}" "${OUTPUT}"

# The module map lives outside the xcframework. CocoaPods copies the xcframework headers to a
# second header search path, and two maps for one module fail with "Redefinition of module".
mkdir -p "${MODULE_DIR}/ios/CNeedle"
cat >"${MODULE_DIR}/ios/CNeedle/module.modulemap" <<'EOF'
module CNeedle {
    header "../Needle.xcframework/ios-arm64/Headers/needle.h"
    export *
}
EOF
echo "Assembled ${OUTPUT}"
