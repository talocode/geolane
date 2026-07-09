import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'

const PORT = 3039

function request(
  method: string,
  path: string,
  body?: unknown,
  apiKey?: string,
): Promise<{ status: number; data: unknown }> {
  return new Promise((resolve, reject) => {
    const opts: http.RequestOptions = {
      hostname: '127.0.0.1',
      port: PORT,
      path,
      method,
      headers: { 'Content-Type': 'application/json' } as Record<string, string>,
    }
    if (apiKey) (opts.headers as Record<string, string>).Authorization = `Bearer ${apiKey}`
    const req = http.request(opts, (res) => {
      const chunks: Buffer[] = []
      res.on('data', (chunk: Buffer) => chunks.push(chunk))
      res.on('end', () => {
        const raw = Buffer.concat(chunks).toString('utf-8')
        let data: unknown
        try {
          data = JSON.parse(raw)
        } catch {
          data = raw
        }
        resolve({ status: res.statusCode || 0, data })
      })
    })
    req.on('error', reject)
    if (body !== undefined) req.write(JSON.stringify(body))
    req.end()
  })
}

void describe('geolane server', () => {
  let server: http.Server

  before(async () => {
    process.env.PORT = String(PORT)
    process.env.GEOLANE_ALLOW_LOCAL_UNAUTH = 'true'
    const mod = await import('../src/server.js')
    server = mod.server
    await new Promise<void>((resolve) => server.on('listening', resolve))
  })

  after(() => {
    server.close()
    delete process.env.PORT
    delete process.env.GEOLANE_ALLOW_LOCAL_UNAUTH
  })

  void it('GET /health returns 200', async () => {
    const res = await request('GET', '/health')
    assert.equal(res.status, 200)
    const d = res.data as Record<string, unknown>
    assert.equal(d.ok, true)
    assert.equal(d.service, 'geolane')
    assert.equal(d.version, '0.1.0')
  })

  void it('GET pricing and capabilities', async () => {
    const pricing = await request('GET', '/v1/geolane/pricing')
    assert.equal(pricing.status, 200)
    assert.equal((pricing.data as { credits: Record<string, number> }).credits['geolane.audit'], 40)

    const caps = await request('GET', '/v1/geolane/capabilities')
    assert.equal(caps.status, 200)
    assert.ok((caps.data as { endpoints: string[] }).endpoints.some((e) => e.includes('/audit')))
  })

  void it('POST audit without auth returns 401 when unauth disabled', async () => {
    process.env.GEOLANE_ALLOW_LOCAL_UNAUTH = 'false'
    const res = await request('POST', '/v1/geolane/audit', { url: 'https://example.com' })
    assert.equal(res.status, 401)
    process.env.GEOLANE_ALLOW_LOCAL_UNAUTH = 'true'
  })

  void it('POST audit requires url', async () => {
    const res = await request('POST', '/v1/geolane/audit', {})
    assert.equal(res.status, 422)
  })

  void it('POST missing route returns 404', async () => {
    const res = await request('POST', '/v1/geolane/nope', {})
    assert.equal(res.status, 404)
  })
})
