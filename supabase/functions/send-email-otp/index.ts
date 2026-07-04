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

serve(async (req) => {
  const corsHeaders = corsFor(req)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, purpose = 'general', metadata = {} } = await req.json()

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email address is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const resendKey  = Deno.env.get('RESEND_API_KEY') ?? ''
    const fromDomain = Deno.env.get('EMAIL_FROM_DOMAIN') ?? ''
    const fromAddr   = fromDomain ? `AlpenGlow Global <info@${fromDomain}>` : 'onboarding@resend.dev'

    if (!resendKey) {
      console.error('[send-email-otp] RESEND_API_KEY not set')
      throw new Error('Email service not configured. Contact support.')
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // ── Rate limit (anti-spam / anti-cost-abuse) ──────────────
    const limited = await otpRateLimited(supabase, email, 'email')
    if (limited) {
      return new Response(
        JSON.stringify({ error: limited }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const code      = String(Math.floor(1000 + Math.random() * 9000))
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

    // Clear only EXPIRED unverified OTPs (keep recent ones for the limiter).
    await supabase
      .from('otp_verifications')
      .delete()
      .eq('contact', email)
      .eq('type', 'email')
      .eq('verified', false)
      .lt('expires_at', new Date().toISOString())

    const { error: dbErr } = await supabase
      .from('otp_verifications')
      .insert({ contact: email, type: 'email', code, purpose, metadata, expires_at: expiresAt })

    if (dbErr) throw dbErr

    console.log(`[send-email-otp] OTP for ${email}: ${code}`)

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from:    fromAddr,
        to:      [email],
        subject: 'Your AlpenGlow Global Verification Code',
        html: `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f0ebe4;font-family:Helvetica,sans-serif;">
  <div style="max-width:480px;margin:40px auto;background:#faf6f1;border-radius:20px;overflow:hidden;box-shadow:0 4px 30px rgba(0,0,0,0.07);">
    <div style="background:#181818;padding:28px 36px;">
      <p style="margin:0;font-family:Georgia,serif;font-size:20px;color:#fff;font-weight:400;">
        AlpenGlow <em style="color:#ef7e19;">Global</em>
      </p>
      <p style="margin:5px 0 0;font-size:10px;color:rgba(255,255,255,0.4);letter-spacing:.12em;text-transform:uppercase;">
      </p>
    </div>
    <div style="padding:36px;">
      <h2 style="margin:0 0 8px;font-family:Georgia,serif;font-size:22px;font-weight:400;color:#181818;">
        Verify your email
      </h2>
      <p style="margin:0 0 24px;font-size:14px;color:#6b6560;line-height:1.6;">
        Use the code below to complete your verification. It expires in 10 minutes.
      </p>
      <div style="background:linear-gradient(135deg,#9d2420,#ef7e19);border-radius:14px;padding:28px;text-align:center;margin-bottom:24px;">
        <div style="font-size:42px;font-weight:700;color:#fff;letter-spacing:.25em;font-family:monospace;">${code}</div>
        <div style="font-size:11px;color:rgba(255,255,255,0.65);margin-top:8px;letter-spacing:.08em;text-transform:uppercase;">
          One-time code &middot; valid 10 minutes
        </div>
      </div>
      <p style="margin:0;font-size:12px;color:#9d9590;line-height:1.6;">
        If you didn't request this, you can safely ignore this email.
      </p>
    </div>
    <div style="border-top:1px solid #e8e3dc;padding:18px 36px;background:#f5f0ea;">
      <p style="margin:0;font-size:11px;color:#b0a9a0;">
        AlpenGlow Global &middot; 1078, Big Bazaar Street, Coimbatore - 1
      </p>
    </div>
  </div>
</body>
</html>`,
      }),
    })

    const resBody = await emailRes.json()
    console.log(`[send-email-otp] Resend response ${emailRes.status}:`, JSON.stringify(resBody))

    if (!emailRes.ok) {
      throw new Error(`Resend ${emailRes.status}: ${resBody?.message ?? resBody?.name ?? JSON.stringify(resBody)}`)
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('[send-email-otp] Error:', (err as Error).message)
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
