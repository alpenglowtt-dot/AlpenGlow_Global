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

serve(async (req) => {
  const corsHeaders = corsFor(req)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const {
      action        = 'create',
      name,
      email,
      phone,
      source        = 'unknown',
      packageName,
      offerCode,
      message,
      verifiedPhone = false,
      verifiedEmail = false,
    } = body

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // ── UPDATE: enrich an existing lead the caller already created ──
    // (used by the COMPASS chatbot as the conversation fills in details).
    // Scoped by the lead's UUID, which only that visitor holds.
    if (action === 'update') {
      const id = String(body.id || '')
      if (!id) {
        return new Response(
          JSON.stringify({ error: 'id required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      const fields: Record<string, unknown> = {}
      if ('email' in body)       fields.email        = email ?? null
      if ('packageName' in body) fields.package_name = packageName ?? null
      if ('message' in body)     fields.message      = message ?? null
      const { error: upErr } = await supabase.from('leads').update(fields).eq('id', id)
      if (upErr) throw upErr
      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ── CHECK_OFFER: has this phone already claimed this offer code? ──
    if (action === 'check_offer') {
      const { count } = await supabase
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .eq('phone', String(phone ?? ''))
        .eq('offer_code', String(offerCode ?? ''))
      return new Response(
        JSON.stringify({ claimed: (count ?? 0) > 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ── CREATE (default) ──────────────────────────────────────────
    const { data, error } = await supabase
      .from('leads')
      .insert({
        name,
        email,
        phone,
        source,
        package_name:   packageName,
        offer_code:     offerCode,
        message:        message ?? null,
        verified_phone: verifiedPhone,
        verified_email: verifiedEmail,
      })
      .select('id')
      .single()

    if (error) throw error

    const webhook = Deno.env.get('GOOGLE_SHEETS_WEBHOOK_URL')
    if (webhook) {
      fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // IST, not raw UTC — the sheet is read by India-based staff.
          timestamp: new Date().toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short',
          }),
          source,
          name,
          email,
          phone,
          package_name: packageName,
          offer_code:   offerCode,
        }),
      }).catch(e => console.warn('Sheets webhook failed:', e))
    }

    return new Response(
      JSON.stringify({ success: true, id: data.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('submit-lead:', err)
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
