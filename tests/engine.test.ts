import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  parseRobotsForBot,
  analyzeCitationReadiness,
  scoreLlmsTxt,
  generateLlmsTxt,
  validatePublicUrl,
  getGeoLanePricing,
  getGeoLaneCapabilities,
  AI_CRAWLERS,
  GEOLANE_VERSION,
} from '../src/engine.js'

void describe('geolane engine', () => {
  void describe('validatePublicUrl', () => {
    void it('accepts https URLs', () => {
      assert.equal(validatePublicUrl('https://example.com/page').hostname, 'example.com')
    })
    void it('rejects localhost', () => {
      assert.throws(() => validatePublicUrl('http://localhost/x'), /private|localhost/i)
    })
  })

  void describe('parseRobotsForBot', () => {
    void it('blocks Disallow: / for GPTBot', () => {
      const robots = `User-agent: GPTBot\nDisallow: /\n`
      const r = parseRobotsForBot(robots, 'GPTBot')
      assert.equal(r.allowed, false)
    })
    void it('allows when no rules', () => {
      const r = parseRobotsForBot('User-agent: *\nDisallow:', 'ClaudeBot')
      assert.equal(r.allowed, true)
    })
  })

  void describe('citation readiness', () => {
    void it('scores rich pages higher than thin', () => {
      const rich = `<!doctype html><html lang="en"><head>
<title>Acme Platform — Product Overview and Guide</title>
<meta name="description" content="Acme helps teams ship AI agents with secure APIs, billing, and observability built in for production." />
<link rel="canonical" href="https://acme.test/product" />
<script type="application/ld+json">{"@type":"Article"}</script>
<meta name="author" content="Ada" />
<meta property="article:published_time" content="2026-01-01" />
</head><body><h1>Acme</h1>${'<p>' + 'word '.repeat(150) + '</p>'.repeat(3)}
<script type="application/ld+json">{"@type":"FAQPage"}</script>
<a href="/docs">Docs</a><a href="/pricing">Pricing</a><a href="/blog">Blog</a>
</body></html>`
      const thin = `<html><body>hi</body></html>`
      const a = analyzeCitationReadiness(rich, 'https://acme.test/p')
      const b = analyzeCitationReadiness(thin, 'https://acme.test/')
      assert.ok(a.score > b.score)
      assert.ok(a.score >= 50)
    })
  })

  void describe('llms.txt', () => {
    void it('scores empty as zero', () => {
      assert.equal(scoreLlmsTxt(undefined).score, 0)
    })
    void it('generates draft', () => {
      const draft = generateLlmsTxt({
        domain: 'acme.test',
        title: 'Acme',
        description: 'Ship faster',
        url: 'https://acme.test/',
      })
      assert.ok(draft.includes('Acme'))
      assert.ok(draft.includes('https://acme.test'))
    })
  })

  void describe('meta', () => {
    void it('version and pricing', () => {
      assert.equal(GEOLANE_VERSION, '0.1.0')
      assert.equal(getGeoLanePricing().credits['geolane.audit'], 40)
      assert.ok(getGeoLaneCapabilities().crawlersTracked.includes('GPTBot'))
      assert.ok(AI_CRAWLERS.length >= 10)
    })
  })
})
