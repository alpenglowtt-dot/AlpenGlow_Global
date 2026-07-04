// Shared CORS helper — imported by every Edge Function.
//
// Origin is locked to the production site (and any extras you set via the
// ALLOWED_ORIGINS env var, comma-separated). Requests from other origins get
// the primary production origin back, so browsers on rogue sites are blocked
// by the same-origin policy. Set ALLOWED_ORIGINS in Supabase → Edge Functions
// → Secrets, e.g.  https://alpenglowglobal.com,https://www.alpenglowglobal.com,http://localhost:3000

const ALLOWED_ORIGINS = (
  Deno.env.get('ALLOWED_ORIGINS') ??
  'https://alpenglowglobal.com,https://www.alpenglowglobal.com'
)
  .split(/[,\s]+/)
  .map((s) => s.trim())
  .filter(Boolean)

export function corsFor(req: Request): Record<string, string> {
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

// Backwards-compatible static export (uses the primary production origin).
export const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGINS[0],
  'Vary': 'Origin',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-crm-token',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
