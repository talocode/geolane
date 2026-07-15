# GeoLane

**AI Search Visibility Intelligence API** — know if ChatGPT, Claude, Perplexity, and other AI systems can crawl and cite your site.

GeoLane is a [Talocode](https://docs.talocode.site) product. Point it at a URL and get:

- Composite **GEO score + grade**
- **AI crawler access** matrix (GPTBot, ClaudeBot, PerplexityBot, Google-Extended, …)
- **Citation readiness** (structure, schema, E-E-A-T, passage length)
- **llms.txt** detect / score / ready-to-publish draft
- **Domain compare** with winner + insights
- Prioritized **action plan**

> **v0.1** — Deterministic intelligence engine (HTTP + heuristics). No headless browser. Hosted on Talocode Cloud at `/v1/geolane/*`.

---

## Install

```bash
npm install @talocode/geolane
```

```bash
export TALOCODE_API_KEY=tc_...
# optional
export TALOCODE_BASE_URL=https://api.talocode.site
```

---

## Quick start (SDK)

```ts
import { GeoLaneClient } from '@talocode/geolane'

const geo = new GeoLaneClient({ apiKey: process.env.TALOCODE_API_KEY })

const report = await geo.audit({ url: 'https://example.com' })
console.log(report.score, report.grade, report.actions)

const draft = await geo.llmsTxt({ url: 'https://example.com' })
console.log(draft.draft)
```

### Methods

| Method | Credits | Description |
|--------|---------|-------------|
| `health()` | — | Health check |
| `pricing()` | — | Credit pricing |
| `capabilities()` | — | Schema + endpoints |
| `audit({ url })` | 40 | Full GEO audit |
| `crawlers({ url })` | 15 | AI crawler allow/block matrix |
| `llmsTxt({ url })` | 20 | Score + draft llms.txt |
| `citationReadiness({ url })` | 25 | Page citation score |
| `compare({ urlA, urlB })` | 50 | Domain comparison |

### Talocode Cloud SDK

```ts
import { Talocode } from '@talocode/sdk'

const tc = new Talocode({ apiKey: process.env.TALOCODE_API_KEY })
const report = await tc.geolane.audit({ url: 'https://talocode.site' })
```

---

## CLI

```bash
npx geolane audit --url https://example.com
npx geolane crawlers --url https://example.com
npx geolane llms-txt --url https://example.com
npx geolane citation --url https://example.com
npx geolane compare --a https://a.com --b https://b.com
npx geolane pricing
npx geolane capabilities
```

Local engine commands (audit/crawlers/etc.) fetch public URLs from your machine — no API key required for local analysis.

---

## Local server

```bash
GEOLANE_ALLOW_LOCAL_UNAUTH=true pnpm dev
# http://0.0.0.0:3030
```

| Method | Path | Credits |
|--------|------|---------|
| GET | `/health` | — |
| GET | `/v1/geolane/health` | — |
| GET | `/v1/geolane/pricing` | — |
| GET | `/v1/geolane/capabilities` | — |
| POST | `/v1/geolane/audit` | 40 |
| POST | `/v1/geolane/crawlers` | 15 |
| POST | `/v1/geolane/llms-txt` | 20 |
| POST | `/v1/geolane/citation-readiness` | 25 |
| POST | `/v1/geolane/compare` | 50 |

With `TALOCODE_API_KEY` set, POST routes charge Talocode Cloud credits.

---

## Library (offline engine)

```ts
import {
  analyzeCitationReadiness,
  parseRobotsForBot,
  generateLlmsTxt,
  scoreLlmsTxt,
} from '@talocode/geolane'

const citation = analyzeCitationReadiness(html, 'https://example.com')
const draft = generateLlmsTxt({
  domain: 'example.com',
  title: 'Example',
  description: 'Demo site',
  url: 'https://example.com',
})
```

---

## MCP (Talocode Cloud)

When connected to Talocode MCP:

- `geolane_health` / `geolane_pricing` / `geolane_capabilities`
- `geolane_audit` · `geolane_crawlers` · `geolane_llms_txt`
- `geolane_citation_readiness` · `geolane_compare`

---

## Limitations (v0.1)

- HTTP fetch only (no Playwright / JS rendering)
- robots.txt root allow/disallow heuristic
- Does not scrape live ChatGPT/Perplexity answer panels for citations

---

## Talocode ecosystem

Part of **[Talocode](https://github.com/talocode)** — open-source workflow layers for builders. Explore sibling projects:

| Project | What it is |
|---------|------------|
| **[ScreenLane](https://github.com/talocode/screenlane)** | Screen-aware voice command layer |
| **[Tera](https://github.com/talocode/tera)** | AI chat & assistant |
| **[Codra](https://github.com/talocode/codra)** | Local coding agent |
| **[GateLane](https://github.com/talocode/gatelane)** | MCP gateway & agent tool control plane |
| **[ContextLane](https://github.com/talocode/contextlane)** | Context ingestion for persistent agents |
| **[MemoryLane](https://github.com/talocode/memorylane)** | Persistent agent memory |
| **[SignalLane](https://github.com/talocode/signallane)** | X growth intelligence |
| **[ReplyLane](https://github.com/talocode/replylane)** | X reply opportunity intelligence |
| **[CrawlerLane](https://github.com/talocode/crawlerlane)** | Crawler / SEO intelligence |
| **[WebDataLane](https://github.com/talocode/webdatalane)** | Web extraction to structured data |
| **[SearchLane](https://github.com/talocode/searchlane)** | Search layer for agents |
| **[InvoiceLane](https://github.com/talocode/invoicelane)** | Invoicing tools |
| **[GeoLane](https://github.com/talocode/geolane)** | Geo intelligence **(this repo)** |
| **[UgcLane](https://github.com/talocode/ugclane)** | UGC workflows |
| **[OpenSourceLane](https://github.com/talocode/opensourcelane)** | Open-source distribution tools |
| **[StackLane](https://github.com/talocode/stacklane)** | Builder stack platform |
| **[Tradia](https://github.com/talocode/tradia)** | Trading intelligence |
| **[Agent Browser](https://github.com/talocode/agent-browser)** | Browser automation for agents |
| **[Talocode](https://github.com/talocode/talocode)** | Org home & control plane |
| **[Skills](https://github.com/talocode/skills)** | Shared agent skills |
| **[X Agent](https://github.com/talocode/x-agent)** | X automation agent |
| **[LaunchPix](https://github.com/talocode/launchpix)** | Launch tooling |
| **[ForgeCAD](https://github.com/talocode/forgecad)** | CAD workflows |
| **[WorkLane](https://github.com/talocode/worklane)** | Work automation |
| **[ClipLoop](https://github.com/talocode/cliploop)** | Clip / video loops |

MCP-compatible agents integrate via each product's MCP server where available ([Model Context Protocol](https://modelcontextprotocol.io/)).

More: [github.com/talocode](https://github.com/talocode) · [talocode.site](https://talocode.site) · [docs.talocode.site](https://docs.talocode.site)

## License

MIT

## Support

Open-source Talocode products are built and maintained by Abdulmuiz Adeyemo.

Sponsor: https://github.com/sponsors/Abdulmuiz44
