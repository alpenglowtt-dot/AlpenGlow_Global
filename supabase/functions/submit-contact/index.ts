import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { name, email, phone, message } = await req.json()

    if (!name || !email) {
      return new Response(
        JSON.stringify({ error: 'Name and email are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { error: dbErr } = await supabase
      .from('leads')
      .insert({ name, email, phone, message, source: 'contact_form' })

    if (dbErr) throw dbErr

    const resendKey   = Deno.env.get('RESEND_API_KEY')!
    const agencyEmail = Deno.env.get('AGENCY_EMAIL')!
    // Same secret as send-email-otp — keep both functions in sync so only
    // one domain ever needs to be configured/verified in Resend.
    const fromDomain  = Deno.env.get('EMAIL_FROM_DOMAIN') ?? ''
    const fromEmail   = fromDomain ? `noreply@${fromDomain}` : 'onboarding@resend.dev'

    const now = new Date().toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short'
    })

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from:     `Alpen Glow Website <${fromEmail}>`,
        to:       [agencyEmail],
        reply_to: email,
        subject:  `New Enquiry — ${name}`,
        html: `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f0ebe4;font-family:Helvetica,sans-serif;">
  <div style="max-width:520px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;">
    <div style="background:linear-gradient(135deg,#9d2420,#ef7e19);padding:22px 28px;">
      <p style="margin:0;font-size:17px;font-weight:700;color:#fff;">New Enquiry from the Website</p>
      <p style="margin:4px 0 0;font-size:12px;color:rgba(255,255,255,0.7);">${now} IST</p>
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <tr style="background:#faf6f1;">
        <td style="padding:13px 22px;font-weight:600;color:#6b6560;width:28%;">Name</td>
        <td style="padding:13px 22px;color:#181818;">${name}</td>
      </tr>
      <tr>
        <td style="padding:13px 22px;font-weight:600;color:#6b6560;">Email</td>
        <td style="padding:13px 22px;"><a href="mailto:${email}" style="color:#9d2420;">${email}</a></td>
      </tr>
      <tr style="background:#faf6f1;">
        <td style="padding:13px 22px;font-weight:600;color:#6b6560;">Phone</td>
        <td style="padding:13px 22px;"><a href="tel:${phone}" style="color:#9d2420;">${phone || '—'}</a></td>
      </tr>
      <tr>
        <td style="padding:13px 22px;font-weight:600;color:#6b6560;vertical-align:top;">Message</td>
        <td style="padding:13px 22px;line-height:1.6;color:#181818;">${message || '—'}</td>
      </tr>
    </table>
    <div style="padding:18px 28px;border-top:1px solid #e8e3dc;background:#f5f0ea;">
      <p style="margin:0;font-size:11px;color:#9d9590;">
        Sent via alpenglowtours.com &middot; Reply to this email to reach ${name}
      </p>
    </div>
  </div>
</body>
</html>`,
      }),
    })

    const webhook = Deno.env.get('GOOGLE_SHEETS_WEBHOOK_URL')
    if (webhook) {
      fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          source: 'contact_form',
          name, email, phone, message,
        }),
      }).catch(e => console.warn('Sheets webhook failed:', e))
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('submit-contact:', err)
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
