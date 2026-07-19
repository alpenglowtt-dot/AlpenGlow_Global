/**
 * api.js — AlpenGlow Global Backend Client
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
  const DEV_MODE = false
  // ─────────────────────────────────────────────────────────────

  // Self-hosted Supabase (see deploy/README.md). Swap VPS_IP for a domain
  // once you add one, and ANON_KEY for the value from generate-keys.js.
  const SUPABASE_URL      = 'http://169.58.43.191:8000'
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzg0NDczMjU5LCJleHAiOjE5NDIxNTMyNTl9.Flq3Vf1QHQA23sieMT472T5tnKkhzhLcJxdxtbjIv-s'

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
  // sessionStorage along with a timestamp. It's valid for
  // VERIFY_SESSION_MS (10 minutes) from that moment — any gate checked
  // via isVerified() during that window is skipped automatically.
  //
  // Two independent scopes:
  //  - 'site'    (default) — package pages, blog/article unlock, offer claim
  //  - 'planner' — the "Plan Your Trip" wizard AND the COMPASS chatbot,
  //                which intentionally do NOT share verification with the
  //                rest of the site (or with each other's opposite scope).
  var VERIFY_SESSION_MS = 10 * 60 * 1000
  var _VERIFY_KEYS = {
    site:    { flag: 'ag_verified',         at: 'ag_verified_at' },
    planner: { flag: 'ag_verified_planner', at: 'ag_verified_planner_at' },
  }

  function isVerified(scope) {
    if (DEV_MODE) return true
    var k = _VERIFY_KEYS[scope] || _VERIFY_KEYS.site
    if (sessionStorage.getItem(k.flag) !== '1') return false
    var verifiedAt = parseInt(sessionStorage.getItem(k.at) || '0', 10)
    if (!verifiedAt || (Date.now() - verifiedAt) > VERIFY_SESSION_MS) {
      sessionStorage.removeItem(k.flag)
      sessionStorage.removeItem(k.at)
      return false
    }
    return true
  }
  function markVerified(scope) {
    var k = _VERIFY_KEYS[scope] || _VERIFY_KEYS.site
    sessionStorage.setItem(k.flag, '1')
    sessionStorage.setItem(k.at, String(Date.now()))
  }

  // Inject thin global scrollbar style on every page
  ;(function () {
    var s = document.createElement('style')
    s.textContent =
      'html::-webkit-scrollbar{width:0;background:transparent}' +
      'html{scrollbar-width:none}'
    document.head.appendChild(s)
  })()

  // Dev mode: auto-unlock gates and hide blur overlays on page load.
  // (isVerified() already returns true unconditionally in DEV_MODE for any
  // scope, so no flag needs to be set here — kept only for pages that read
  // sessionStorage directly instead of going through AlpenAPI.)
  // Package pages: hide the sidebar (gate card) entirely once unlocked and
  // widen the main content to fill the freed space, instead of leaving an
  // "Already verified" / "DEV MODE" placeholder card behind.
  function _hideGateSidebar() {
    var main = document.getElementById('detailMain')
    if (main) main.classList.remove('locked')
    var sidebar = document.querySelector('.detail-sidebar')
    if (sidebar) sidebar.style.display = 'none'
    var wrap = document.querySelector('.detail-wrap')
    if (wrap) wrap.classList.add('wrap-full')
  }

  if (DEV_MODE) {
    markVerified()
    document.addEventListener('DOMContentLoaded', function () {
      _hideGateSidebar()
      document.querySelectorAll('.package-blur, .blog-blur').forEach(function (el) {
        el.style.display = 'none'
      })
    })
  }

  // Production mode: if already verified this session, auto-unlock on page load
  if (!DEV_MODE) {
    document.addEventListener('DOMContentLoaded', function () {
      if (!isVerified()) return
      _hideGateSidebar()
      // Homepage: remove blur overlays so blog cards show fully
      document.querySelectorAll('.package-blur, .blog-blur').forEach(function (el) {
        el.style.display = 'none'
      })
      var overlay = document.getElementById('contentOverlay')
      if (overlay) { overlay.style.opacity = '0'; setTimeout(function () { overlay.remove() }, 500) }
    })
  }

  window.AlpenAPI = {
    /** Returns true if DEV_MODE is active (used by trip-planner.js to bypass OTP) */
    isDevMode: function() { return DEV_MODE },

    /** Returns true if the visitor has already verified this session */
    isVerified: isVerified,

    markVerified: markVerified,

    /** Send a 4-digit SMS OTP via Twilio */
    sendSMSOTP: (phone, purpose, metadata = {}) => {
      if (DEV_MODE) return Promise.resolve({ ok: true })
      return callEdge('send-sms-otp', { phone, purpose, metadata })
    },

    /** Verify a submitted SMS OTP code */
    verifySMSOTP: async (phone, code) => {
      if (DEV_MODE) return { verified: true }
      return callEdge('verify-sms-otp', { phone, code })
    },

    /** Send a 4-digit email OTP via Resend */
    sendEmailOTP: (email, purpose, metadata = {}) => {
      if (DEV_MODE) return Promise.resolve({ ok: true })
      return callEdge('send-email-otp', { email, purpose, metadata })
    },

    /** Verify a submitted email OTP code.
     *  scope: 'site' (default) or 'planner' — see markVerified/isVerified above. */
    verifyEmailOTP: async (email, code, scope) => {
      if (DEV_MODE) return { verified: true }
      const r = await callEdge('verify-email-otp', { email, code })
      markVerified(scope)
      return r
    },

    /** Submit contact form — stores lead + emails agency */
    submitContact: (data) =>
      callEdge('submit-contact', data),

    /** Store a generic lead (blog, package gate, offer) */
    submitLead: (data) =>
      callEdge('submit-lead', data),

    /** Fetch active offers from local data/offers.json */
    fetchOffers: () => {
      const D = window.ALPEN_DATA
      if (D && Array.isArray(D.offers))
        return Promise.resolve(D.offers.filter(o => o.active !== false))
      return fetch(dataUrl('data/offers.json')).then(r => r.json())
        .then(arr => arr.filter(o => o.active !== false)).catch(() => [])
    },

    /** Fetch active blog posts from local data/blog_posts.json */
    fetchBlogPosts: () => {
      const D = window.ALPEN_DATA
      if (D && Array.isArray(D.blog_posts))
        return Promise.resolve(D.blog_posts.filter(o => o.active !== false))
      return fetch(dataUrl('data/blog_posts.json')).then(r => r.json())
        .then(arr => arr.filter(o => o.active !== false)).catch(() => [])
    },

    /** Fetch active destinations from local data/destinations.json */
    fetchDestinations: () => {
      const D = window.ALPEN_DATA
      if (D && Array.isArray(D.destinations))
        return Promise.resolve(D.destinations.filter(o => o.active !== false).sort((a,b) => (a.sort_order||0)-(b.sort_order||0)))
      return fetch(dataUrl('data/destinations.json')).then(r => r.json())
        .then(arr => arr.filter(o => o.active !== false).sort((a,b) => (a.sort_order||0)-(b.sort_order||0))).catch(() => [])
    },

    /** Fetch active tour packages from local data/packages.json */
    fetchPackages: () => {
      const D = window.ALPEN_DATA
      if (D && Array.isArray(D.packages))
        return Promise.resolve(D.packages.filter(o => o.active !== false).sort((a,b) => (a.sort_order||0)-(b.sort_order||0)))
      return fetch(dataUrl('data/packages.json')).then(r => r.json())
        .then(arr => arr.filter(o => o.active !== false).sort((a,b) => (a.sort_order||0)-(b.sort_order||0))).catch(() => [])
    },

    /** Returns true if this phone+code combo already claimed an offer.
     *  Goes through the submit-lead Edge Function (service-role) because the
     *  leads table is not readable with the public anon key. */
    checkOfferClaimed: async (phone, code) => {
      if (DEV_MODE) return false
      try {
        const r = await callEdge('submit-lead', { action: 'check_offer', phone, offerCode: code })
        return !!(r && r.claimed)
      } catch { return false }
    },

    /** Fetch a single package page from local data/pages/{slug}.json (used by dev.html) */
    fetchPackagePage: (slug) => {
      const D = window.ALPEN_DATA
      if (D && D.pages && D.pages[slug]) return Promise.resolve(D.pages[slug])
      return fetch(dataUrl('data/pages/' + encodeURIComponent(slug) + '.json'))
        .then(r => r.json()).catch(() => null)
    },

    /**
     * loadPackagePage(slug)
     * Called at the bottom of each package HTML page.
     * Fetches data/pages/{slug}.json (or bundled data) and overwrites the DOM.
     * Falls back silently to hardcoded HTML if no record found.
     */
    loadPackagePage: async function(slug) {
      try {
        const D = window.ALPEN_DATA
        let d = (D && D.pages && D.pages[slug]) ? D.pages[slug] : null
        if (!d) {
          const r = await fetch(dataUrl('data/pages/' + encodeURIComponent(slug) + '.json'))
          if (!r.ok) return
          d = await r.json()
        }
        if (!d) return

        // ── Side background image (body::before) ─────────────
        if (d.bg_image_url) {
          document.body.classList.add('has-page-bg')
          var bgStyle = document.getElementById('_ag_bg_style')
          if (!bgStyle) {
            bgStyle = document.createElement('style')
            bgStyle.id = '_ag_bg_style'
            document.head.appendChild(bgStyle)
          }
          bgStyle.textContent = 'body.has-page-bg::before { background-image: url("' + resolveImg(d.bg_image_url).replace(/"/g, '\\"') + '"); }'
        } else {
          document.body.classList.remove('has-page-bg')
          var existing = document.getElementById('_ag_bg_style')
          if (existing) existing.remove()
        }

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
          /* Preserve overview-card-float wrapper if present in the page template */
          const cardFloat = overviewEl.querySelector('.overview-card-float')
          const target = cardFloat || overviewEl
          target.innerHTML = `<h2>${d.overview_heading || 'Overview'}</h2>`
            + (cardFloat ? '<div class="o-rule"></div>' : '')
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
        console.error('[AlpenAPI] loadPackagePage error:', e)
      }
    },
  }

})()
