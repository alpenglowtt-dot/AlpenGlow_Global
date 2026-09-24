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
  const SUPABASE_URL      = 'https://api.alpenglowglobal.com'
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
  // Four independent scopes — verifying one does NOT unlock the others:
  //  - 'package' — package-page itinerary/pricing unlock, and the
  //                site-wide 30s first-visit popup (see below)
  //  - 'blog'    — blog/article unlock
  //  - 'offer'   — offer code reveal
  //  - 'planner' — the "Plan Your Trip" wizard AND the COMPASS chatbot
  // The one deliberate exception: completing 'planner' verification (which
  // requires BOTH phone and email) also satisfies 'package' — see
  // isPackageUnlocked() below.
  var VERIFY_SESSION_MS = 10 * 60 * 1000
  var _VERIFY_KEYS = {
    package: { flag: 'ag_verified_package', at: 'ag_verified_package_at' },
    blog:    { flag: 'ag_verified_blog',    at: 'ag_verified_blog_at' },
    offer:   { flag: 'ag_verified_offer',   at: 'ag_verified_offer_at' },
    planner: { flag: 'ag_verified_planner', at: 'ag_verified_planner_at' },
  }

  // Session-scoped QA override (see the key-chord handler further down).
  // sessionStorage only, so it dies with the tab; it never touches the backend.
  function bypassOn() {
    try { return sessionStorage.getItem('ag_qa_bypass') === '1' } catch (e) { return false }
  }
  function devOn() { return DEV_MODE || bypassOn() }

  function isVerified(scope) {
    if (devOn()) return true
    var k = _VERIFY_KEYS[scope] || _VERIFY_KEYS.package
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
    var k = _VERIFY_KEYS[scope] || _VERIFY_KEYS.package
    sessionStorage.setItem(k.flag, '1')
    sessionStorage.setItem(k.at, String(Date.now()))
    // Survives the 10-min TTL above: the site-wide popup is "once per
    // session", so once package access has been earned it must not come
    // back as a hard block when the package flag later expires — the
    // package pages' own gates cover that case instead.
    if (scope === 'package' || scope === 'planner') sessionStorage.setItem('ag_pkg_verified_once', '1')
  }
  // Package pages accept either their own 'package' verification OR a
  // completed Trip Planner/COMPASS ('planner') verification — the latter
  // already required both phone and email, so it satisfies the lighter
  // package-only requirement too. This is intentionally NOT symmetric:
  // 'package' verification does not satisfy 'planner', and neither
  // satisfies 'blog' or 'offer'.
  function isPackageUnlocked() {
    return isVerified('package') || isVerified('planner')
  }

  // ─── FIRST-30-SECONDS GRACE WINDOW ──────────────────────────────
  // For the first SITE_GRACE_MS of a session, package pages are open to
  // browse with no gate at all — this is the window before the site-wide
  // popup below forces a decision. session-start is set synchronously here
  // (not inside a DOMContentLoaded handler) so it exists before anything
  // else — the auto-unlock check further down and the popup's own
  // scheduler both read the exact same timestamp.
  var SITE_GRACE_MS = 30000
  if (!sessionStorage.getItem('ag_session_start')) {
    sessionStorage.setItem('ag_session_start', String(Date.now()))
  }
  function _withinGracePeriod() {
    var start = parseInt(sessionStorage.getItem('ag_session_start') || '0', 10)
    if (!start) return false
    return (Date.now() - start) < SITE_GRACE_MS
  }
  // What a package page (or the homepage's package teasers) should check to
  // decide whether to show its content right now — real verification OR
  // still inside the free grace window. Deliberately NOT the same thing
  // isPackageUnlocked() checks: the popup's own scheduling logic below needs
  // "has the user actually verified" without the grace window muddying it,
  // otherwise the popup would never even schedule itself during the window
  // it exists to end.
  function canViewPackageContent() {
    return isPackageUnlocked() || _withinGracePeriod()
  }

  // ─── PHONE NUMBER RULES (shared by every gate) ──────────────────
  // National mobile-number length (without the leading 0) per country code
  // offered in the site's dropdowns. Every gate used to hard-require exactly
  // 10 digits, which made Singapore, Australia, UAE, Malaysia, NZ and France
  // numbers impossible to verify.
  var PHONE_RULES = {
    '+91':  { min: 10, max: 10, ph: '98765 43210',  name: 'Indian' },
    '+1':   { min: 10, max: 10, ph: '201 555 0123', name: 'US' },
    '+44':  { min: 10, max: 10, ph: '7400 123456',  name: 'UK' },
    '+61':  { min: 9,  max: 9,  ph: '412 345 678',  name: 'Australian' },
    '+65':  { min: 8,  max: 8,  ph: '8123 4567',    name: 'Singapore' },
    '+971': { min: 9,  max: 9,  ph: '50 123 4567',  name: 'UAE' },
    '+60':  { min: 9,  max: 10, ph: '12 345 6789',  name: 'Malaysian' },
    '+64':  { min: 8,  max: 10, ph: '21 123 4567',  name: 'New Zealand' },
    '+49':  { min: 10, max: 11, ph: '151 2345 6789', name: 'German' },
    '+33':  { min: 9,  max: 9,  ph: '6 12 34 56 78', name: 'French' },
  }
  function phoneRule(cc) { return PHONE_RULES[cc] || { min: 6, max: 15, ph: '', name: '' } }
  // Digits only; drops a pasted country-code prefix ("+91 98765…") and a
  // trunk "0" ("07400…"), then caps at the country's max length.
  function cleanPhone(cc, raw) {
    var r = phoneRule(cc)
    var d = String(raw || '').replace(/\D/g, '')
    var ccd = String(cc || '').replace(/\D/g, '')
    if (ccd && d.length > r.max && d.indexOf(ccd) === 0) d = d.slice(ccd.length)
    return d.replace(/^0+/, '').slice(0, r.max)
  }
  function validatePhone(cc, raw) {
    var r = phoneRule(cc)
    var d = cleanPhone(cc, raw)
    var ok = d.length >= r.min && d.length <= r.max
    var len = r.min === r.max ? r.min : r.min + '–' + r.max
    return {
      ok: ok,
      digits: d,
      full: cc + d,
      msg: ok ? '' : 'Please enter a valid ' + len + '-digit ' + (r.name ? r.name + ' ' : '') + 'mobile number.',
    }
  }
  // Wire a country-code <select> + number <input> pair: placeholder follows
  // the selected country, input is cleaned as the user types or pastes.
  // maxlength is removed on purpose — it would truncate a pasted
  // "+91 98765 43210" before cleanPhone() can strip the prefix.
  // opts.placeholder === false leaves the placeholder alone (the Trip
  // Planner's floating label depends on its placeholder=" ").
  function bindPhoneField(sel, input, opts) {
    if (typeof sel === 'string') sel = document.getElementById(sel)
    if (typeof input === 'string') input = document.getElementById(input)
    if (!sel || !input || input.__agPhoneBound) return
    input.__agPhoneBound = true
    input.removeAttribute('maxlength')
    var setPh = !(opts && opts.placeholder === false)
    function sync() {
      if (setPh) input.placeholder = phoneRule(sel.value).ph || input.placeholder
      var c = cleanPhone(sel.value, input.value)
      if (c !== input.value) input.value = c
    }
    input.addEventListener('input', function () {
      var c = cleanPhone(sel.value, input.value)
      if (c !== input.value) input.value = c
    })
    sel.addEventListener('change', sync)
    sync()
  }

  function isValidEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v || '').trim()) }

  // 4-box OTP entry: digits only, auto-advance, Backspace steps back,
  // pasting "1234" into any box fills them all, Enter submits.
  function bindOtpInputs(ids, onSubmit) {
    var els = ids.map(function (id) { return typeof id === 'string' ? document.getElementById(id) : id })
    if (els.some(function (e) { return !e })) return
    els.forEach(function (el, i) {
      if (el.__agOtpBound) return
      el.__agOtpBound = true
      el.addEventListener('input', function () {
        var d = el.value.replace(/\D/g, '')
        if (d.length > 1) {
          d.split('').slice(0, els.length - i).forEach(function (ch, j) { els[i + j].value = ch })
          els[Math.min(i + d.length, els.length) - 1].focus()
          return
        }
        el.value = d
        if (d && i < els.length - 1) els[i + 1].focus()
      })
      el.addEventListener('keydown', function (e) {
        if (e.key === 'Backspace' && !el.value && i > 0) { els[i - 1].value = ''; els[i - 1].focus(); e.preventDefault() }
        if (e.key === 'Enter' && onSubmit) { e.preventDefault(); onSubmit() }
      })
      el.addEventListener('paste', function (e) {
        var t = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '')
        if (!t) return
        e.preventDefault()
        t.split('').slice(0, els.length).forEach(function (ch, j) { els[j].value = ch })
        els[Math.min(t.length, els.length) - 1].focus()
      })
    })
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
    markVerified('package')
    document.addEventListener('DOMContentLoaded', function () {
      _hideGateSidebar()
      document.querySelectorAll('.package-blur, .blog-blur').forEach(function (el) {
        el.style.display = 'none'
      })
    })
  }

  // Production mode: if already verified this session, auto-unlock on page
  // load. Each teaser class/element is gated by its OWN scope now — a page
  // marks which scope its own gate belongs to via <body data-verify-scope="...">
  // (only package pages set this, since they're the only page type with a
  // #detailMain/#contentOverlay gate) rather than api.js guessing page type.
  if (!DEV_MODE) {
    document.addEventListener('DOMContentLoaded', function () {
      var pageScope = document.body && document.body.getAttribute('data-verify-scope')
      if (pageScope === 'package' && canViewPackageContent()) {
        _hideGateSidebar()
        var overlay = document.getElementById('contentOverlay')
        if (overlay) { overlay.style.opacity = '0'; setTimeout(function () { overlay.remove() }, 500) }
      }
      // Homepage teaser cards — independent of which page this is, since
      // index.html hosts both kinds of teaser regardless of data-verify-scope.
      if (canViewPackageContent()) {
        document.querySelectorAll('.package-blur').forEach(function (el) { el.style.display = 'none' })
      }
      if (isVerified('blog')) {
        document.querySelectorAll('.blog-blur').forEach(function (el) { el.style.display = 'none' })
      }
    })
  }

  // ─── SITE-WIDE 30s FIRST-VISIT VERIFICATION POPUP ──────────────
  // 30 seconds after a visitor's session starts, if package pages still
  // aren't unlocked (own gate, this popup, or a completed Trip Planner/
  // COMPASS verification), show a hard-blocking overlay with the same
  // "pick WhatsApp or Email" flow. No close/skip button — intentional.
  // Keeps re-appearing on every page load until the visitor verifies (a
  // reload must not be a way around a hard block), then never again for
  // the rest of the session — see ag_pkg_verified_once in markVerified().
  if (!DEV_MODE) {
    ;(function () {
      var RETRY_MS = 3000

      function _tpIsOpen() {
        var root = document.getElementById('tp-root')
        return !!(root && root.classList.contains('tp-open'))
      }

      // Deliberately checks isPackageUnlocked() (real verification only),
      // NOT canViewPackageContent() — the grace window is what this popup
      // exists to end, so it must keep scheduling/firing through it.
      function _done() {
        return isPackageUnlocked() || sessionStorage.getItem('ag_pkg_verified_once') === '1'
      }

      function _tryFire() {
        if (_done() || document.getElementById('agSitePopup')) return
        if (_tpIsOpen()) { setTimeout(_tryFire, RETRY_MS); return }
        _showSitePopup()
      }

      function _schedule() {
        if (_done()) return
        // COMPASS already replaces its whole page with its own
        // Trip-Planner verification prompt; stacking a second, different
        // verification on top would be confusing and wouldn't unlock it.
        if (document.body && document.body.getAttribute('data-verify-scope') === 'planner') return
        var sessionStart = parseInt(sessionStorage.getItem('ag_session_start') || '0', 10)
        var remaining = Math.max(0, SITE_GRACE_MS - (Date.now() - sessionStart))
        setTimeout(_tryFire, remaining)
      }

      function _showSitePopup() {
        var overlay = document.createElement('div')
        overlay.id = 'agSitePopup'

        var style = document.createElement('style')
        style.textContent =
          '@keyframes agPopIn{from{opacity:0;transform:scale(.94) translateY(10px);}to{opacity:1;transform:scale(1) translateY(0);}}' +
          '#agSitePopup{position:fixed;inset:0;z-index:999999;background:rgba(10,10,10,.72);' +
            'backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);display:flex;' +
            'align-items:center;justify-content:center;padding:1.2rem;}' +
          '#agSitePopup .ag-pop-card{background:#181818;border-radius:22px;padding:2.4rem;' +
            'max-width:400px;width:100%;max-height:calc(100vh - 2.4rem);overflow-y:auto;' +
            'color:#fff;box-shadow:0 24px 70px rgba(0,0,0,.55);text-align:left;' +
            'font-family:inherit;box-sizing:border-box;animation:agPopIn .35s cubic-bezier(.16,1,.3,1);}' +
          '#agSitePopup .ag-pop-badge{display:inline-block;background:rgba(239,126,25,.15);' +
            'border:1px solid rgba(239,126,25,.35);color:#f5a623;font-size:.66rem;font-weight:700;' +
            'letter-spacing:.08em;text-transform:uppercase;padding:.35rem .8rem;border-radius:50px;' +
            'margin-bottom:.9rem;}' +
          '#agSitePopup h3{margin:0 0 .5rem;font-size:1.3rem;font-weight:700;font-family:inherit;letter-spacing:-.01em;}' +
          '#agSitePopup p{font-size:.85rem;color:rgba(255,255,255,.6);line-height:1.6;margin:0 0 1.5rem;}' +
          '#agSitePopup .form-group{margin-bottom:1.1rem;}' +
          '#agSitePopup label{display:block;font-size:.68rem;font-weight:600;color:rgba(255,255,255,.5);' +
            'letter-spacing:.08em;text-transform:uppercase;margin-bottom:.45rem;}' +
          '#agSitePopup input,#agSitePopup select{width:100%;padding:.8rem 1rem;border-radius:10px;' +
            'border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.07);color:#fff;' +
            'font-size:.9rem;font-family:inherit;box-sizing:border-box;outline:none;' +
            'transition:border-color .2s,background .2s;}' +
          '#agSitePopup input::placeholder{color:rgba(255,255,255,.32);}' +
          '#agSitePopup input:focus,#agSitePopup select:focus{border-color:#ef7e19;background:rgba(255,255,255,.1);}' +
          '#agSitePopup select{cursor:pointer;appearance:none;-webkit-appearance:none;' +
            'background-image:url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="10" height="6"><path d="M0 0l5 6 5-6z" fill="%23888"/></svg>\');' +
            'background-repeat:no-repeat;background-position:right 1rem center;padding-right:2.2rem;}' +
          '#agSitePopup .ag-phone-row{display:flex;gap:.6rem;}' +
          '#agSitePopup .ag-phone-row select{flex:0 0 auto;width:auto;min-width:92px;}' +
          '#agSitePopup .ag-phone-row input{flex:1 1 auto;width:auto;min-width:0;}' +
          '#agSitePopup .ag-ch-row{display:flex;gap:.6rem;margin-bottom:1.1rem;}' +
          '#agSitePopup .ag-ch-btn{flex:1;padding:.75rem;border-radius:10px;border:1px solid rgba(255,255,255,.14);' +
            'background:rgba(255,255,255,.05);color:rgba(255,255,255,.6);font-family:inherit;' +
            'font-size:.82rem;font-weight:600;cursor:pointer;transition:all .2s;}' +
          '#agSitePopup .ag-ch-btn:hover:not(.active){border-color:rgba(255,255,255,.3);color:#fff;}' +
          '#agSitePopup .ag-ch-btn.active{background:#ef7e19;border-color:#ef7e19;color:#181818;}' +
          '#agSitePopup .ag-otp-row{display:flex;gap:.6rem;margin-bottom:.9rem;}' +
          '#agSitePopup .ag-otp-row input{flex:1;min-width:0;width:auto;text-align:center;' +
            'padding:.75rem 0;font-size:1.2rem;font-weight:600;}' +
          '#agSitePopup .ag-err{font-size:.78rem;color:#ff8a7a;margin:-.3rem 0 .9rem;line-height:1.4;}' +
          '#agSitePopup .ag-err:empty{display:none;}' +
          '#agSitePopup .ag-back{display:inline-block;margin-top:1rem;font-size:.75rem;color:rgba(255,255,255,.5);' +
            'cursor:pointer;background:none;border:none;padding:0;font-family:inherit;}' +
          '#agSitePopup .ag-back:hover{color:#fff;}' +
          '@media (max-width:480px){' +
            '#agSitePopup{padding:.8rem;}' +
            '#agSitePopup .ag-pop-card{padding:1.6rem 1.3rem;border-radius:18px;max-height:calc(100vh - 1.6rem);}' +
            '#agSitePopup h3{font-size:1.15rem;}' +
            '#agSitePopup p{margin-bottom:1.1rem;}' +
            // 16px stops iOS Safari from zooming the page in on focus.
            '#agSitePopup input,#agSitePopup select{font-size:16px;}' +
            '#agSitePopup .ag-phone-row select{min-width:84px;padding-left:.8rem;}' +
          '}' +
          '#agSitePopup button.ag-btn{width:100%;padding:.9rem;border-radius:10px;border:none;' +
            'background:#ef7e19;color:#181818;font-weight:700;font-size:.88rem;letter-spacing:.02em;' +
            'cursor:pointer;transition:background .2s,transform .15s;}' +
          '#agSitePopup button.ag-btn:hover:not(:disabled){background:#f5a623;}' +
          '#agSitePopup button.ag-btn:active:not(:disabled){transform:translateY(1px);}' +
          '#agSitePopup button.ag-btn:disabled{opacity:.45;cursor:not-allowed;}' +
          '#agSitePopup .ag-resend{font-size:.75rem;color:rgba(255,255,255,.4);margin-bottom:1rem;}' +
          '#agSitePopup .ag-resend a{color:#f5a623;cursor:pointer;font-weight:600;}'
        overlay.appendChild(style)

        var card = document.createElement('div')
        card.className = 'ag-pop-card'
        card.innerHTML =
          '<div id="agPopStep1">' +
            '<span class="ag-pop-badge">Verification Required</span>' +
            '<h3>Quick verification</h3>' +
            '<p>Verify your WhatsApp or email to unlock full package details across the site.</p>' +
            '<div class="form-group"><label>Full Name</label><input type="text" id="agPopName" placeholder="Your name"></div>' +
            '<div class="ag-ch-row">' +
              '<button type="button" class="ag-ch-btn active" id="agPopChW">WhatsApp</button>' +
              '<button type="button" class="ag-ch-btn" id="agPopChE">Email</button>' +
            '</div>' +
            '<div class="form-group" id="agPopWaFields"><label>WhatsApp Number</label>' +
              '<div class="ag-phone-row">' +
                '<select id="agPopCC"><option value="+91">+91 IN</option><option value="+1">+1 US</option>' +
                  '<option value="+44">+44 UK</option><option value="+61">+61 AU</option>' +
                  '<option value="+65">+65 SG</option><option value="+971">+971 AE</option>' +
                  '<option value="+60">+60 MY</option><option value="+64">+64 NZ</option></select>' +
                '<input type="tel" id="agPopPhone" placeholder="98765 43210" inputmode="numeric" autocomplete="tel-national">' +
              '</div>' +
            '</div>' +
            '<div class="form-group" id="agPopEmailFields" style="display:none;">' +
              '<label>Email Address</label><input type="email" id="agPopEmail" placeholder="you@example.com" autocomplete="email"></div>' +
            '<div class="ag-err" id="agPopErr1"></div>' +
            '<button class="ag-btn" id="agPopBtn1">Send WhatsApp Code</button>' +
          '</div>' +
          '<div id="agPopStep2" style="display:none;">' +
            '<span class="ag-pop-badge">Verification Required</span>' +
            '<h3>Enter your code</h3>' +
            '<p id="agPopStep2Desc">Enter the 4-digit code sent to your WhatsApp.</p>' +
            '<div class="ag-otp-row">' +
              '<input type="tel" inputmode="numeric" autocomplete="one-time-code" maxlength="1" id="agPopOtp0">' +
              '<input type="tel" inputmode="numeric" maxlength="1" id="agPopOtp1">' +
              '<input type="tel" inputmode="numeric" maxlength="1" id="agPopOtp2">' +
              '<input type="tel" inputmode="numeric" maxlength="1" id="agPopOtp3">' +
            '</div>' +
            '<div class="ag-err" id="agPopErr2"></div>' +
            '<div class="ag-resend">Didn’t receive it? <a id="agPopResendLink">Resend</a></div>' +
            '<button class="ag-btn" id="agPopBtn2">Verify &amp; Continue</button>' +
            '<button type="button" class="ag-back" id="agPopBack">&larr; Change number</button>' +
          '</div>'
        overlay.appendChild(card)
        overlay.setAttribute('role', 'dialog')
        overlay.setAttribute('aria-modal', 'true')
        document.body.appendChild(overlay)
        var prevOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        // Hard block for keyboard users too: without this, Tab still reaches
        // links and buttons behind the blurred overlay.
        var inerted = []
        Array.prototype.forEach.call(document.body.children, function (el) {
          if (el !== overlay && el.tagName !== 'SCRIPT' && !el.hasAttribute('inert')) {
            el.setAttribute('inert', ''); inerted.push(el)
          }
        })

        var _ch = 'whatsapp', _name = '', _phone = '', _email = ''
        var $ = function (id) { return document.getElementById(id) }
        var OTP_IDS = ['agPopOtp0', 'agPopOtp1', 'agPopOtp2', 'agPopOtp3']
        function sendLabel() { return _ch === 'whatsapp' ? 'Send WhatsApp Code' : 'Send Email Code' }
        function err(n, msg, info) {
          var el = $('agPopErr' + n)
          el.textContent = msg || ''
          el.style.color = info ? 'rgba(255,255,255,.6)' : ''
        }

        bindPhoneField('agPopCC', 'agPopPhone')
        bindOtpInputs(OTP_IDS, function () { $('agPopBtn2').click() })
        ;['agPopName', 'agPopPhone', 'agPopEmail'].forEach(function (id) {
          $(id).addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); $('agPopBtn1').click() } })
          $(id).addEventListener('input', function () { err(1, '') })
        })

        function selectChannel(ch) {
          _ch = ch
          $('agPopChW').classList.toggle('active', ch === 'whatsapp')
          $('agPopChE').classList.toggle('active', ch === 'email')
          $('agPopWaFields').style.display = ch === 'whatsapp' ? '' : 'none'
          $('agPopEmailFields').style.display = ch === 'email' ? '' : 'none'
          $('agPopBtn1').textContent = sendLabel()
          err(1, '')
        }
        $('agPopChW').addEventListener('click', function () { selectChannel('whatsapp') })
        $('agPopChE').addEventListener('click', function () { selectChannel('email') })

        function goToOtpStep() {
          var wa = _ch === 'whatsapp'
          $('agPopStep2Desc').textContent = 'Enter the 4-digit code sent to ' + (wa ? 'WhatsApp ' + _phone : _email) + '.'
          $('agPopBack').innerHTML = '&larr; ' + (wa ? 'Change number' : 'Change email')
          OTP_IDS.forEach(function (id) { $(id).value = '' })
          err(2, '')
          $('agPopStep1').style.display = 'none'
          $('agPopStep2').style.display = 'block'
          setTimeout(function () { $('agPopOtp0').focus() }, 100)
        }

        $('agPopBack').addEventListener('click', function () {
          $('agPopStep2').style.display = 'none'
          $('agPopStep1').style.display = 'block'
          var b1 = $('agPopBtn1'); b1.disabled = false; b1.textContent = sendLabel()
          var b2 = $('agPopBtn2'); b2.disabled = false; b2.innerHTML = 'Verify &amp; Continue'
          $(_ch === 'whatsapp' ? 'agPopPhone' : 'agPopEmail').focus()
        })

        $('agPopBtn1').addEventListener('click', function () {
          var btn = this
          _name = $('agPopName').value.trim()
          if (!_name) { err(1, 'Please enter your name.'); $('agPopName').focus(); return }
          var send
          if (_ch === 'whatsapp') {
            var v = validatePhone($('agPopCC').value, $('agPopPhone').value)
            if (!v.ok) { err(1, v.msg); $('agPopPhone').focus(); return }
            _phone = v.full
            send = AlpenAPI.sendSMSOTP(_phone, 'site_popup', { name: _name })
          } else {
            _email = $('agPopEmail').value.trim()
            if (!isValidEmail(_email)) { err(1, 'Please enter a valid email address.'); $('agPopEmail').focus(); return }
            send = AlpenAPI.sendEmailOTP(_email, 'site_popup', { name: _name })
          }
          btn.textContent = 'Sending…'; btn.disabled = true
          send.then(goToOtpStep).catch(function (e) {
            btn.disabled = false; btn.textContent = sendLabel()
            err(1, (e && e.message) || 'Could not send the code. Please check your details and try again.')
          })
        })

        $('agPopResendLink').addEventListener('click', function () {
          OTP_IDS.forEach(function (id) { $(id).value = '' })
          err(2, 'A new code is on its way.', true)
          var p = _ch === 'whatsapp' ? AlpenAPI.sendSMSOTP(_phone, 'site_popup') : AlpenAPI.sendEmailOTP(_email, 'site_popup')
          p.catch(function (e) { err(2, (e && e.message) || 'Could not resend the code.') })
          $('agPopOtp0').focus()
        })

        $('agPopBtn2').addEventListener('click', function () {
          var btn = this
          if (btn.disabled) return
          var code = OTP_IDS.map(function (id) { return $(id).value }).join('')
          if (code.length < 4) { err(2, 'Please enter all 4 digits.'); $('agPopOtp0').focus(); return }
          btn.textContent = 'Verifying…'; btn.disabled = true
          err(2, '')

          function done() {
            AlpenAPI.submitLead({
              name: _name,
              phone: _ch === 'whatsapp' ? _phone : '',
              email: _ch === 'email' ? _email : '',
              source: 'site_popup',
              verifiedPhone: _ch === 'whatsapp',
              verifiedEmail: _ch === 'email',
            }).catch(function () {})
            document.querySelectorAll('.package-blur').forEach(function (el) { el.style.display = 'none' })
            if (typeof window.unlockContent === 'function') { try { window.unlockContent() } catch (e) {} }
            inerted.forEach(function (el) { el.removeAttribute('inert') })
            overlay.remove()
            document.body.style.overflow = prevOverflow
          }
          function fail(e) {
            btn.innerHTML = 'Verify &amp; Continue'; btn.disabled = false
            err(2, (e && e.message) || 'Invalid code. Please try again.')
          }

          if (_ch === 'whatsapp') {
            AlpenAPI.verifySMSOTP(_phone, code).then(function () { markVerified('package'); done() }).catch(fail)
          } else {
            AlpenAPI.verifyEmailOTP(_email, code, 'package').then(done).catch(fail)
          }
        })

        setTimeout(function () { $('agPopName').focus() }, 350)
      }

      document.addEventListener('DOMContentLoaded', _schedule)
    })()
  }

  // ─── SESSION QA OVERRIDE (Alt+Shift+B+T+R+4) ────────────────────
  // Hold Alt+Shift and press B, T, R and 4 (in any order, within 4s).
  // Skips every OTP step for the rest of this tab's session: gates read as
  // verified, OTP send/verify calls resolve locally without contacting the
  // backend, and anything locked on the current page opens immediately.
  // Client-side only — the gates were never a security boundary (the gated
  // content is publicly fetchable), they exist for lead capture.
  ;(function () {
    var NEED = [['KeyB'], ['KeyT'], ['KeyR'], ['Digit4', 'Numpad4']]
    var WINDOW_MS = 4000
    var seen = {}

    function reset() { seen = {} }

    function toast(msg) {
      var el = document.getElementById('agQaToast')
      if (!el) {
        el = document.createElement('div')
        el.id = 'agQaToast'
        el.setAttribute('role', 'status')
        el.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:2147483647;' +
          'background:#181818;color:#fff;border:1px solid rgba(239,126,25,.6);border-radius:999px;' +
          'padding:.6rem 1.1rem;font:600 .8rem/1.2 system-ui,sans-serif;box-shadow:0 8px 30px rgba(0,0,0,.4);' +
          'transition:opacity .4s;pointer-events:none;'
        document.body.appendChild(el)
      }
      el.textContent = msg
      el.style.opacity = '1'
      clearTimeout(el.__t)
      el.__t = setTimeout(function () { el.style.opacity = '0' }, 2600)
    }

    // Open whatever is locked on the page the visitor is looking at right now.
    function applyNow() {
      var pop = document.getElementById('agSitePopup')
      if (pop) {
        pop.remove()
        Array.prototype.forEach.call(document.body.children, function (el) { el.removeAttribute('inert') })
        document.body.style.overflow = ''
      }
      document.querySelectorAll('.package-blur, .blog-blur').forEach(function (el) { el.style.display = 'none' })
      _hideGateSidebar()
      var ov = document.getElementById('contentOverlay')
      if (ov) ov.remove()
      if (typeof window.unlockContent === 'function') { try { window.unlockContent() } catch (e) {} }
    }

    function activate() {
      var already = bypassOn()
      try { sessionStorage.setItem('ag_qa_bypass', '1') } catch (e) { return }
      applyNow()
      toast(already ? 'Verification bypass is already on for this session' : 'Verification bypass ON for this session')
    }

    window.addEventListener('keydown', function (e) {
      if (!(e.altKey && e.shiftKey)) { reset(); return }
      var idx = -1
      for (var i = 0; i < NEED.length; i++) if (NEED[i].indexOf(e.code) !== -1) idx = i
      if (idx === -1) return
      e.preventDefault() // stop the browser's own Alt+Shift+letter shortcuts from grabbing focus
      var now = Date.now()
      seen[idx] = now
      var complete = NEED.every(function (_, j) { return seen[j] && now - seen[j] < WINDOW_MS })
      if (complete) { reset(); activate() }
    }, true)
    window.addEventListener('keyup', function (e) { if (e.key === 'Alt' || e.key === 'Shift') reset() }, true)
    window.addEventListener('blur', reset)
  })()

  window.AlpenAPI = {
    /** Returns true if DEV_MODE or the session QA override is active (used by trip-planner.js to bypass OTP) */
    isDevMode: function() { return devOn() },

    /** True only for the session QA override — lets callers record leads honestly as unverified. */
    bypassActive: function() { return bypassOn() },

    /** Returns true if the visitor has already verified this session for the given scope */
    isVerified: isVerified,

    /** Returns true if the visitor has ACTUALLY verified for package access —
     *  either their own 'package' verification, or a completed Trip
     *  Planner/COMPASS ('planner') verification satisfies it too. Does NOT
     *  include the first-30s grace window — see canViewPackages() for that. */
    isPackageUnlocked: isPackageUnlocked,

    /** Returns true if package-page content should be shown right now —
     *  isPackageUnlocked() OR still inside the first-30-seconds-of-session
     *  grace window. This is what package pages and the homepage's package
     *  teasers should check on load, not isPackageUnlocked() directly. */
    canViewPackages: canViewPackageContent,

    markVerified: markVerified,

    /** Per-country phone rules shared by every gate — see PHONE_RULES. */
    phone: { rule: phoneRule, clean: cleanPhone, validate: validatePhone, bind: bindPhoneField },
    isValidEmail: isValidEmail,
    bindOtpInputs: bindOtpInputs,

    /** Send a 4-digit SMS OTP via Twilio */
    sendSMSOTP: (phone, purpose, metadata = {}) => {
      if (devOn()) return Promise.resolve({ ok: true })
      return callEdge('send-sms-otp', { phone, purpose, metadata })
    },

    /** Verify a submitted SMS OTP code */
    verifySMSOTP: async (phone, code) => {
      if (devOn()) return { verified: true }
      return callEdge('verify-sms-otp', { phone, code })
    },

    /** Send a 4-digit email OTP via Resend */
    sendEmailOTP: (email, purpose, metadata = {}) => {
      if (devOn()) return Promise.resolve({ ok: true })
      return callEdge('send-email-otp', { email, purpose, metadata })
    },

    /** Verify a submitted email OTP code.
     *  scope: 'package' | 'blog' | 'offer' | 'planner' — see markVerified/isVerified above. */
    verifyEmailOTP: async (email, code, scope) => {
      if (devOn()) return { verified: true }
      const r = await callEdge('verify-email-otp', { email, code })
      markVerified(scope)
      return r
    },

    /** Submit contact form — stores lead + emails agency */
    submitContact: (data) =>
      callEdge('submit-contact', data),

    /** Store a generic lead (blog, package gate, offer) */
    submitLead: (data) =>
      // A session with the QA override on never really verified anything, so
      // never let its leads claim otherwise.
      callEdge('submit-lead', bypassOn() ? Object.assign({}, data, { verifiedPhone: false, verifiedEmail: false }) : data),

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
      if (devOn()) return false
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

        // ── SEO meta kept in sync with CMS content ────────────
        // Without this, a CMS title/description edit would leave the static
        // <meta> tags in the HTML stale and contradicting the rendered page.
        const setMeta = (sel, val) => {
          if (!val) return
          const el = document.head.querySelector(sel)
          if (el) el.setAttribute('content', val)
        }
        if (d.meta_description) {
          setMeta('meta[name="description"]', d.meta_description)
          setMeta('meta[property="og:description"]', d.meta_description)
          setMeta('meta[name="twitter:description"]', d.meta_description)
        }
        if (d.page_title) {
          setMeta('meta[property="og:title"]', d.page_title)
          setMeta('meta[name="twitter:title"]', d.page_title)
        }
        if (d.hero_image_url) {
          const abs = new URL(resolveImg(d.hero_image_url), location.href).href
          setMeta('meta[property="og:image"]', abs)
          setMeta('meta[name="twitter:image"]', abs)
        }

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

        // ── Itinerary heading ─────────────────────────────────
        const itinHeadingEl = document.getElementById('itineraryHeading')
        if (itinHeadingEl && d.itinerary_heading) itinHeadingEl.textContent = d.itinerary_heading

        // ── Itinerary days ─────────────────────────────────────
        const itinerary = Array.isArray(d.itinerary) ? d.itinerary
          : (typeof d.itinerary === 'string' ? JSON.parse(d.itinerary || '[]') : [])
        const itinList = document.getElementById('itineraryList')
        if (itinList) {
          if (itinerary.length) {
            itinList.innerHTML = itinerary.map(function(day) {
              return `<div class="itinerary-day">
                <div class="itinerary-day-num">${day.range || ''}</div>
                <div class="itinerary-day-content"><h4>${day.title || ''}</h4><p>${day.desc || ''}</p></div>
              </div>`
            }).join('')
            itinList.style.display = ''
            if (itinHeadingEl) itinHeadingEl.style.display = ''
          } else if (Array.isArray(d.itinerary)) {
            // Explicit empty array (not "field absent") means the admin removed
            // the itinerary for this page — hide the section instead of leaving
            // stale hardcoded days visible.
            itinList.style.display = 'none'
            if (itinHeadingEl) itinHeadingEl.style.display = 'none'
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
