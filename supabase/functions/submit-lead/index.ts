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
    const {
      name,
      email,
      phone,
      source        = 'unknown',
      packageName,
      offerCode,
      verifiedPhone = false,
      verifiedEmail = false,
    } = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data, error } = await supabase
      .from('leads')
      .insert({
        name,
        email,
        phone,
        source,
        package_name:   packageName,
        offer_code:     offerCode,
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
          timestamp:    new Date().toISOString(),
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
