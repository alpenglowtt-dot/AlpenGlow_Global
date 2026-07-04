import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ── CORS (inlined — dashboard single-file deploys can't resolve relative
//    imports to _shared/, so this lives in every function instead) ──────
const ALLOWED_ORIGINS = (
  Deno.env.get('ALLOWED_ORIGINS') ??
  'https://alpenglowglobal.com,https://www.alpenglowglobal.com'
)
  .split(',')
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

// Must match the normalisation in send-sms-otp exactly
function normalisePhone(raw: string): string {
  const digits = raw.replace(/[^\d]/g, '')
  if (digits.length === 10)  return '91' + digits
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
    const { phone, code } = await req.json()

    if (!phone || !code) {
      return new Response(
        JSON.stringify({ error: 'Phone and code are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const normPhone = normalisePhone(phone)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Look up the latest active code for this contact — WITHOUT filtering
    // by the submitted code — so every wrong guess is counted and we can
    // lock out brute-force attempts on the 4-digit code.
    const { data, error } = await supabase
      .from('otp_verifications')
      .select('id, code, purpose, metadata, attempts')
      .eq('contact', normPhone)
      .eq('type', 'sms')
      .eq('verified', false)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error || !data) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired code. Please try again.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const MAX_ATTEMPTS = 5
    if ((data.attempts ?? 0) >= MAX_ATTEMPTS) {
      return new Response(
        JSON.stringify({ error: 'Too many attempts. Please request a new code.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (String(data.code) !== String(code)) {
      await supabase
        .from('otp_verifications')
        .update({ attempts: (data.attempts ?? 0) + 1 })
        .eq('id', data.id)
      return new Response(
        JSON.stringify({ error: 'Invalid or expired code. Please try again.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    await supabase
      .from('otp_verifications')
      .update({ verified: true, attempts: (data.attempts ?? 0) + 1 })
      .eq('id', data.id)

    return new Response(
      JSON.stringify({ success: true, purpose: data.purpose, metadata: data.metadata }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('verify-whatsapp-otp:', err)
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
