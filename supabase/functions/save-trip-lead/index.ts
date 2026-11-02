import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// save-trip-lead — the trip planner's only way to write `trip_leads`.
//
// trip-planner.js calls this after each wizard step (status 'in_progress')
// and once for the final submit (status 'submitted', step 9). The service
// role key is read from the server environment here and never leaves the
// server, exactly like submit-lead. After the submitted save the browser
// still sends the lead to `leads` through submit-lead, as before.
//
// Rules:
//   * POST/OPTIONS only; CORS from ALLOWED_ORIGINS like submit-lead; a
//     request whose Origin header is present but not allowed gets 403.
//   * Rate limit: the same one submit-lead has — nginx's alpenglow_api zone
//     on /functions/v1/ (20 r/s per IP, burst 60, then 429).
//   * Every field is checked against the values trip-planner.js can send;
//     anything else is a 400. Unknown fields are ignored.
//   * Writes only trip_leads, keyed by session_id (a lowercase v4 UUID, as
//     the planner generates). A row that is already 'submitted' is never
//     changed (409). id, created_at and updated_at are never written from
//     input (created_at keeps its insert default; updated_at is set by the
//     table's trigger).
//   * The answer is only {"ok":true} or {"error":"..."}; never row data.

// ── CORS (inlined, same rules as submit-lead) ─────────────────────────────
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

// ── What trip-planner.js can send (keep in sync with its config) ──────────
const VIBES = ['beach', 'mountains', 'cultural', 'adventure', 'honeymoon']
const DESTINATIONS = [
  'maldives', 'bali', 'seychelles', 'mauritius', 'santorini', 'srilanka',
  'switzerland', 'nepal', 'bhutan', 'norway', 'newzealand', 'australia',
  'japan', 'india', 'southkorea', 'italy', 'rivercruise', 'royalcaribbean',
  'resortsworld',
]
const TRAVELER_TYPES = ['couple', 'family', 'friends', 'solo', 'senior']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June', 'July',
  'August', 'September', 'October', 'November', 'December',
]
const CITIES = [
  'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad', 'Kolkata', 'Pune',
  'Ahmedabad', 'Jaipur', 'Kochi', 'Goa', 'Chandigarh', 'Lucknow', 'Indore',
  'Coimbatore', 'Nagpur', 'Visakhapatnam', 'Surat', 'Bhopal', 'Dubai',
  'Singapore', 'London', 'New York', 'Sydney',
]
const DURATIONS = ['3-4', '5-6', '7-8', '9-15']
const BUDGETS = ['budget', 'midrange', 'premium', 'luxury']

// Exactly what the planner's _uuid() produces: crypto.randomUUID() or its
// fallback, both lowercase version-4 UUIDs.
const SESSION_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
const PHONE_RE = /^[0-9]{6,15}$/ // AlpenAPI.phone digits: 6–15, digits only
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
// deno-lint-ignore no-control-regex
const CONTROL_RE = /[\u0000-\u001f\u007f]/
const MAX_BODY_BYTES = 8 * 1024

class BadInput extends Error {}
type Body = Record<string, unknown>

const absent = (v: unknown) => v === undefined || v === null

function oneOf(b: Body, key: string, allowed: string[]): string | null {
  const v = b[key]
  if (absent(v)) return null
  if (typeof v !== 'string' || !allowed.includes(v)) throw new BadInput(`${key} is not an allowed value`)
  return v
}

function intIn(b: Body, key: string, min: number, max: number): number | null {
  const v = b[key]
  if (absent(v)) return null
  if (typeof v !== 'number' || !Number.isInteger(v) || v < min || v > max) {
    throw new BadInput(`${key} must be a whole number from ${min} to ${max}`)
  }
  return v
}

function freeText(b: Body, key: string, maxLen: number): string | null {
  const v = b[key]
  if (absent(v)) return null
  if (typeof v !== 'string') throw new BadInput(`${key} must be text`)
  const s = v.trim()
  if (!s || s.length > maxLen || CONTROL_RE.test(s)) throw new BadInput(`${key} is not valid`)
  return s
}

function validate(b: Body) {
  if (typeof b.session_id !== 'string' || !SESSION_RE.test(b.session_id)) {
    throw new BadInput('session_id is not valid')
  }
  if (b.status !== 'in_progress' && b.status !== 'submitted') {
    throw new BadInput("status must be 'in_progress' or 'submitted'")
  }
  const step = b.current_step
  if (typeof step !== 'number' || !Number.isInteger(step) || step < 1 || step > 9) {
    throw new BadInput('current_step must be a whole number from 1 to 9')
  }

  const fields: Record<string, unknown> = {
    status:        b.status,
    current_step:  step,
    vibe:          oneOf(b, 'vibe', VIBES),
    destination:   oneOf(b, 'destination', DESTINATIONS),
    traveler_type: oneOf(b, 'traveler_type', TRAVELER_TYPES),
    adult_count:   intIn(b, 'adult_count', 1, 20),
    child_count:   intIn(b, 'child_count', 0, 20),
    room_count:    intIn(b, 'room_count', 1, 10),
    travel_month:  oneOf(b, 'travel_month', MONTHS),
    origin_city:   oneOf(b, 'origin_city', CITIES),
    duration:      oneOf(b, 'duration', DURATIONS),
    budget_range:  oneOf(b, 'budget_range', BUDGETS),
    exact_budget:  intIn(b, 'exact_budget', 1, 1_000_000_000),
    contact_name:  freeText(b, 'contact_name', 100),
    contact_phone: absent(b.contact_phone) ? null : String(b.contact_phone),
    contact_email: freeText(b, 'contact_email', 254),
  }
  if (fields.contact_phone !== null &&
      (typeof b.contact_phone !== 'string' || !PHONE_RE.test(b.contact_phone))) {
    throw new BadInput('contact_phone is not valid')
  }
  if (fields.contact_email !== null && !EMAIL_RE.test(String(fields.contact_email))) {
    throw new BadInput('contact_email is not valid')
  }
  // The planner only shows the final submit after step 9 with name, a
  // verified phone and a verified email.
  if (b.status === 'submitted' &&
      (step !== 9 || !fields.contact_name || !fields.contact_phone || !fields.contact_email)) {
    throw new BadInput('a submitted trip needs step 9, name, phone and email')
  }
  return { sessionId: b.session_id as string, fields }
}

// ── Handler ───────────────────────────────────────────────────────────────
serve(async (req) => {
  const corsHeaders = corsFor(req)
  const reply = (status: number, payload: Record<string, unknown>) =>
    new Response(JSON.stringify(payload), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return reply(405, { error: 'POST only' })

  const origin = req.headers.get('Origin')
  if (origin && !ALLOWED_ORIGINS.includes(origin)) return reply(403, { error: 'Origin not allowed' })

  try {
    const raw = await req.text()
    if (raw.length > MAX_BODY_BYTES) return reply(413, { error: 'Request too large' })
    let body: unknown
    try { body = JSON.parse(raw) } catch { return reply(400, { error: 'Body must be JSON' }) }
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return reply(400, { error: 'Body must be a JSON object' })
    }

    const { sessionId, fields } = validate(body as Body)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // 1) Update the visitor's row, but only while it is not submitted. The
    //    condition is part of the UPDATE itself, so two requests at the same
    //    moment cannot slip past it. created_at is not in `fields`.
    const updateOpen = () =>
      supabase.from('trip_leads')
        .update(fields, { count: 'exact' })
        .eq('session_id', sessionId)
        .neq('status', 'submitted')

    let { count, error } = await updateOpen()
    if (error) throw error
    if ((count ?? 0) === 1) return reply(200, { ok: true })

    // 2) No open row: create it (created_at = now() by default).
    const { error: insErr } = await supabase
      .from('trip_leads')
      .insert({ session_id: sessionId, ...fields })
    if (!insErr) return reply(200, { ok: true })
    if (insErr.code !== '23505') throw insErr // 23505 = row with this session_id exists

    // 3) The row exists: either it was just created by a parallel request
    //    (try the guarded update once more) or it is already submitted.
    ;({ count, error } = await updateOpen())
    if (error) throw error
    if ((count ?? 0) === 1) return reply(200, { ok: true })
    return reply(409, { error: 'already_submitted' })
  } catch (err) {
    if (err instanceof BadInput) return reply(400, { error: err.message })
    console.error('save-trip-lead:', err)
    return reply(500, { error: 'Could not save your trip. Please try again.' })
  }
})
