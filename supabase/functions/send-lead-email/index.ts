import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

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

serve(async (req) => {
  const corsHeaders = corsFor(req)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Staff-only: this sends arbitrary emails, so require the CRM password.
  const crmPassword = Deno.env.get('CRM_PASSWORD') ?? ''
  if (!crmPassword || (req.headers.get('x-crm-token') ?? '') !== crmPassword) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    const { to, subject, body } = await req.json()

    if (!to || !subject || !body) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, subject, body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const resendKey  = Deno.env.get('RESEND_API_KEY') ?? ''
    const fromDomain = Deno.env.get('EMAIL_FROM_DOMAIN') ?? ''
    const fromAddr   = fromDomain
      ? `AlpenGlow Global <info@${fromDomain}>`
      : 'onboarding@resend.dev'

    if (!resendKey) {
      console.error('[send-lead-email] RESEND_API_KEY not set')
      return new Response(
        JSON.stringify({ error: 'Email service not configured.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Convert plain-text body to simple HTML paragraphs
    const htmlBody = body
      .split('\n')
      .map((line: string) => line.trim() ? `<p style="margin:0 0 14px;font-size:14px;color:#3d3530;line-height:1.7;">${line}</p>` : '<br>')
      .join('')

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromAddr,
        to:   [to],
        subject,
        text: body,
        html: `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f0ebe4;font-family:Helvetica,sans-serif;">
  <div style="max-width:520px;margin:40px auto;background:#faf6f1;border-radius:20px;overflow:hidden;box-shadow:0 4px 30px rgba(0,0,0,0.07);">
    <div style="background:#181818;padding:28px 36px;">
      <p style="margin:0;font-family:Georgia,serif;font-size:20px;color:#fff;font-weight:400;">
        AlpenGlow <em style="color:#ef7e19;">Global</em>
      </p>
    </div>
    <div style="padding:36px;">
      <h2 style="margin:0 0 20px;font-family:Georgia,serif;font-size:20px;font-weight:400;color:#181818;">${subject}</h2>
      ${htmlBody}
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
    console.log(`[send-lead-email] Resend ${emailRes.status}:`, JSON.stringify(resBody))

    if (!emailRes.ok) {
      return new Response(
        JSON.stringify({ error: resBody?.message ?? JSON.stringify(resBody) }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, id: resBody.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('[send-lead-email]', (err as Error).message)
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
