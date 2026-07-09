## GeoLane v0.1.1 — AI Search Visibility Intelligence

Know whether ChatGPT, Claude, Perplexity, and other AI systems can **crawl and cite** your site — and get a fix list.

### Install (any device with Node 18+)

```bash
npm install -g @talocode/geolane
# or one-liner
curl -fsSL https://raw.githubusercontent.com/talocode/geolane/main/install.sh | bash
```

**Windows (PowerShell):**
```powershell
irm https://raw.githubusercontent.com/talocode/geolane/main/install.ps1 | iex
```

Works on **Linux, macOS, Windows, Android (Termux), iOS (iSH / node), ChromeOS, WSL** via npm or the portable Node package.

### Standalone binaries (no Node required)

| Platform | Asset |
|----------|--------|
| Linux ARM64 | `geolane-linux-arm64` / `geolane-v0.1.1-linux-arm64.tar.gz` |
| Linux x64 | `geolane-linux-x64` / `geolane-v0.1.1-linux-x64.tar.gz` |
| macOS Intel | `geolane-macos-x64` / `geolane-v0.1.1-macos-x64.tar.gz` |
| macOS Apple Silicon | `geolane-macos-arm64` / `geolane-v0.1.1-macos-arm64.tar.gz` |
| Windows x64 | `geolane-win-x64.exe` / `geolane-v0.1.1-win-x64.zip` |
| Portable (Node) | `geolane-v0.1.1-portable-node.tar.gz` / `.zip` |

```bash
# Linux ARM64 example
curl -fsSL -o geolane https://github.com/talocode/geolane/releases/download/v0.1.1/geolane-linux-arm64
chmod +x geolane && sudo mv geolane /usr/local/bin/
geolane audit --url https://example.com
```

### CLI

```bash
geolane audit --url https://example.com
geolane crawlers --url https://example.com
geolane llms-txt --url https://example.com
geolane citation --url https://example.com
geolane compare --a https://a.com --b https://b.com
geolane pricing
```

### Cloud API (Talocode)

```
POST /v1/geolane/audit                 40 credits
POST /v1/geolane/crawlers              15 credits
POST /v1/geolane/llms-txt              20 credits
POST /v1/geolane/citation-readiness    25 credits
POST /v1/geolane/compare               50 credits
```

Auth: `Authorization: Bearer $TALOCODE_API_KEY`

### Demo

See **geolane-demo.mp4** in this release.

### Links

- npm: https://www.npmjs.com/package/@talocode/geolane
- Repo: https://github.com/talocode/geolane
- Cloud base: https://api.talocode.site
