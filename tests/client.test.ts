import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { GeoLaneClient, createGeoLaneClient } from '../src/client.js'

void describe('GeoLaneClient', () => {
  void it('creates with apiKey', () => {
    const c = new GeoLaneClient({ apiKey: 'tc_test' })
    assert.ok(c)
  })

  void it('createGeoLaneClient returns client', () => {
    const c = createGeoLaneClient({ apiKey: 'tc_test' })
    assert.ok(c instanceof GeoLaneClient)
  })

  void it('health() calls correct path', async () => {
    let captured = ''
    const orig = globalThis.fetch
    globalThis.fetch = async (url: RequestInfo | URL) => {
      captured = String(url)
      return new Response(JSON.stringify({ ok: true, service: 'geolane', version: '0.1.0' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    }
    try {
      const c = new GeoLaneClient({ apiKey: 'tc_test', baseUrl: 'https://api.talocode.site' })
      const res = await c.health()
      assert.ok(captured.includes('/v1/geolane/health'))
      assert.equal(res.service, 'geolane')
    } finally {
      globalThis.fetch = orig
    }
  })

  void it('audit() calls correct path', async () => {
    let captured = ''
    const orig = globalThis.fetch
    globalThis.fetch = async (url: RequestInfo | URL) => {
      captured = String(url)
      return new Response(JSON.stringify({ score: 80 }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    }
    try {
      const c = new GeoLaneClient({ apiKey: 'tc_test' })
      await c.audit({ url: 'https://example.com' })
      assert.ok(captured.includes('/v1/geolane/audit'))
    } finally {
      globalThis.fetch = orig
    }
  })
})
