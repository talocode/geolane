#!/usr/bin/env bash
# Build GeoLane multi-platform release assets
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

VERSION="${VERSION:-0.1.1}"
NODE_VERSION="${NODE_VERSION:-24.15.0}"
OUT="$ROOT/release-assets"
CACHE="$ROOT/.cache/node-bins"
mkdir -p "$OUT" "$CACHE" "$ROOT/dist"

echo "==> Building TypeScript"
npm run build

echo "==> Bundling CLI (CJS for SEA)"
npx --yes esbuild src/cli.ts \
  --bundle \
  --platform=node \
  --format=cjs \
  --target=node18 \
  --outfile=dist/cli.bundle.cjs \
  --legal-comments=none

# Portable pure-JS CLI for any Node environment (Android Termux, iOS iSH, etc.)
cp dist/cli.bundle.cjs dist/geolane-portable.js
# prepend shebang for portable use
printf '%s\n' '#!/usr/bin/env node' | cat - dist/cli.bundle.cjs > dist/geolane-portable.cjs
chmod +x dist/geolane-portable.cjs

echo "==> Writing SEA config"
cat > sea-config.json <<EOF
{
  "main": "dist/cli.bundle.cjs",
  "output": "sea-prep.blob",
  "disableExperimentalSEAWarning": true,
  "useSnapshot": false,
  "useCodeCache": false
}
EOF

echo "==> Generating SEA blob"
node --experimental-sea-config sea-config.json

# node_platform|asset_name|family (linux|darwin|win)
PLATFORMS=(
  "linux-arm64|geolane-linux-arm64|linux"
  "linux-x64|geolane-linux-x64|linux"
  "darwin-x64|geolane-macos-x64|darwin"
  "darwin-arm64|geolane-macos-arm64|darwin"
  "win-x64|geolane-win-x64.exe|win"
)

download_node() {
  local platform="$1"
  local dest="$2"
  local url
  if [[ "$platform" == win-x64 ]]; then
    url="https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-win-x64.zip"
    local zip="$CACHE/node-win-x64.zip"
    if [[ ! -f "$zip" ]]; then
      echo "  downloading $url"
      curl -fsSL "$url" -o "$zip"
    fi
    rm -rf "$CACHE/node-win-x64"
    mkdir -p "$CACHE/node-win-x64"
    unzip -q -o "$zip" -d "$CACHE/node-win-x64"
    cp "$CACHE/node-win-x64/node-v${NODE_VERSION}-win-x64/node.exe" "$dest"
  else
    url="https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-${platform}.tar.gz"
    local tgz="$CACHE/node-${platform}.tar.gz"
    if [[ ! -f "$tgz" ]]; then
      echo "  downloading $url"
      curl -fsSL "$url" -o "$tgz"
    fi
    rm -rf "$CACHE/node-${platform}"
    mkdir -p "$CACHE/node-${platform}"
    tar -xzf "$tgz" -C "$CACHE/node-${platform}"
    cp "$CACHE/node-${platform}/node-v${NODE_VERSION}-${platform}/bin/node" "$dest"
  fi
}

echo "==> Building platform binaries"
for entry in "${PLATFORMS[@]}"; do
  IFS='|' read -r platform asset family <<< "$entry"
  echo "--> $asset ($platform)"
  bin="$OUT/$asset"
  raw="$CACHE/node-raw-$platform"
  if [[ ! -f "$raw" ]]; then
    download_node "$platform" "$raw"
  fi
  cp "$raw" "$bin"
  chmod +x "$bin" 2>/dev/null || true

  if [[ "$family" == "darwin" ]] && command -v codesign &>/dev/null; then
    codesign --remove-signature "$bin" 2>/dev/null || true
  fi

  if [[ "$family" == "darwin" ]]; then
    if ! npx --yes postject "$bin" NODE_SEA_BLOB sea-prep.blob \
      --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2 \
      --macho-segment-name NODE_SEA; then
      echo "  WARN: postject failed for $platform"
      rm -f "$bin"
      continue
    fi
  else
    if ! npx --yes postject "$bin" NODE_SEA_BLOB sea-prep.blob \
      --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2; then
      echo "  WARN: postject failed for $platform"
      rm -f "$bin"
      continue
    fi
  fi

  case "$platform" in
    linux-arm64)
      tar -C "$OUT" -czf "$OUT/geolane-v${VERSION}-linux-arm64.tar.gz" "$asset"
      ;;
    linux-x64)
      tar -C "$OUT" -czf "$OUT/geolane-v${VERSION}-linux-x64.tar.gz" "$asset"
      ;;
    darwin-x64)
      tar -C "$OUT" -czf "$OUT/geolane-v${VERSION}-macos-x64.tar.gz" "$asset"
      ;;
    darwin-arm64)
      tar -C "$OUT" -czf "$OUT/geolane-v${VERSION}-macos-arm64.tar.gz" "$asset"
      ;;
    win-x64)
      if command -v zip &>/dev/null; then
        (cd "$OUT" && zip -q "geolane-v${VERSION}-win-x64.zip" "$asset")
      else
        tar -C "$OUT" -czf "$OUT/geolane-v${VERSION}-win-x64.tar.gz" "$asset"
      fi
      ;;
  esac
  echo "  ok $(du -h "$bin" | cut -f1)"
done

# Portable Node package for any OS (Android Termux, iOS iSH, ChromeOS, etc.)
PORTABLE_DIR="$OUT/geolane-portable"
rm -rf "$PORTABLE_DIR"
mkdir -p "$PORTABLE_DIR"
cp dist/geolane-portable.cjs "$PORTABLE_DIR/geolane.js"
cat > "$PORTABLE_DIR/package.json" <<EOF
{
  "name": "geolane-cli",
  "version": "${VERSION}",
  "bin": { "geolane": "./geolane.js" },
  "private": true
}
EOF
cat > "$PORTABLE_DIR/geolane" <<'EOF'
#!/usr/bin/env bash
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
exec node "$SCRIPT_DIR/geolane.js" "$@"
EOF
cat > "$PORTABLE_DIR/geolane.cmd" <<'EOF'
@echo off
node "%~dp0geolane.js" %*
EOF
chmod +x "$PORTABLE_DIR/geolane" "$PORTABLE_DIR/geolane.js"
(cd "$OUT" && tar -czf "geolane-v${VERSION}-portable-node.tar.gz" geolane-portable)
(cd "$OUT" && zip -qr "geolane-v${VERSION}-portable-node.zip" geolane-portable)

echo "==> Copy install scripts"
cp "$ROOT/install.sh" "$OUT/install.sh" 2>/dev/null || true
cp "$ROOT/install.ps1" "$OUT/install.ps1" 2>/dev/null || true

echo "==> Release assets:"
ls -lh "$OUT"
echo "DONE"
