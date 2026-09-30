// Generic "Standard Webhooks" (https://www.standardwebhooks.com/) verifier.
// Both Supabase Auth Hooks and Resend's webhook events sign requests this way,
// so this one module replaces the Lovable-proprietary @lovable.dev/webhooks-js
// package for every webhook this app receives.

export class WebhookVerificationError extends Error {
  code: 'invalid_signature' | 'missing_timestamp' | 'invalid_timestamp' | 'stale_timestamp' | 'invalid_payload' | 'invalid_json'
  constructor(code: WebhookVerificationError['code'], message: string) {
    super(message)
    this.code = code
    this.name = 'WebhookVerificationError'
  }
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}

/**
 * Verifies a Standard Webhooks-signed request (webhook-id / webhook-timestamp /
 * webhook-signature headers) against `secret` (a `whsec_...` value, as issued by
 * Supabase Auth Hooks or Resend). Returns the parsed JSON body on success.
 */
export async function verifyStandardWebhook<T = unknown>(
  req: Request,
  secret: string
): Promise<{ payload: T; id: string; timestamp: string }> {
  const body = await req.text()
  const id = req.headers.get('webhook-id')
  const timestamp = req.headers.get('webhook-timestamp')
  const signatureHeader = req.headers.get('webhook-signature')

  if (!id || !timestamp) {
    throw new WebhookVerificationError('missing_timestamp', 'Missing webhook-id or webhook-timestamp header')
  }
  if (!signatureHeader) {
    throw new WebhookVerificationError('invalid_signature', 'Missing webhook-signature header')
  }

  const timestampNum = parseInt(timestamp, 10)
  if (Number.isNaN(timestampNum)) {
    throw new WebhookVerificationError('invalid_timestamp', 'Invalid webhook-timestamp header')
  }
  const nowSeconds = Math.floor(Date.now() / 1000)
  const toleranceSeconds = 5 * 60
  if (Math.abs(nowSeconds - timestampNum) > toleranceSeconds) {
    throw new WebhookVerificationError('stale_timestamp', 'Webhook timestamp outside tolerance window')
  }

  const secretRaw = secret.startsWith('whsec_') ? secret.slice('whsec_'.length) : secret
  let secretBytes: Uint8Array
  try {
    secretBytes = Uint8Array.from(atob(secretRaw), (c) => c.charCodeAt(0))
  } catch {
    throw new WebhookVerificationError('invalid_signature', 'Malformed webhook secret')
  }

  const signedContent = `${id}.${timestamp}.${body}`
  const key = await crypto.subtle.importKey(
    'raw',
    secretBytes,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sigBuffer = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signedContent))
  const expectedSig = btoa(String.fromCharCode(...new Uint8Array(sigBuffer)))

  // Header can contain multiple space-delimited "v1,<base64-sig>" values.
  const candidateSigs = signatureHeader
    .split(' ')
    .map((part) => part.split(',')[1])
    .filter((s): s is string => Boolean(s))

  const matches = candidateSigs.some((sig) => timingSafeEqual(sig, expectedSig))
  if (!matches) {
    throw new WebhookVerificationError('invalid_signature', 'Signature verification failed')
  }

  let parsed: T
  try {
    parsed = JSON.parse(body) as T
  } catch {
    throw new WebhookVerificationError('invalid_json', 'Invalid JSON body')
  }

  return { payload: parsed, id, timestamp }
}
