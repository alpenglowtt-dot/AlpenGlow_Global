/**
 * api.js — Alpen Glow Backend Client
 * ─────────────────────────────────────────────────────────────
 * Drop this file in the website root (same level as index.html).
 * Package pages load it as: <script src="../api.js"></script>
 *
 * ⚠️  REPLACE the two constants below with your real Supabase values.
 *     Find them in: Supabase Dashboard → Project Settings → API
 */

;(function () {

  // ─── DEV MODE ────────────────────────────────────────────────
  // Set to true during development to bypass content blur/lock gates.
  // Set to false before going live / showing to client.
  const DEV_MODE = true
  // ─────────────────────────────────────────────────────────────

  const SUPABASE_URL      = 'https://yexrmmhadfscormovskn.supabase.co'
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlleHJtbWhhZGZzY29ybW92c2tuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzNjg0NzYsImV4cCI6MjA5Nzk0NDQ3Nn0.vxkcZDdTfE0qDxW8YwsnbGsLaaSUfwgZ78nQicq2Uoc'

  async function callEdge(fnName, payload) {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/${fnName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || `${fnName} request failed`)
    return data
  }

  // In dev mode, auto-unlock content gates and hide blur overlays on page load
  if (DEV_MODE) {
    document.addEventListener('DOMContentLoaded', function () {
      // Package pages: remove the locked class so full itinerary is visible
      var main = document.getElementById('detailMain')
      if (main) main.classList.remove('locked')

      // Package pages: replace gate card with an unlocked notice
      var gate = document.getElementById('gateCard')
      if (gate) gate.innerHTML = '<div style="text-align:center;padding:1rem 0;"><div style="font-size:1.5rem;margin-bottom:.5rem;">🔓</div><p style="font-size:.8rem;color:rgba(255,255,255,.45);">DEV MODE — gate bypassed</p></div>'

      // Homepage / package cards: hide gradient blur overlays
      document.querySelectorAll('.package-blur, .blog-blur').forEach(function (el) {
        el.style.display = 'none'
      })
    })
  }

  window.AlpenAPI = {
    /** Send a 4-digit SMS OTP via Twilio */
    sendSMSOTP: (phone, purpose, metadata = {}) =>
      callEdge('send-sms-otp', { phone, purpose, metadata }),

    /** Verify a submitted SMS OTP code */
    verifySMSOTP: (phone, code) =>
      callEdge('verify-sms-otp', { phone, code }),

    /** Send a 4-digit email OTP via Resend */
    sendEmailOTP: (email, purpose, metadata = {}) =>
      callEdge('send-email-otp', { email, purpose, metadata }),

    /** Verify a submitted email OTP code */
    verifyEmailOTP: (email, code) =>
      callEdge('verify-email-otp', { email, code }),

    /** Submit contact form — stores lead + emails agency */
    submitContact: (data) =>
      callEdge('submit-contact', data),

    /** Store a generic lead (blog, package gate, offer) */
    submitLead: (data) =>
      callEdge('submit-lead', data),
  }

})()