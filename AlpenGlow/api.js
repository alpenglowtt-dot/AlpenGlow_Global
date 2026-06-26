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

  // ─── SESSION VERIFICATION ─────────────────────────────────────
  // Once a visitor completes OTP verification, we store that in
  // sessionStorage. It persists while the tab stays open and is
  // cleared automatically when the tab is closed — so they only
  // verify once per browsing session, not on every page.
  function isVerified() {
    return DEV_MODE || sessionStorage.getItem('ag_verified') === '1'
  }
  function markVerified() {
    sessionStorage.setItem('ag_verified', '1')
  }
  // ─────────────────────────────────────────────────────────────

  // Dev mode: auto-unlock gates and hide blur overlays on page load
  if (DEV_MODE) {
    document.addEventListener('DOMContentLoaded', function () {
      var main = document.getElementById('detailMain')
      if (main) main.classList.remove('locked')

      var gate = document.getElementById('gateCard')
      if (gate) gate.innerHTML = '<div style="text-align:center;padding:1rem 0;"><div style="font-size:1.5rem;margin-bottom:.5rem;">🔓</div><p style="font-size:.8rem;color:rgba(255,255,255,.45);">DEV MODE — gate bypassed</p></div>'

      document.querySelectorAll('.package-blur, .blog-blur').forEach(function (el) {
        el.style.display = 'none'
      })
    })
  }

  // Production mode: if already verified this session, auto-unlock on page load
  if (!DEV_MODE) {
    document.addEventListener('DOMContentLoaded', function () {
      if (!isVerified()) return
      // Package pages: remove locked class and collapse gate card
      var main = document.getElementById('detailMain')
      if (main) main.classList.remove('locked')
      var gate = document.getElementById('gateCard')
      if (gate) gate.innerHTML = '<div style="text-align:center;padding:1rem 0;"><div style="font-size:1.5rem;margin-bottom:.5rem;">✓</div><p style="font-size:.8rem;color:rgba(255,255,255,.45);">Already verified</p></div>'
      // Homepage: remove blur overlays so blog cards show fully
      document.querySelectorAll('.package-blur, .blog-blur').forEach(function (el) {
        el.style.display = 'none'
      })
      var overlay = document.getElementById('contentOverlay')
      if (overlay) { overlay.style.opacity = '0'; setTimeout(function () { overlay.remove() }, 500) }
    })
  }

  window.AlpenAPI = {
    /** Returns true if the visitor has already verified this session */
    isVerified: isVerified,

    /** Send a 4-digit SMS OTP via Twilio */
    sendSMSOTP: (phone, purpose, metadata = {}) => {
      if (DEV_MODE || isVerified()) return Promise.resolve({ ok: true })
      return callEdge('send-sms-otp', { phone, purpose, metadata })
    },

    /** Verify a submitted SMS OTP code */
    verifySMSOTP: async (phone, code) => {
      if (DEV_MODE || isVerified()) return { verified: true }
      const r = await callEdge('verify-sms-otp', { phone, code })
      markVerified()
      return r
    },

    /** Send a 4-digit email OTP via Resend */
    sendEmailOTP: (email, purpose, metadata = {}) => {
      if (DEV_MODE || isVerified()) return Promise.resolve({ ok: true })
      return callEdge('send-email-otp', { email, purpose, metadata })
    },

    /** Verify a submitted email OTP code */
    verifyEmailOTP: async (email, code) => {
      if (DEV_MODE || isVerified()) return { verified: true }
      const r = await callEdge('verify-email-otp', { email, code })
      markVerified()
      return r
    },

    /** Submit contact form — stores lead + emails agency */
    submitContact: (data) =>
      callEdge('submit-contact', data),

    /** Store a generic lead (blog, package gate, offer) */
    submitLead: (data) =>
      callEdge('submit-lead', data),

    /** Fetch active offers from Supabase (used by index.html) */
    fetchOffers: () =>
      fetch(`${SUPABASE_URL}/rest/v1/offers?active=eq.true&order=created_at.asc`, {
        headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
      }).then(r => r.json()).catch(() => []),

    /** Fetch active blog posts from Supabase (used by index.html) */
    fetchBlogPosts: () =>
      fetch(`${SUPABASE_URL}/rest/v1/blog_posts?active=eq.true&order=created_at.asc`, {
        headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
      }).then(r => r.json()).catch(() => []),

    /** Returns true if this phone+code combo already claimed an offer */
    checkOfferClaimed: async (phone, code) => {
      if (DEV_MODE) return false
      try {
        const r = await fetch(
          `${SUPABASE_URL}/rest/v1/leads?phone=eq.${encodeURIComponent(phone)}&offer_code=eq.${encodeURIComponent(code)}&select=id`,
          { headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` } }
        )
        const data = await r.json()
        return Array.isArray(data) && data.length > 0
      } catch { return false }
    },
  }

})()
