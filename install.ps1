# GeoLane Windows Installer
$ErrorActionPreference = "Stop"
$REPO = "talocode/geolane"
$VERSION = if ($env:GEOLANE_VERSION) { $env:GEOLANE_VERSION } else { "v0.1.1" }
$PKG = "@talocode/geolane"

Write-Host "==> GeoLane Installer ($VERSION)" -ForegroundColor Cyan
Write-Host ""

$node = Get-Command node -ErrorAction SilentlyContinue
$npm = Get-Command npm -ErrorAction SilentlyContinue
if ($npm) {
    Write-Host "==> Node.js detected — installing $PKG globally..." -ForegroundColor Green
    npm install -g $PKG
    Write-Host ""
    Write-Host "==> Done! Run: geolane --help" -ForegroundColor Green
    exit 0
}

# Try Windows native SEA binary
$asset = "geolane-win-x64.exe"
$url = "https://github.com/$REPO/releases/download/$VERSION/$asset"
$dest = Join-Path $env:TEMP "geolane.exe"
try {
    Write-Host "==> Downloading $asset..." -ForegroundColor Cyan
    Invoke-WebRequest -Uri $url -OutFile $dest -UseBasicParsing
    Write-Host ""
    Write-Host "==> Downloaded to $dest" -ForegroundColor Green
    Write-Host "    Move it to a folder on your PATH, or run it directly."
    Write-Host "    Example: & `"$dest`" --help"
    exit 0
} catch {
    Write-Host "==> Binary download failed." -ForegroundColor Yellow
}

Write-Host "==> Install Node.js from https://nodejs.org then run:" -ForegroundColor Yellow
Write-Host "    npm install -g $PKG"
Write-Host ""
Write-Host "    Portable zip: https://github.com/$REPO/releases/download/$VERSION/geolane-v$($VERSION.TrimStart('v'))-portable-node.zip"
Write-Host "    Cloud API:    https://api.talocode.site/v1/geolane/health"
Write-Host "    GitHub:       https://github.com/$REPO"
exit 1
