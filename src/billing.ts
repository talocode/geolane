import crypto from 'node:crypto'
import { config } from './config.js'

export interface BillingResult {
  success: boolean
  remainingCredits?: number
  error?: string
}

export async function chargeCredits(
  action: string,
  credits: number,
  metadata?: Record<string, unknown>,
): Promise<BillingResult> {
  const apiKey = process.env.TALOCODE_API_KEY
  if (!apiKey) {
    return { success: false, error: 'TALOCODE_API_KEY not configured' }
  }

  const idempotencyKey = crypto.randomUUID()

  try {
    const response = await fetch(`${config.talocodeBaseUrl}/api/v1/cloud/usage/charge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify({
        product: 'geolane',
        action,
        credits,
        metadata: {
          product: 'geolane',
          action,
          credits,
          ...metadata,
        },
      }),
    })

    if (response.status === 401) {
      return { success: false, error: 'Invalid or expired TALOCODE_API_KEY' }
    }

    if (response.status === 402) {
      const body = (await response.json().catch(() => ({}))) as { error?: string }
      return { success: false, error: body.error || 'Insufficient credits' }
    }

    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as { error?: string }
      return { success: false, error: body.error || `Billing failed (${response.status})` }
    }

    const body = (await response.json().catch(() => ({}))) as {
      remainingCredits?: number
      remaining?: number
      wallet?: { balance_credits?: number }
    }
    return {
      success: true,
      remainingCredits:
        body.remainingCredits ?? body.remaining ?? body.wallet?.balance_credits,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Billing request failed'
    return { success: false, error: message }
  }
}
