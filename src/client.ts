export class GeoLaneError extends Error {
  code?: string
  status?: number
  details?: string

  constructor(message: string, options?: { code?: string; status?: number; details?: string }) {
    super(message)
    this.name = 'GeoLaneError'
    this.code = options?.code
    this.status = options?.status
    this.details = options?.details
  }
}

export class GeoLaneAuthError extends GeoLaneError {
  constructor(message = 'Authentication failed', details?: string) {
    super(message, { code: 'UNAUTHORIZED', status: 401, details })
    this.name = 'GeoLaneAuthError'
  }
}

export class GeoLaneInsufficientCreditsError extends GeoLaneError {
  constructor(message = 'Insufficient credits', details?: string) {
    super(message, { code: 'INSUFFICIENT_CREDITS', status: 402, details })
    this.name = 'GeoLaneInsufficientCreditsError'
  }
}

export class GeoLaneValidationError extends GeoLaneError {
  constructor(message = 'Validation failed', details?: string) {
    super(message, { code: 'VALIDATION_ERROR', status: 400, details })
    this.name = 'GeoLaneValidationError'
  }
}

export interface GeoLaneClientOptions {
  apiKey?: string
  baseUrl?: string
}

export class GeoLaneClient {
  private apiKey: string | undefined
  private baseUrl: string

  constructor(options: GeoLaneClientOptions = {}) {
    this.apiKey = options.apiKey || process.env.TALOCODE_API_KEY
    this.baseUrl = (
      options.baseUrl ||
      process.env.TALOCODE_BASE_URL ||
      'https://api.talocode.site'
    ).replace(/\/+$/, '')
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (this.apiKey) {
      headers.Authorization = `Bearer ${this.apiKey}`
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })

    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as {
        error?: string
        code?: string
        details?: string
      }
      if (response.status === 401) throw new GeoLaneAuthError(data.error, data.details)
      if (response.status === 402) throw new GeoLaneInsufficientCreditsError(data.error, data.details)
      if (response.status === 400 || response.status === 422) {
        throw new GeoLaneValidationError(data.error, data.details)
      }
      throw new GeoLaneError(data.error || `Request failed (${response.status})`, {
        code: data.code,
        status: response.status,
        details: data.details,
      })
    }

    return (await response.json()) as T
  }

  health() {
    return this.request<{ ok: boolean; service: string; version: string }>('GET', '/v1/geolane/health')
  }

  pricing() {
    return this.request<Record<string, unknown>>('GET', '/v1/geolane/pricing')
  }

  capabilities() {
    return this.request<Record<string, unknown>>('GET', '/v1/geolane/capabilities')
  }

  audit(input: { url: string }) {
    return this.request<Record<string, unknown>>('POST', '/v1/geolane/audit', input)
  }

  crawlers(input: { url: string }) {
    return this.request<Record<string, unknown>>('POST', '/v1/geolane/crawlers', input)
  }

  llmsTxt(input: { url: string }) {
    return this.request<Record<string, unknown>>('POST', '/v1/geolane/llms-txt', input)
  }

  citationReadiness(input: { url: string }) {
    return this.request<Record<string, unknown>>('POST', '/v1/geolane/citation-readiness', input)
  }

  compare(input: { urlA: string; urlB: string }) {
    return this.request<Record<string, unknown>>('POST', '/v1/geolane/compare', input)
  }
}

export function createGeoLaneClient(options?: GeoLaneClientOptions) {
  return new GeoLaneClient(options)
}
