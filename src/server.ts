import http from 'node:http'
import crypto from 'node:crypto'
import { config } from './config.js'
import { extractApiKey, validateApiKey, requireAuth } from './auth.js'
import { chargeCredits } from './billing.js'
import {
  GEOLANE_VERSION,
  runGeoAudit,
  runCrawlerAccess,
  runLlmsTxt,
  runCitationReadiness,
  runCompare,
  getGeoLanePricing,
  getGeoLaneCapabilities,
} from './engine.js'

const SERVICE = 'geolane'

const CREDITS = {
  audit: 40,
  crawlers: 15,
  llms_txt: 20,
  citation_readiness: 25,
  compare: 50,
} as const

function jsonResponse(res: http.ServerResponse, status: number, data: unknown, requestId?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (requestId) headers['x-request-id'] = requestId
  res.writeHead(status, headers)
  res.end(JSON.stringify(data))
}

function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')))
    req.on('error', reject)
  })
}

async function handleRequest(req: http.IncomingMessage, res: http.ServerResponse) {
  const requestId = crypto.randomUUID()

  try {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`)
    const method = req.method || 'GET'
    const path = url.pathname

    if (method === 'GET' && (path === '/health' || path === '/v1/geolane/health')) {
      return jsonResponse(
        res,
        200,
        {
          ok: true,
          service: SERVICE,
          version: GEOLANE_VERSION,
          endpoints: getGeoLaneCapabilities().endpoints,
        },
        requestId,
      )
    }

    if (method === 'GET' && path === '/v1/geolane/pricing') {
      return jsonResponse(res, 200, getGeoLanePricing(), requestId)
    }

    if (method === 'GET' && path === '/v1/geolane/capabilities') {
      return jsonResponse(res, 200, getGeoLaneCapabilities(), requestId)
    }

    if (method !== 'POST') {
      return jsonResponse(res, 405, { error: 'Method not allowed' }, requestId)
    }

    const bodyStr = await readBody(req)
    let body: Record<string, unknown>
    try {
      body = JSON.parse(bodyStr || '{}')
    } catch {
      return jsonResponse(res, 400, { error: 'Invalid JSON body' }, requestId)
    }

    let apiKey: string | null = null
    if (!config.allowLocalUnauth) {
      const auth = requireAuth(req)
      apiKey = auth.key
    } else {
      apiKey = extractApiKey(req)
      if (apiKey && !validateApiKey(apiKey)) apiKey = null
    }

    if (apiKey) process.env.TALOCODE_API_KEY = apiKey

    const requireUrl = (): string | null => {
      const u = typeof body.url === 'string' ? body.url.trim() : ''
      return u || null
    }

    switch (path) {
      case '/v1/geolane/audit': {
        const target = requireUrl()
        if (!target) {
          return jsonResponse(res, 422, { error: 'url is required', code: 'VALIDATION_ERROR' }, requestId)
        }
        if (apiKey) {
          const billing = await chargeCredits('geolane.audit', CREDITS.audit, { route: path, url: target })
          if (!billing.success) {
            return jsonResponse(
              res,
              402,
              { error: billing.error, code: 'INSUFFICIENT_CREDITS' },
              requestId,
            )
          }
          const result = await runGeoAudit(target)
          return jsonResponse(res, 200, { ...result, creditsRemaining: billing.remainingCredits }, requestId)
        }
        const result = await runGeoAudit(target)
        return jsonResponse(res, 200, result, requestId)
      }

      case '/v1/geolane/crawlers': {
        const target = requireUrl()
        if (!target) {
          return jsonResponse(res, 422, { error: 'url is required', code: 'VALIDATION_ERROR' }, requestId)
        }
        if (apiKey) {
          const billing = await chargeCredits('geolane.crawlers', CREDITS.crawlers, {
            route: path,
            url: target,
          })
          if (!billing.success) {
            return jsonResponse(
              res,
              402,
              { error: billing.error, code: 'INSUFFICIENT_CREDITS' },
              requestId,
            )
          }
          const result = await runCrawlerAccess(target)
          return jsonResponse(res, 200, { ...result, creditsRemaining: billing.remainingCredits }, requestId)
        }
        const result = await runCrawlerAccess(target)
        return jsonResponse(res, 200, result, requestId)
      }

      case '/v1/geolane/llms-txt': {
        const target = requireUrl()
        if (!target) {
          return jsonResponse(res, 422, { error: 'url is required', code: 'VALIDATION_ERROR' }, requestId)
        }
        if (apiKey) {
          const billing = await chargeCredits('geolane.llms_txt', CREDITS.llms_txt, {
            route: path,
            url: target,
          })
          if (!billing.success) {
            return jsonResponse(
              res,
              402,
              { error: billing.error, code: 'INSUFFICIENT_CREDITS' },
              requestId,
            )
          }
          const result = await runLlmsTxt(target)
          return jsonResponse(res, 200, { ...result, creditsRemaining: billing.remainingCredits }, requestId)
        }
        const result = await runLlmsTxt(target)
        return jsonResponse(res, 200, result, requestId)
      }

      case '/v1/geolane/citation-readiness': {
        const target = requireUrl()
        if (!target) {
          return jsonResponse(res, 422, { error: 'url is required', code: 'VALIDATION_ERROR' }, requestId)
        }
        if (apiKey) {
          const billing = await chargeCredits(
            'geolane.citation_readiness',
            CREDITS.citation_readiness,
            { route: path, url: target },
          )
          if (!billing.success) {
            return jsonResponse(
              res,
              402,
              { error: billing.error, code: 'INSUFFICIENT_CREDITS' },
              requestId,
            )
          }
          const result = await runCitationReadiness(target)
          return jsonResponse(res, 200, { ...result, creditsRemaining: billing.remainingCredits }, requestId)
        }
        const result = await runCitationReadiness(target)
        return jsonResponse(res, 200, result, requestId)
      }

      case '/v1/geolane/compare': {
        const urlA =
          typeof body.urlA === 'string'
            ? body.urlA.trim()
            : typeof body.a === 'string'
              ? body.a.trim()
              : ''
        const urlB =
          typeof body.urlB === 'string'
            ? body.urlB.trim()
            : typeof body.b === 'string'
              ? body.b.trim()
              : ''
        if (!urlA || !urlB) {
          return jsonResponse(
            res,
            422,
            { error: 'urlA and urlB are required', code: 'VALIDATION_ERROR' },
            requestId,
          )
        }
        if (apiKey) {
          const billing = await chargeCredits('geolane.compare', CREDITS.compare, {
            route: path,
            urlA,
            urlB,
          })
          if (!billing.success) {
            return jsonResponse(
              res,
              402,
              { error: billing.error, code: 'INSUFFICIENT_CREDITS' },
              requestId,
            )
          }
          const result = await runCompare(urlA, urlB)
          return jsonResponse(res, 200, { ...result, creditsRemaining: billing.remainingCredits }, requestId)
        }
        const result = await runCompare(urlA, urlB)
        return jsonResponse(res, 200, result, requestId)
      }

      default:
        return jsonResponse(res, 404, { error: 'Not found', code: 'NOT_FOUND' }, requestId)
    }
  } catch (err: unknown) {
    const error = err as { status?: number; body?: string; message?: string }
    if (error.status && error.body) {
      res.writeHead(error.status, { 'Content-Type': 'application/json', 'x-request-id': requestId })
      res.end(error.body)
      return
    }
    const message = error.message || 'Internal server error'
    return jsonResponse(res, 500, { error: message, code: 'INTERNAL_ERROR' }, requestId)
  }
}

const server = http.createServer(handleRequest)

server.listen(config.port, '0.0.0.0', () => {
  console.log(`GeoLane server v${GEOLANE_VERSION} listening on 0.0.0.0:${config.port}`)
})

function shutdown() {
  console.log('GeoLane shutting down...')
  server.close(() => process.exit(0))
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)

export { server }
