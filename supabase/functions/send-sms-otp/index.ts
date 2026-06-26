import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const code      = String(Math.floor(1000 + Math.random() * 9000))
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

    // Clear previous unverified OTPs for this number
    await supabase
      .from('otp_verifications')
      .delete()
      .eq('contact', normPhone)
      .eq('type', 'sms')
      .eq('verified', false)

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
    const phoneNumberId  = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID')!
    const accessToken    = Deno.env.get('WHATSAPP_ACCESS_TOKEN')!
    const templateName   = Deno.env.get('WHATSAPP_TEMPLATE_NAME') ?? ''

    const apiUrl = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`

    // ── Choose message type ───────────────────────────────────
    // PRODUCTION: set WHATSAPP_TEMPLATE_NAME to your approved
    //             authentication template name.
    //
    // TESTING:    leave WHATSAPP_TEMPLATE_NAME empty — sends a
    //             plain text message (works for test phone numbers
    //             added in Meta Developer Console).

    let payload: object

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
          language: { code: 'en' },
          components: [
            {
              type: 'body',
              parameters: [{ type: 'text', text: code }],
            },
            // ↓ Remove this block if your template has no Copy Code button
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
      const msg = err?.error?.message ?? JSON.stringify(err)
      throw new Error(`WhatsApp API: ${msg}`)
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
