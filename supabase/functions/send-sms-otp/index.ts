import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ── CORS (inlined — dashboard single-file deploys can't resolve relative
//    imports to _shared/, so this lives in every function instead) ──────
const ALLOWED_ORIGINS = (
  Deno.env.get('ALLOWED_ORIGINS') ??
  'https://alpenglowglobal.com,https://www.alpenglowglobal.com'
)
  .split(/[,\s]+/)
  .map((s) => s.trim())
  .filter(Boolean)

function corsFor(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin')
  const allow =
    origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allow,
    'Vary': 'Origin',
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type, x-crm-token',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
}

// ── OTP rate limiter (inlined for the same reason) ────────────────────
// deno-lint-ignore no-explicit-any
async function otpRateLimited(sb: any, contact: string, type: 'sms' | 'email'): Promise<string | null> {
  const now = Date.now()
  const { count: burst } = await sb
    .from('otp_verifications').select('id', { count: 'exact', head: true })
    .eq('contact', contact).eq('type', type)
    .gte('created_at', new Date(now - 45_000).toISOString())
  if ((burst ?? 0) >= 1) return 'Please wait a moment before requesting another code.'

  const { count: hourly } = await sb
    .from('otp_verifications').select('id', { count: 'exact', head: true })
    .eq('contact', contact).eq('type', type)
    .gte('created_at', new Date(now - 3_600_000).toISOString())
  if ((hourly ?? 0) >= 5) return 'Too many codes requested. Please try again later.'

  return null
}

// Normalise any phone format → 12-digit international (91XXXXXXXXXX)
// Accepts: +91 98765 43210 / 9876543210 / 919876543210 / +919876543210
function normalisePhone(raw: string): string {
  const digits = raw.replace(/[^\d]/g, '')
  if (digits.length === 10)  return '91' + digits          // bare 10-digit
  if (digits.length === 12 && digits.startsWith('91')) return digits
  if (digits.length === 11 && digits.startsWith('0'))  return '91' + digits.slice(1)
  return digits
}

serve(async (req) => {
  const corsHeaders = corsFor(req)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { phone, purpose = 'general', metadata = {} } = await req.json()

    if (!phone) {
      return new Response(
        JSON.stringify({ error: 'Phone number is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const normPhone = normalisePhone(phone)
    if (normPhone.length < 10) {
      return new Response(
        JSON.stringify({ error: 'Enter a valid Indian WhatsApp number' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ── Validate WhatsApp credentials before touching the DB ──
    const phoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID') ?? ''
    const accessToken   = Deno.env.get('WHATSAPP_ACCESS_TOKEN') ?? ''
    const templateName  = Deno.env.get('WHATSAPP_TEMPLATE_NAME') ?? ''
    // Must match the template's approved language EXACTLY (check WhatsApp
    // Manager → Message Templates → your template's Language column).
    // Meta's plain "English" option is backed by the locale code 'en_US',
    // not the bare code 'en' — sending the wrong one causes error #132018
    // ("issue with the parameters in your template").
    const templateLang  = Deno.env.get('WHATSAPP_TEMPLATE_LANG') || 'en_US'

    if (!phoneNumberId || !accessToken) {
      console.error('[send-sms-otp] WhatsApp credentials not set')
      throw new Error('WhatsApp service not configured. Contact support.')
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // ── Rate limit (anti-spam / anti-cost-abuse) ──────────────
    const limited = await otpRateLimited(supabase, normPhone, 'sms')
    if (limited) {
      return new Response(
        JSON.stringify({ error: limited }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const code      = String(Math.floor(1000 + Math.random() * 9000))
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

    // Clear only EXPIRED unverified OTPs (keep recent ones so the
    // rate limiter above can still see them on the next request).
    await supabase
      .from('otp_verifications')
      .delete()
      .eq('contact', normPhone)
      .eq('type', 'sms')
      .eq('verified', false)
      .lt('expires_at', new Date().toISOString())

    const { error: dbErr } = await supabase
      .from('otp_verifications')
      .insert({
        contact:    normPhone,
        type:       'sms',
        code,
        purpose,
        metadata,
        expires_at: expiresAt,
      })

    if (dbErr) throw dbErr

    // ── Meta WhatsApp Cloud API ───────────────────────────────

    const apiUrl = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`

    // ── Choose message type ───────────────────────────────────
    // PRODUCTION: set WHATSAPP_TEMPLATE_NAME to your approved
    //             authentication template name.
    //
    // TESTING:    leave WHATSAPP_TEMPLATE_NAME empty — sends a
    //             plain text message (works for test phone numbers
    //             added in Meta Developer Console).

    let payload: object

    // TEMP debug — confirms exactly what secrets this invocation actually
    // sees, since Meta has rejected name/language combos that worked before.
    console.log('[send-sms-otp] Using template:', JSON.stringify({
      templateName, templateLang, phoneNumberId, hasToken: !!accessToken,
    }))

    if (templateName) {
      // Approved authentication template
      // Template body must contain one variable {{1}} for the code.
      // If your template also has a "Copy Code" button, include the
      // button component below; otherwise remove it.
      payload = {
        messaging_product: 'whatsapp',
        to:   normPhone,
        type: 'template',
        template: {
          name:     templateName,
          language: { code: templateLang },
          components: [
            {
              type: 'body',
              parameters: [{ type: 'text', text: code }],
            },
            // OTP button — confirmed via Meta's own error response
            // ("Button at index 0 must be of type Url") that the send-time
            // sub_type is always 'url', regardless of whether the template
            // was configured as Copy Code / One-tap / Zero-tap in the UI.
            {
              type:     'button',
              sub_type: 'url',
              index:    '0',
              parameters: [{ type: 'text', text: code }],
            },
          ],
        },
      }
    } else {
      // Plain text — works for test numbers without template approval
      payload = {
        messaging_product: 'whatsapp',
        to:   normPhone,
        type: 'text',
        text: {
          preview_url: false,
          body:
            `Your *Alpen Glow Tours* verification code is:\n\n` +
            `*${code}*\n\n` +
            `Valid for 10 minutes. Do not share this code with anyone.`,
        },
      }
    }

    const waRes = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        Authorization:  `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!waRes.ok) {
      const err = await waRes.json()
      console.error('[send-sms-otp] Meta API error (full):', JSON.stringify(err))
      const details = err?.error?.error_data?.details
      const msg = err?.error?.message ?? JSON.stringify(err)
      // TEMP: surfacing error_data.details to the caller for debugging the
      // template mismatch. Remove/trim before real production traffic —
      // this is more detail than an end user should normally see.
      throw new Error(`WhatsApp API: ${msg}${details ? ` — ${details}` : ''}`)
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('send-whatsapp-otp:', err)
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
