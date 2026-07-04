// ============================================================
//  AlpenGlow CRM API — authenticated backend for the dashboard
// ------------------------------------------------------------
//  Why this exists:
//  The dashboard used to read/write the `leads`, `lead_activities`
//  and `follow_ups` tables directly via PostgREST using the PUBLIC
//  anon key, gated only by a JavaScript password. That meant anyone
//  could dump/modify customer PII with the key printed in the page
//  source.
//
//  This function moves auth to the server. The dashboard sends the
//  CRM password in the `x-crm-token` header; we compare it to the
//  CRM_PASSWORD secret (never shipped to the browser) and only then
//  touch the DB with the service-role key. RLS blocks the anon key
//  from these tables entirely (see migration 007).
//
//  Set these secrets before deploying:
//    supabase secrets set CRM_PASSWORD="<a long random password>"
//  (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are provided by the platform.)
// ============================================================
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

// Only these columns may ever be written from the dashboard.
const LEAD_WRITABLE = new Set([
  'name', 'email', 'phone', 'message', 'source', 'package_name', 'offer_code',
  'verified_phone', 'verified_email', 'status', 'quoted_amount', 'final_amount', 'notes',
])
const FOLLOWUP_WRITABLE = new Set(['note', 'due_at', 'done'])

function pick(obj: Record<string, unknown>, allowed: Set<string>) {
  const out: Record<string, unknown> = {}
  for (const k of Object.keys(obj || {})) if (allowed.has(k)) out[k] = obj[k]
  return out
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
  const expected = Deno.env.get('CRM_PASSWORD') ?? ''
  if (!expected) {
    console.error('[crm] CRM_PASSWORD secret not set')
    return json({ error: 'CRM not configured' }, 503)
  }
  const token = req.headers.get('x-crm-token') ?? ''
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
      // Login check — dashboard calls this to validate the password.
      case 'auth':
        return json({ ok: true })

      // ── LEADS ──────────────────────────────────────────
      case 'list_leads': {
        const { data, error } = await supabase
          .from('leads')
          .select('*')
          .order('created_at', { ascending: false })
        if (error) throw error
        return json({ data })
      }

      case 'update_lead': {
        const id = String(payload.id || '')
        if (!id) return json({ error: 'id required' }, 400)
        const fields = pick(payload.fields as Record<string, unknown>, LEAD_WRITABLE)
        if (!Object.keys(fields).length) return json({ error: 'no writable fields' }, 400)
        const { error } = await supabase.from('leads').update(fields).eq('id', id)
        if (error) throw error
        return json({ ok: true })
      }

      case 'delete_leads': {
        const ids = (payload.ids as string[]) || (payload.id ? [String(payload.id)] : [])
        if (!ids.length) return json({ error: 'ids required' }, 400)
        const { error } = await supabase.from('leads').delete().in('id', ids)
        if (error) throw error
        return json({ ok: true })
      }

      // ── ACTIVITIES ─────────────────────────────────────
      case 'list_activities': {
        const leadId = String(payload.lead_id || '')
        if (!leadId) return json({ error: 'lead_id required' }, 400)
        const { data, error } = await supabase
          .from('lead_activities')
          .select('*')
          .eq('lead_id', leadId)
          .order('created_at', { ascending: false })
          .limit(20)
        if (error) throw error
        return json({ data })
      }

      case 'add_activity': {
        const leadId = String(payload.lead_id || '')
        if (!leadId) return json({ error: 'lead_id required' }, 400)
        const { error } = await supabase.from('lead_activities').insert({
          lead_id: leadId,
          type: String(payload.type || 'note'),
          note: payload.note == null ? null : String(payload.note),
        })
        if (error) throw error
        return json({ ok: true })
      }

      // ── FOLLOW-UPS ─────────────────────────────────────
      // Returns every incomplete follow-up; dashboard splits today/overdue.
      case 'followups_open': {
        const { data, error } = await supabase
          .from('follow_ups')
          .select('*')
          .eq('done', false)
          .order('due_at', { ascending: true })
        if (error) throw error
        return json({ data })
      }

      case 'list_followups': {
        const leadId = String(payload.lead_id || '')
        if (!leadId) return json({ error: 'lead_id required' }, 400)
        const { data, error } = await supabase
          .from('follow_ups')
          .select('*')
          .eq('lead_id', leadId)
          .order('due_at', { ascending: true })
        if (error) throw error
        return json({ data })
      }

      case 'add_followup': {
        const leadId = String(payload.lead_id || '')
        const dueAt = String(payload.due_at || '')
        if (!leadId || !dueAt) return json({ error: 'lead_id and due_at required' }, 400)
        const { error } = await supabase.from('follow_ups').insert({
          lead_id: leadId,
          note: payload.note == null ? 'Follow up' : String(payload.note),
          due_at: dueAt,
        })
        if (error) throw error
        return json({ ok: true })
      }

      case 'update_followup': {
        const id = String(payload.id || '')
        if (!id) return json({ error: 'id required' }, 400)
        const fields = pick(payload.fields as Record<string, unknown>, FOLLOWUP_WRITABLE)
        if (!Object.keys(fields).length) return json({ error: 'no writable fields' }, 400)
        const { error } = await supabase.from('follow_ups').update(fields).eq('id', id)
        if (error) throw error
        return json({ ok: true })
      }

      default:
        return json({ error: 'Unknown action' }, 400)
    }
  } catch (err) {
    console.error('[crm]', action, err)
    return json({ error: (err as Error).message }, 500)
  }
})
