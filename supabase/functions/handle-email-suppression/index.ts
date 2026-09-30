import { createClient } from 'npm:@supabase/supabase-js@2'
import { WebhookVerificationError, verifyStandardWebhook } from '../_shared/standard-webhook.ts'

// Resend webhook event payload (https://resend.com/docs/dashboard/webhooks/introduction).
// We only act on bounce/complaint events; everything else is acknowledged and ignored.
interface ResendWebhookEvent {
  type: string
  created_at: string
  data: {
    email_id?: string
    to?: string[]
    from?: string
    subject?: string
    [key: string]: unknown
  }
}

function jsonResponse(data: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function mapEventTypeToReason(type: string): 'bounce' | 'complaint' | null {
  if (type === 'email.bounced') return 'bounce'
  if (type === 'email.complained') return 'complaint'
  return null
}

function mapReasonToStatus(reason: string): 'bounced' | 'complained' | 'suppressed' {
  switch (reason) {
    case 'bounce':
      return 'bounced'
    case 'complaint':
      return 'complained'
    default:
      return 'suppressed'
  }
}

function mapReasonToMessage(reason: string): string {
  switch (reason) {
    case 'bounce':
      return 'Permanent bounce — email address is invalid or rejected'
    case 'complaint':
      return 'Spam complaint — recipient marked email as spam'
    default:
      return 'Email suppressed'
  }
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  const webhookSecret = Deno.env.get('RESEND_WEBHOOK_SECRET')
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!webhookSecret || !supabaseUrl || !supabaseServiceKey) {
    console.error('Missing required environment variables')
    return jsonResponse({ error: 'Server configuration error' }, 500)
  }

  let event: ResendWebhookEvent
  try {
    const verified = await verifyStandardWebhook<ResendWebhookEvent>(req, webhookSecret)
    event = verified.payload
  } catch (error) {
    if (error instanceof WebhookVerificationError) {
      switch (error.code) {
        case 'invalid_signature':
          console.error('Invalid webhook signature')
          return jsonResponse({ error: 'Invalid signature' }, 401)
        case 'stale_timestamp':
        case 'missing_timestamp':
        case 'invalid_timestamp':
          console.error('Invalid or stale webhook timestamp')
          return jsonResponse({ error: 'Invalid timestamp' }, 401)
        case 'invalid_payload':
        case 'invalid_json':
          console.error('Invalid payload', { code: error.code })
          return jsonResponse({ error: 'Invalid payload' }, 400)
        default:
          console.error('Webhook verification failed', { code: error.code, message: error.message })
          return jsonResponse({ error: 'Verification failed' }, 401)
      }
    }
    console.error('Unexpected error during verification', { error })
    return jsonResponse({ error: 'Internal error' }, 500)
  }

  const reason = mapEventTypeToReason(event.type)
  if (!reason) {
    // Event we don't act on (delivered, opened, clicked, etc.) — acknowledge and skip.
    return jsonResponse({ success: true, skipped: true })
  }

  const recipient = event.data.to?.[0]
  if (!recipient) {
    console.error('Suppression event missing recipient', { type: event.type })
    return jsonResponse({ error: 'Missing recipient in payload' }, 400)
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  const normalizedEmail = recipient.toLowerCase()

  // 1. Upsert to suppressed_emails (idempotent — safe for retries)
  const { error: suppressError } = await supabase
    .from('suppressed_emails')
    .upsert(
      {
        email: normalizedEmail,
        reason,
        metadata: event.data ?? null,
      },
      { onConflict: 'email' }
    )

  if (suppressError) {
    console.error('Failed to upsert suppressed email', {
      error: suppressError,
      email_redacted: normalizedEmail[0] + '***@' + normalizedEmail.split('@')[1],
    })
    return jsonResponse({ error: 'Failed to write suppression' }, 500)
  }

  // 2. Append a new log entry for the suppression event (never update existing rows)
  const sendLogStatus = mapReasonToStatus(reason)
  const sendLogMessage = mapReasonToMessage(reason)

  const { error: insertError } = await supabase.from('email_send_log').insert({
    message_id: null,
    template_name: 'system',
    recipient_email: normalizedEmail,
    status: sendLogStatus,
    error_message: sendLogMessage,
    metadata: event.data ?? null,
  })

  if (insertError) {
    // Non-fatal — log and continue. The suppression was already recorded.
    console.warn('Failed to insert email_send_log', { error: insertError })
  }

  console.log('Suppression processed', {
    email_redacted: normalizedEmail[0] + '***@' + normalizedEmail.split('@')[1],
    reason,
    event_type: event.type,
    email_id: event.data.email_id,
  })

  return jsonResponse({ success: true })
})
