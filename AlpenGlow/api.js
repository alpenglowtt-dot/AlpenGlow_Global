/**
 * api.js — Alpen Glow Backend Client
 * ─────────────────────────────────────────────────────────────
 * Drop this file in the website root (same level as index.html).
 * Package pages load it as: <script src="../api.js"></script>
 *
 * Content (offers, blog, destinations, packages, page data) is stored
 * in local JSON files under data/  — no Supabase needed for content.
 * Supabase is only used for OTP verification and lead capture.
 */

;(function () {

  // ─── DEV MODE ────────────────────────────────────────────────
  // Set to true during development to bypass content blur/lock gates.
  // Set to false before going live / showing to client.
  const DEV_MODE = true
  // ─────────────────────────────────────────────────────────────

  const SUPABASE_URL      = 'https://yexrmmhadfscormovskn.supabase.co'
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlleHJtbWhhZGZzY29ybW92c2tuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzNjg0NzYsImV4cCI6MjA5Nzk0NDQ3Nn0.vxkcZDdTfE0qDxW8YwsnbGsLaaSUfwgZ78nQicq2Uoc'

  // Base path of api.js itself — used to resolve data/ paths correctly
  // regardless of whether the page is at root (index.html) or in a subdirectory (packages/japan.html)
  const _apiBase = (function () {
    const s = document.currentScript
    if (s && s.src) return s.src.replace(/api\.js(\?.*)?$/, '')
    const all = document.querySelectorAll('script[src]')
    for (let i = 0; i < all.length; i++) {
      if (/\/api\.js(\?|$)/.test(all[i].src)) return all[i].src.replace(/api\.js(\?.*)?$/, '')
    }
    return window.location.href.replace(/[^/]*$/, '')
  })()

  // Resolve a data-file relative path to an absolute URL
  function dataUrl(path) { return _apiBase + path }

  // Resolve an image path stored in JSON (e.g. "images/uploads/foo.jpg")
  // to an absolute URL so package pages (in a subdirectory) display correctly
  function resolveImg(url) {
    if (!url) return ''
    if (/^(https?:\/\/|\/|data:|blob:)/.test(url)) return url
    return _apiBase + url
  }

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

    /** Fetch active offers from local data/offers.json */
    fetchOffers: () =>
      fetch(dataUrl('data/offers.json')).then(r => r.json())
        .then(arr => arr.filter(o => o.active !== false)).catch(() => []),

    /** Fetch active blog posts from local data/blog_posts.json */
    fetchBlogPosts: () =>
      fetch(dataUrl('data/blog_posts.json')).then(r => r.json())
        .then(arr => arr.filter(o => o.active !== false)).catch(() => []),

    /** Fetch active destinations from local data/destinations.json */
    fetchDestinations: () =>
      fetch(dataUrl('data/destinations.json')).then(r => r.json())
        .then(arr => arr.filter(o => o.active !== false).sort((a,b) => (a.sort_order||0)-(b.sort_order||0))).catch(() => []),

    /** Fetch active tour packages from local data/packages.json */
    fetchPackages: () =>
      fetch(dataUrl('data/packages.json')).then(r => r.json())
        .then(arr => arr.filter(o => o.active !== false).sort((a,b) => (a.sort_order||0)-(b.sort_order||0))).catch(() => []),

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

    /** Fetch a single package page from local data/pages/{slug}.json (used by dev.html) */
    fetchPackagePage: (slug) =>
      fetch(dataUrl('data/pages/' + encodeURIComponent(slug) + '.json'))
        .then(r => r.json()).catch(() => null),

    /**
     * loadPackagePage(slug)
     * Called at the bottom of each package HTML page.
     * Fetches the page's Supabase record and overwrites the DOM.
     * Falls back silently to hardcoded HTML if no record found.
     */
    loadPackagePage: async function(slug) {
      try {
        const r = await fetch(dataUrl('data/pages/' + encodeURIComponent(slug) + '.json'))
        if (!r.ok) return
        const d = await r.json()
        if (!d) return

        // ── Hero ──────────────────────────────────────────────
        if (d.hero_image_url) {
          const hi = document.querySelector('.detail-hero img')
          if (hi) hi.src = resolveImg(d.hero_image_url)
        }
        if (d.title)    { const el = document.querySelector('.detail-title');    if (el) el.textContent = d.title }
        if (d.duration) { const el = document.querySelector('.detail-duration'); if (el) el.textContent = d.duration }
        if (d.location) { const el = document.querySelector('.detail-location'); if (el) el.textContent = d.location }
        if (d.page_title) document.title = d.page_title

        // ── Overview ──────────────────────────────────────────
        const paras = Array.isArray(d.overview_paragraphs) ? d.overview_paragraphs
          : (typeof d.overview_paragraphs === 'string' ? JSON.parse(d.overview_paragraphs || '[]') : [])
        const overviewEl = document.querySelector('.overview-free')
        if (overviewEl && paras.length) {
          overviewEl.innerHTML = `<h2>${d.overview_heading || 'Overview'}</h2>`
            + paras.map(p => `<p>${p}</p>`).join('')
        }

        // ── Places section heading ────────────────────────────
        const placesH = document.getElementById('placesHeading')
        if (placesH && d.places_heading) placesH.textContent = d.places_heading

        // ── Place cards + modal data ──────────────────────────
        const places = Array.isArray(d.places) ? d.places
          : (typeof d.places === 'string' ? JSON.parse(d.places || '[]') : [])
        if (places.length) {
          // Rebuild cityData so the modal JS stays working
          if (typeof window.cityData !== 'undefined') {
            window.cityData = {}
            places.forEach(function(p) {
              window.cityData[p.key] = {
                name: p.name,
                img:  resolveImg(p.modal_image_url || p.card_image_url || ''),
                tagline: p.modal_tagline || p.tagline || '',
                desc: p.desc || ''
              }
            })
          }
          const showcase = document.querySelector('.city-showcase')
          if (showcase) {
            showcase.innerHTML = places.map(function(p) {
              return `<div class="city-card" onclick="openCityModal('${p.key}')">
                <img src="${resolveImg(p.card_image_url || '')}" alt="${p.name || ''}">
                <div class="city-card-overlay">
                  <div class="city-card-name">${p.name || ''}</div>
                  <div class="city-card-tagline">${p.tagline || ''}</div>
                </div>
              </div>`
            }).join('')
          }
        }

        // ── Inclusions heading ────────────────────────────────
        const inclH = document.getElementById('inclusionsHeading')
        if (inclH && d.inclusions_heading) inclH.textContent = d.inclusions_heading

        // ── Inclusions pills ──────────────────────────────────
        const inclusions = Array.isArray(d.inclusions) ? d.inclusions
          : (typeof d.inclusions === 'string' ? JSON.parse(d.inclusions || '[]') : [])
        if (inclusions.length) {
          const tagRow = document.querySelector('.tag-row')
          if (tagRow) tagRow.innerHTML = inclusions.map(i => `<span class="tag-pill">${i}</span>`).join('')
        }
      } catch(e) {
        // Silently fall back to hardcoded HTML
      }
    },
  }

})()
