import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  const url = new URL(req.url)

  // Meta webhook verification (GET request)
  if (req.method === 'GET') {
    const mode      = url.searchParams.get('hub.mode')
    const token     = url.searchParams.get('hub.verify_token')
    const challenge = url.searchParams.get('hub.challenge')

    const verifyToken = Deno.env.get('WHATSAPP_WEBHOOK_TOKEN') ?? ''

    if (mode === 'subscribe' && token === verifyToken) {
      console.log('[whatsapp-webhook] Webhook verified')
      return new Response(challenge, { status: 200 })
    }

    return new Response('Forbidden', { status: 403 })
  }

  // Incoming webhook events (POST request) — acknowledge immediately
  if (req.method === 'POST') {
    const body = await req.json().catch(() => ({}))
    console.log('[whatsapp-webhook] Event received:', JSON.stringify(body))
    return new Response('OK', { status: 200 })
  }

  return new Response('Method Not Allowed', { status: 405 })
})
