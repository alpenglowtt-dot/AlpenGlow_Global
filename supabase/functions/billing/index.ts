// ============================================================
//  AlpenGlow Billing API — authenticated backend for the billing app
// ------------------------------------------------------------
//  Why this exists:
//  The billing app (travel-app) stores customers and tax invoices.
//  Those rows hold customer PII (names, mobiles, GST numbers) and
//  financial records, so they must never be reachable with the
//  PUBLIC anon key — which ships in the page source.
//
//  Same posture as the `crm` function: the app sends a shared
//  password in the `x-billing-token` header; we compare it to the
//  BILLING_PASSWORD secret (never sent to the browser) and only
//  then touch the DB with the service-role key. Migration 010
//  revokes all anon/authenticated access to these tables.
//
//  Set the secret before deploying:
//    BILLING_PASSWORD="<a long random password>"  in the VPS .env
//  (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY come from the platform.)
// ============================================================
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ── CORS (inlined — single-file function deploys can't resolve
//    relative imports to _shared/, so this lives in every function) ──
const ALLOWED_ORIGINS = (
  Deno.env.get('ALLOWED_ORIGINS') ??
  'https://alpenglowglobal.com,https://www.alpenglowglobal.com'
)
  .split(/[,\s]+/)
  .map((s) => s.trim())
  .filter(Boolean)

function corsFor(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin')
  // The billing app also runs from localhost during day-to-day use on the
  // agency's own machine, so allow loopback origins explicitly.
  const isLocal = !!origin && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
  const allow =
    origin && (ALLOWED_ORIGINS.includes(origin) || isLocal) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allow,
    'Vary': 'Origin',
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type, x-billing-token',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
}

// Only these columns may ever be written from the app.
const CUSTOMER_WRITABLE = new Set([
  'company_name', 'name', 'salutation', 'mobile', 'email',
  'gst_number', 'state', 'address',
])

const INVOICE_WRITABLE = new Set([
  'invoice_number', 'invoice_date', 'customer_id', 'tickets', 'mode',
  'journey_date', 'from_place', 'to_place', 'passengers', 'qty',
  'ticket_amount', 'extra_charges', 'handling_rate', 'handling_qty',
  'handling_total', 'cgst_rate', 'sgst_rate', 'cgst_amount', 'sgst_amount',
  'grand_total', 'amount_in_words', 'notes',
])

function pick(obj: Record<string, unknown>, allowed: Set<string>) {
  const out: Record<string, unknown> = {}
  for (const k of Object.keys(obj || {})) if (allowed.has(k)) out[k] = obj[k]
  return out
}

/** Empty strings from form inputs should be stored as NULL, not ''. */
function blankToNull(obj: Record<string, unknown>) {
  for (const k of Object.keys(obj)) {
    if (typeof obj[k] === 'string' && (obj[k] as string).trim() === '') obj[k] = null
  }
  return obj
}

// Constant-time-ish string compare to avoid trivial timing leaks.
function safeEqual(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

serve(async (req) => {
  const cors = corsFor(req)
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })

  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  // ── AUTH ────────────────────────────────────────────────
  const expected = Deno.env.get('BILLING_PASSWORD') ?? ''
  if (!expected) {
    console.error('[billing] BILLING_PASSWORD secret not set')
    return json({ error: 'Billing not configured' }, 503)
  }
  const token = req.headers.get('x-billing-token') ?? ''
  if (!safeEqual(token, expected)) {
    return json({ error: 'Unauthorized' }, 401)
  }

  let payload: { action?: string; [k: string]: unknown }
  try {
    payload = await req.json()
  } catch {
    return json({ error: 'Invalid JSON' }, 400)
  }
  const action = String(payload.action || '')

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  try {
    switch (action) {
      // Login check — the app calls this to validate the password.
      case 'auth':
        return json({ ok: true })

      // ── CUSTOMERS ──────────────────────────────────────
      case 'list_customers': {
        const { data, error } = await supabase
          .from('billing_customers')
          .select('*')
          .order('name', { ascending: true })
        if (error) throw error
        return json({ data })
      }

      /**
       * Insert a customer, or update the existing row when the same
       * name+mobile is already on file. Mirrors the unique index so the
       * dropdown never fills with duplicates for repeat travellers.
       */
      case 'upsert_customer': {
        const fields = blankToNull(
          pick(payload.customer as Record<string, unknown>, CUSTOMER_WRITABLE),
        )
        const name = String(fields.name ?? '').trim()
        if (!name) return json({ error: 'name required' }, 400)
        fields.name = name

        const id = String(payload.id || '')
        if (id) {
          const { data, error } = await supabase
            .from('billing_customers')
            .update(fields)
            .eq('id', id)
            .select()
            .single()
          if (error) throw error
          return json({ data })
        }

        // Match the unique index on (lower(name), coalesce(mobile,'')).
        const mobile = (fields.mobile as string | null) ?? null
        let q = supabase.from('billing_customers').select('*').ilike('name', name)
        q = mobile === null ? q.is('mobile', null) : q.eq('mobile', mobile)
        const { data: existing } = await q.maybeSingle()

        if (existing) {
          const { data, error } = await supabase
            .from('billing_customers')
            .update(fields)
            .eq('id', (existing as { id: string }).id)
            .select()
            .single()
          if (error) throw error
          return json({ data })
        }

        const { data, error } = await supabase
          .from('billing_customers')
          .insert(fields)
          .select()
          .single()
        if (error) throw error
        return json({ data })
      }

      case 'delete_customer': {
        const id = String(payload.id || '')
        if (!id) return json({ error: 'id required' }, 400)
        const { error } = await supabase.from('billing_customers').delete().eq('id', id)
        if (error) throw error
        return json({ ok: true })
      }

      // ── INVOICE NUMBERING ──────────────────────────────
      case 'next_invoice_number': {
        const { data, error } = await supabase.rpc('next_billing_invoice_number')
        if (error) throw error
        return json({ data: Number(data) })
      }

      // ── INVOICES ───────────────────────────────────────
      case 'save_invoice': {
        const fields = pick(payload.invoice as Record<string, unknown>, INVOICE_WRITABLE)
        if (!fields.invoice_number) return json({ error: 'invoice_number required' }, 400)
        const { data, error } = await supabase
          .from('billing_invoices')
          .insert(fields)
          .select()
          .single()
        if (error) throw error
        return json({ data })
      }

      case 'list_invoices': {
        const limit = Math.min(Number(payload.limit) || 25, 200)
        const { data, error } = await supabase
          .from('billing_invoices')
          .select(
            'id, invoice_number, invoice_date, mode, from_place, to_place, grand_total,' +
              ' billing_customers(name, company_name)',
          )
          .order('invoice_number', { ascending: false })
          .limit(limit)
        if (error) throw error
        return json({ data })
      }

      case 'get_invoice': {
        const id = String(payload.id || '')
        const number = Number(payload.invoice_number)
        if (!id && !number) return json({ error: 'id or invoice_number required' }, 400)
        const q = supabase.from('billing_invoices').select('*, billing_customers(*)')
        const { data, error } = id
          ? await q.eq('id', id).maybeSingle()
          : await q.eq('invoice_number', number).maybeSingle()
        if (error) throw error
        return json({ data })
      }

      case 'delete_invoice': {
        const id = String(payload.id || '')
        if (!id) return json({ error: 'id required' }, 400)
        const { error } = await supabase.from('billing_invoices').delete().eq('id', id)
        if (error) throw error
        return json({ ok: true })
      }

      default:
        return json({ error: `Unknown action: ${action}` }, 400)
    }
  } catch (e) {
    console.error('[billing]', action, e)
    const message = e instanceof Error ? e.message : 'Server error'
    return json({ error: message }, 500)
  }
})
