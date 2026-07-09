#!/usr/bin/env bash
# GeoLane installer — Linux / macOS / Android (Termux) / ChromeOS / WSL
set -euo pipefail

REPO="talocode/geolane"
VERSION="${GEOLANE_VERSION:-v0.1.1}"
PKG="@talocode/geolane"

echo "==> GeoLane Installer ($VERSION)"
echo ""

OS=$(uname -s | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)

# Prefer npm when Node is available (works on Android Termux, iOS iSH, etc.)
if command -v npm &>/dev/null; then
  echo "==> Node.js/npm detected — installing $PKG globally..."
  npm install -g "$PKG"
  echo ""
  echo "==> Done! Run: geolane --help"
  echo "    Or: npx geolane audit --url https://example.com"
  exit 0
fi

asset=""
case "$OS/$ARCH" in
  linux/aarch64|linux/arm64) asset="geolane-linux-arm64" ;;
  linux/x86_64|linux/amd64)  asset="geolane-linux-x64" ;;
  darwin/arm64)              asset="geolane-macos-arm64" ;;
  darwin/x86_64)             asset="geolane-macos-x64" ;;
esac

if [[ -n "$asset" ]]; then
  echo "==> Downloading $asset..."
  url="https://github.com/$REPO/releases/download/$VERSION/$asset"
  dest="${TMPDIR:-/tmp}/geolane"
  if curl -fsSL "$url" -o "$dest"; then
    chmod +x "$dest"
    echo ""
    echo "==> Downloaded to $dest"
    echo "    Install: sudo mv $dest /usr/local/bin/geolane"
    echo "    Then:    geolane --help"
    exit 0
  fi
  echo "==> Binary download failed; falling back to portable package guidance."
fi

echo "==> Install Node.js 18+, then:"
echo "    npm install -g $PKG"
echo ""
echo "    Or download portable (any OS with Node):"
echo "    https://github.com/$REPO/releases/download/$VERSION/geolane-v${VERSION#v}-portable-node.tar.gz"
echo ""
echo "    Cloud API (no install): https://api.talocode.site/v1/geolane/health"
echo "    Docs: https://github.com/$REPO"
exit 1
