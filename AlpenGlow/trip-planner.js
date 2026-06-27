/* ═══════════════════════════════════════════════════════════
   ALPENGLOW TRIP PLANNER — vanilla JS, no frameworks
   Requires: @supabase/supabase-js v2 loaded via CDN before this file
   Exposes: window.initTripPlanner()
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ─── Supabase JS client (CDN: @supabase/supabase-js v2) ─── */
  const SB_URL = 'https://yexrmmhadfscormovskn.supabase.co';
  const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlleHJtbWhhZGZzY29ybW92c2tuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzNjg0NzYsImV4cCI6MjA5Nzk0NDQ3Nn0.vxkcZDdTfE0qDxW8YwsnbGsLaaSUfwgZ78nQicq2Uoc';

  /* Lazy-init the client once (window.supabase is set by the CDN script) */
  let _sb = null;
  function _getSb() {
    if (!_sb) {
      if (!window.supabase) { console.warn('[TripPlanner] Supabase CDN not loaded'); return null; }
      _sb = window.supabase.createClient(SB_URL, SB_KEY);
    }
    return _sb;
  }

  /* Base path — resolves local images relative to this script */
  const BASE = (function () {
    const s = document.currentScript;
    if (s && s.src) return s.src.replace(/trip-planner\.js(\?.*)?$/, '');
    return './';
  })();

  /* ─────────────────────────────────────────────────────────────
     CONFIG  — edit destinations, vibes, options here;
               render logic never needs to change.
     ───────────────────────────────────────────────────────────── */

  /* Unsplash helper */
  const UNS = (id, w) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w || 900}&q=80`;

  const VIBES = [
    { id:'beach',     label:'Beach',              sub:'Sun, sand & sea',           img: UNS('photo-1507525428034-b723cf961d3e') },
    { id:'mountains', label:'Mountains',           sub:'Peaks & crisp air',         img: UNS('photo-1506905925346-21bda4d32df4') },
    { id:'cultural',  label:'Cultural / Heritage', sub:'History & traditions',      img: UNS('photo-1524492412937-b28074a5d7da') },
    { id:'adventure', label:'Adventure',           sub:'Thrills & the unknown',     img: UNS('photo-1551632811-561732d1e306') },
    { id:'wildlife',  label:'Wildlife',            sub:'Nature up close',           img: UNS('photo-1516426122078-c23e76319801') },
    { id:'honeymoon', label:'Honeymoon / Romantic',sub:'Just the two of you',      img: UNS('photo-1530103862676-de8c9debad1d') },
  ];

  /* Vibe backgrounds — full-screen hero on hover / select */
  const VIBE_BGS = {
    beach:     UNS('photo-1507525428034-b723cf961d3e', 1920),
    mountains: UNS('photo-1506905925346-21bda4d32df4', 1920),
    cultural:  UNS('photo-1524492412937-b28074a5d7da', 1920),
    adventure: UNS('photo-1551632811-561732d1e306',    1920),
    wildlife:  UNS('photo-1516426122078-c23e76319801', 1920),
    honeymoon: UNS('photo-1530103862676-de8c9debad1d', 1920),
  };

  /* Destinations — vibes[] drives ordering in step 2
     bestMonths: 0-based indices (0=Jan … 11=Dec) — months the destination is in peak/good season
     alt: suggested alternative when month is outside best season */
  const DESTINATIONS = [
    {
      id:'maldives', name:'Maldives', country:'Indian Ocean',
      img: BASE + 'maldives.jpg',
      vibes:['beach','honeymoon'],
      bestMonths:[10,11,0,1,2,3],
      proof:1847, proofPop:false,
      alt:'Seychelles',
      altReason:'wet season (May–Oct)'
    },
    {
      id:'bali', name:'Bali', country:'Indonesia',
      img: BASE + 'bali.jpg',
      vibes:['beach','cultural','honeymoon','adventure'],
      bestMonths:[3,4,5,6,7,8,9],
      proof:2103, proofPop:true,
      alt:'Maldives',
      altReason:'rainy season (Nov–Mar)'
    },
    {
      id:'seychelles', name:'Seychelles', country:'Indian Ocean',
      img: BASE + 'seychelles.jpg',
      vibes:['beach','honeymoon'],
      bestMonths:[3,4,9,10],
      proof:892, proofPop:false,
      alt:'Mauritius',
      altReason:'trade winds (Jun–Aug can be rough)'
    },
    {
      id:'mauritius', name:'Mauritius', country:'Indian Ocean',
      img: BASE + 'mauritius.jpg',
      vibes:['beach','honeymoon'],
      bestMonths:[4,5,6,7,8,9,10,11],
      proof:743, proofPop:false,
      alt:'Maldives',
      altReason:'cyclone season (Jan–Mar)'
    },
    {
      id:'santorini', name:'Santorini', country:'Greece',
      img: BASE + 'santorini.jpg',
      vibes:['beach','honeymoon','cultural'],
      bestMonths:[3,4,5,8,9],
      proof:1156, proofPop:false,
      alt:'Maldives',
      altReason:'off-season (Nov–Feb, many venues closed)'
    },
    {
      id:'srilanka', name:'Sri Lanka', country:'South Asia',
      img: BASE + 'srilanka.jpg',
      vibes:['beach','cultural','wildlife'],
      bestMonths:[10,11,0,1,2,3],
      proof:634, proofPop:false,
      alt:'Thailand',
      altReason:'southwest monsoon (May–Sep)'
    },
    {
      id:'thailand', name:'Thailand', country:'Southeast Asia',
      img: UNS('photo-1528181304800-259b08848526'),
      vibes:['beach','cultural','adventure'],
      bestMonths:[10,11,0,1,2,3],
      proof:1543, proofPop:false,
      alt:'Bali',
      altReason:'rainy season (Apr–Sep on west coast)'
    },
    {
      id:'dubai', name:'Dubai', country:'UAE',
      img: UNS('photo-1512453979798-5ea266f8880c'),
      vibes:['cultural','honeymoon','adventure'],
      bestMonths:[10,11,0,1,2,3],
      proof:876, proofPop:false,
      alt:'Maldives',
      altReason:'extreme summer heat (May–Sep, 45 °C+)'
    },
    {
      id:'switzerland', name:'Switzerland', country:'Europe',
      img: BASE + 'switzerland.jpg',
      vibes:['mountains','honeymoon'],
      bestMonths:[5,6,7,8],
      proof:1289, proofPop:false,
      alt:'Maldives',
      altReason:'alpine winter (Dec–Mar — great for ski, less for sightseeing)'
    },
    {
      id:'nepal', name:'Nepal', country:'South Asia',
      img: BASE + 'nepal.jpg',
      vibes:['mountains','adventure','wildlife'],
      bestMonths:[2,3,9,10],
      proof:967, proofPop:false,
      alt:'Bhutan',
      altReason:'monsoon (Jun–Aug, trails muddy and leeches active)'
    },
    {
      id:'bhutan', name:'Bhutan', country:'South Asia',
      img: BASE + 'bhutan.jpg',
      vibes:['mountains','cultural','adventure'],
      bestMonths:[2,3,4,8,9,10],
      proof:412, proofPop:false,
      alt:'Nepal',
      altReason:'monsoon (Jul–Aug, limited trekking)'
    },
    {
      id:'scandinavia', name:'Scandinavia', country:'Norway · Iceland · Finland',
      img: BASE + 'norway.jpg',
      vibes:['mountains','adventure'],
      bestMonths:[5,6,7,11,0,1],
      proof:523, proofPop:false,
      alt:'Switzerland',
      altReason:'polar night season (unless Northern Lights is the goal!)'
    },
    {
      id:'newzealand', name:'New Zealand', country:'Pacific',
      img: BASE + 'newzealand.jpg',
      vibes:['mountains','adventure','wildlife'],
      bestMonths:[11,0,1,2],
      proof:718, proofPop:false,
      alt:'Australia',
      altReason:'winter (Jun–Aug — cold in the South Island)'
    },
    {
      id:'australia', name:'Australia', country:'Pacific',
      img: BASE + 'australia.jpg',
      vibes:['adventure','wildlife'],
      bestMonths:[2,3,4,8,9,10],
      proof:856, proofPop:false,
      alt:'New Zealand',
      altReason:'tropical monsoon in the North (Dec–Mar) or intense heat in the interior'
    },
    {
      id:'japan', name:'Japan', country:'East Asia',
      img: BASE + 'japan.jpg',
      vibes:['cultural'],
      bestMonths:[2,3,4,9,10],
      proof:1634, proofPop:false,
      alt:'South Korea',
      altReason:'rainy season (Jun–Jul) or peak summer humidity'
    },
    {
      id:'india', name:'India', country:'South Asia',
      img: BASE + 'india.jpg',
      vibes:['cultural','wildlife','adventure'],
      bestMonths:[9,10,11,0,1,2],
      proof:2456, proofPop:true,
      alt:'Sri Lanka',
      altReason:'monsoon & peak summer heat (May–Sep)'
    },
    {
      id:'southkorea', name:'South Korea', country:'East Asia',
      img: BASE + 'southkorea.jpg',
      vibes:['cultural'],
      bestMonths:[3,4,5,8,9,10],
      proof:487, proofPop:false,
      alt:'Japan',
      altReason:'harsh winter (Dec–Feb) or humid summer monsoon (Jul–Aug)'
    },
    {
      id:'italy', name:'Italy', country:'Europe',
      img: BASE + 'italy.jpg',
      vibes:['cultural','honeymoon'],
      bestMonths:[3,4,5,8,9],
      proof:1102, proofPop:false,
      alt:'Santorini',
      altReason:'peak summer crowds (Jul–Aug) or cold winters'
    },
    {
      id:'rivercruise', name:'European River Cruise', country:'Europe',
      img: BASE + 'europeanrivercruise.jpg',
      vibes:['cruise','cultural'],
      bestMonths:[4,5,6,7,8],
      proof:789, proofPop:false,
      alt:null, altReason:null
    },
    {
      id:'royalcaribbean', name:'Royal Caribbean', country:'Caribbean / Asia',
      img: BASE + 'royalcaribbean.jpg',
      vibes:['cruise','adventure'],
      bestMonths:[10,11,0,1,2,3],
      proof:1234, proofPop:false,
      alt:null, altReason:null
    },
    {
      id:'resortsworld', name:'Resorts World Cruise', country:'Singapore / Asia',
      img: BASE + 'resortsworld.jpg',
      vibes:['cruise'],
      proof:543, proofPop:false,
      bestMonths:[0,1,2,3,4,5,6,7,8,9,10,11], /* year-round */
      alt:null, altReason:null
    },
  ];

  /* Icon glyphs — avoids all broken-image issues; looks more premium */
  const TRAVELER_TYPES = [
    { id:'couple',  label:'Couple',          sub:'Two of you',            icon:'♡',  desc:'Romantic getaways & honeymoon packages' },
    { id:'family',  label:'Family',          sub:'Kids & grown-ups',      icon:'⌂',  desc:'Kid-friendly stays & activities included' },
    { id:'friends', label:'Friends',         sub:'Squad goals',           icon:'✦',  desc:'Group bookings & shared experiences' },
    { id:'solo',    label:'Solo',            sub:'Just me',               icon:'◈',  desc:'Safe, curated experiences for one' },
    { id:'senior',  label:'Senior Citizen',  sub:'Comfort & ease first', icon:'✿',  desc:'Slower pace, comfortable transfers' },
  ];

  const MONTHS = [
    { abbr:'Jan', full:'January',   idx:0  },
    { abbr:'Feb', full:'February',  idx:1  },
    { abbr:'Mar', full:'March',     idx:2  },
    { abbr:'Apr', full:'April',     idx:3  },
    { abbr:'May', full:'May',       idx:4  },
    { abbr:'Jun', full:'June',      idx:5  },
    { abbr:'Jul', full:'July',      idx:6  },
    { abbr:'Aug', full:'August',    idx:7  },
    { abbr:'Sep', full:'September', idx:8  },
    { abbr:'Oct', full:'October',   idx:9  },
    { abbr:'Nov', full:'November',  idx:10 },
    { abbr:'Dec', full:'December',  idx:11 },
  ];

  const CITIES = [
    { name:'Mumbai',        country:'India' },
    { name:'Delhi',         country:'India' },
    { name:'Bangalore',     country:'India' },
    { name:'Chennai',       country:'India' },
    { name:'Hyderabad',     country:'India' },
    { name:'Kolkata',       country:'India' },
    { name:'Pune',          country:'India' },
    { name:'Ahmedabad',     country:'India' },
    { name:'Jaipur',        country:'India' },
    { name:'Kochi',         country:'India' },
    { name:'Goa',           country:'India' },
    { name:'Chandigarh',    country:'India' },
    { name:'Lucknow',       country:'India' },
    { name:'Indore',        country:'India' },
    { name:'Coimbatore',    country:'India' },
    { name:'Nagpur',        country:'India' },
    { name:'Visakhapatnam', country:'India' },
    { name:'Surat',         country:'India' },
    { name:'Bhopal',        country:'India' },
    { name:'Dubai',         country:'UAE'   },
    { name:'Singapore',     country:'Singapore' },
    { name:'London',        country:'UK'    },
    { name:'New York',      country:'USA'   },
    { name:'Sydney',        country:'Australia' },
  ];

  const DURATIONS = [
    { id:'3-4',   label:'3 – 4 Days',  desc:'Short escape',    popular:false },
    { id:'5-6',   label:'5 – 6 Days',  desc:'Sweet spot',      popular:true  },
    { id:'7-8',   label:'7 – 8 Days',  desc:'Full week',       popular:false },
    { id:'9-15',  label:'9 – 15 Days', desc:'Deep dive',       popular:false },
  ];

  const BUDGETS = [
    { id:'budget',    icon:'💰', name:'Budget',    desc:'Value picks, local stays, street food & smart choices.' },
    { id:'midrange',  icon:'✈️', name:'Mid-range', desc:'Comfortable hotels, curated tours, a few splurges.' },
    { id:'premium',   icon:'🥂', name:'Premium',   desc:'4-star resorts, business class, private transfers.' },
    { id:'luxury',    icon:'👑', name:'Luxury',    desc:'Over-water villas, butler service, bespoke itineraries.' },
  ];

  /* Step backgrounds (full-screen behind each question) */
  const STEP_BGS = [
    UNS('photo-1476514525535-07fb3b4ae5f1', 1920), /* 0 – vibe          */
    UNS('photo-1476514525535-07fb3b4ae5f1', 1920), /* 1 – destination   */
    UNS('photo-1491555103944-7c647fd857e6', 1920), /* 2 – travelers     */
    UNS('photo-1566438480900-0609be27a4be', 1920), /* 3 – count/rooms   */
    UNS('photo-1436491865332-7a61a109cc05', 1920), /* 4 – month         */
    UNS('photo-1500835556837-99ac94a94552', 1920), /* 5 – origin city   */
    UNS('photo-1503220317375-aaad61436b1b', 1920), /* 6 – duration      */
    UNS('photo-1455587734955-081b22074882', 1920), /* 7 – budget        */
    UNS('photo-1452421822248-d4c2b47f0c81', 1920), /* 8 – contact       */
  ];

  /* ─────────────────────────────────────────────────────────────
     STATE
     ───────────────────────────────────────────────────────────── */
  let _s = {
    sessionId:       null,
    step:            0,
    answers:         {},      /* { vibe, destination, travelerType, adults, children, rooms, month, originCity, duration, budget, name, phone, email } */
    direction:       'fwd',
    warnDismissed:   false,
    activeBg:        'a',     /* which bg layer is currently visible */
    currentBgUrl:    '',
  };

  /* ─────────────────────────────────────────────────────────────
     STEP DEFINITIONS
     ───────────────────────────────────────────────────────────── */
  const STEPS = [
    { id:'vibe',        crumb:'Vibe',        q:'What kind of escape are you dreaming of?',       render: renderVibe        },
    { id:'destination', crumb:'Destination', q:'Where would you like to go?',                    render: renderDestination },
    { id:'travelers',   crumb:'Travelers',   q:'Who\'s coming along?',                           render: renderTravelers   },
    { id:'count',       crumb:'Group Size',  q:'How many travelers and rooms?',                  render: renderCount       },
    { id:'month',       crumb:'Month',       q:'When are you planning to travel?',               render: renderMonth       },
    { id:'origin',      crumb:'From',        q:'Which city will you fly from?',                  render: renderOrigin      },
    { id:'duration',    crumb:'Duration',    q:'How long do you want to travel?',                render: renderDuration    },
    { id:'budget',      crumb:'Budget',      q:'What\'s your budget range?',                     render: renderBudget      },
    { id:'contact',     crumb:'Contact',     q:'Almost there — how should we reach you?',        render: renderContact     },
  ];

  /* ─────────────────────────────────────────────────────────────
     DOM REFS (set once in _inject)
     ───────────────────────────────────────────────────────────── */
  let _root, _bgA, _bgB, _breadcrumb, _progressFill, _stepWrap, _footer, _btnBack, _stepCt, _warn, _confirm;

  /* ─────────────────────────────────────────────────────────────
     ENTRY POINT
     ───────────────────────────────────────────────────────────── */
  function initTripPlanner() {
    if (document.getElementById('tp-root')) {
      /* already injected — just re-open */
      _state_reset();
      _open();
      return;
    }
    _s.sessionId = sessionStorage.getItem('tp_sid') || _uuid();
    sessionStorage.setItem('tp_sid', _s.sessionId);
    _inject();
    _bindGlobal();
    _renderStep(0, 'fwd');
    _open();
  }

  /* ─────────────────────────────────────────────────────────────
     INJECT HTML
     ───────────────────────────────────────────────────────────── */
  function _inject() {
    const div = document.createElement('div');
    div.innerHTML = `
<div id="tp-root">
  <div id="tp-bg-a" class="tp-bg tp-bg-visible"></div>
  <div id="tp-bg-b" class="tp-bg tp-bg-hidden"></div>
  <div id="tp-veil"></div>

  <header id="tp-header">
    <button id="tp-close" aria-label="Close trip planner">✕</button>
    <nav id="tp-breadcrumb"></nav>
    <div id="tp-progress"><div id="tp-progress-fill"></div></div>
  </header>

  <main id="tp-main">
    <div id="tp-step-wrap"></div>
    <div id="tp-warn">
      <span id="tp-warn-text"></span>
      <button id="tp-warn-dismiss" aria-label="Dismiss">✕</button>
    </div>
  </main>

  <div id="tp-confirm">
    <div class="tp-confirm-circle">✓</div>
    <div class="tp-confirm-title">You're all set!</div>
    <div class="tp-confirm-sub">Our travel expert will reach out within 24 hours with a personalised itinerary just for you.</div>
    <button class="tp-confirm-close">Close</button>
  </div>

  <footer id="tp-footer">
    <button id="tp-btn-back">&#8592; Back</button>
    <span class="tp-step-ct" id="tp-step-ct"></span>
  </footer>
</div>`;
    document.body.appendChild(div.firstElementChild);

    _root         = document.getElementById('tp-root');
    _bgA          = document.getElementById('tp-bg-a');
    _bgB          = document.getElementById('tp-bg-b');
    _breadcrumb   = document.getElementById('tp-breadcrumb');
    _progressFill = document.getElementById('tp-progress-fill');
    _stepWrap     = document.getElementById('tp-step-wrap');
    _footer       = document.getElementById('tp-footer');
    _btnBack      = document.getElementById('tp-btn-back');
    _stepCt       = document.getElementById('tp-step-ct');
    _warn         = document.getElementById('tp-warn');
    _confirm      = document.getElementById('tp-confirm');
  }

  /* ─────────────────────────────────────────────────────────────
     GLOBAL EVENT BINDINGS
     ───────────────────────────────────────────────────────────── */
  function _bindGlobal() {
    document.getElementById('tp-close').addEventListener('click', _close);
    _btnBack.addEventListener('click', _goBack);
    document.getElementById('tp-warn-dismiss').addEventListener('click', function () {
      _warn.classList.remove('tp-show');
      _s.warnDismissed = true;
    });
    _confirm.querySelector('.tp-confirm-close').addEventListener('click', _close);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && _root && _root.classList.contains('tp-open')) _close();
    });
  }

  /* ─────────────────────────────────────────────────────────────
     OPEN / CLOSE
     ───────────────────────────────────────────────────────────── */
  function _open() {
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(function () { _root.classList.add('tp-open'); });
  }

  function _close() {
    _root.classList.remove('tp-open');
    setTimeout(function () {
      document.body.style.overflow = '';
      _confirm.classList.remove('tp-show');
    }, 500);
  }

  function _state_reset() {
    _s.step          = 0;
    _s.answers       = {};
    _s.warnDismissed = false;
    _s.sessionId     = _uuid();
    sessionStorage.setItem('tp_sid', _s.sessionId);
    _renderStep(0, 'fwd');
  }

  /* ─────────────────────────────────────────────────────────────
     BACKGROUND SWAP
     ───────────────────────────────────────────────────────────── */
  function _setBg(url) {
    if (!url || url === _s.currentBgUrl) return;
    _s.currentBgUrl = url;
    const incoming = _s.activeBg === 'a' ? _bgB : _bgA;
    const outgoing = _s.activeBg === 'a' ? _bgA : _bgB;
    incoming.style.backgroundImage = 'url(' + url + ')';
    incoming.classList.remove('tp-bg-hidden');
    incoming.classList.add('tp-bg-visible');
    outgoing.classList.remove('tp-bg-visible');
    outgoing.classList.add('tp-bg-hidden');
    _s.activeBg = _s.activeBg === 'a' ? 'b' : 'a';
  }

  /* ─────────────────────────────────────────────────────────────
     STEP NAVIGATION
     ───────────────────────────────────────────────────────────── */
  function _goTo(stepIdx, direction) {
    _s.direction = direction || 'fwd';
    _s.step      = stepIdx;
    _renderStep(stepIdx, _s.direction);
  }

  function _goBack() {
    if (_s.step > 0) _goTo(_s.step - 1, 'back');
  }

  function _advance() {
    if (_s.step < STEPS.length - 1) {
      _goTo(_s.step + 1, 'fwd');
    }
  }

  /* ─────────────────────────────────────────────────────────────
     RENDER DISPATCHER
     ───────────────────────────────────────────────────────────── */
  function _renderStep(idx, dir) {
    _setBg(STEP_BGS[idx]);
    _updateBreadcrumb(idx);
    _updateProgress(idx);
    _btnBack.hidden = idx === 0;
    _stepCt.textContent = 'Step ' + (idx + 1) + ' of ' + STEPS.length;
    _warn.classList.remove('tp-show');

    const animClass = dir === 'back' ? 'tp-anim-in-back' : 'tp-anim-in-fwd';
    const html = STEPS[idx].render();
    _stepWrap.innerHTML = html;
    _stepWrap.classList.remove('tp-anim-in-fwd', 'tp-anim-in-back');
    void _stepWrap.offsetWidth; /* reflow to restart animation */
    _stepWrap.classList.add(animClass);

    STEPS[idx].bind && STEPS[idx].bind();
    _bindStep(idx);
  }

  function _updateBreadcrumb(currentIdx) {
    let html = '';
    STEPS.forEach(function (s, i) {
      const isDone   = _s.answers[s.id] !== undefined && i < currentIdx;
      const isActive = i === currentIdx;
      const cls = isDone ? 'tp-dot tp-dot-done' : isActive ? 'tp-dot tp-dot-active' : 'tp-dot';
      if (i > 0) html += '<div class="tp-dot-line"></div>';
      html += '<div class="' + cls + '" data-step="' + i + '" title="' + s.crumb + '">' + (i + 1) + '</div>';
    });
    _breadcrumb.innerHTML = html;

    _breadcrumb.querySelectorAll('.tp-dot-done').forEach(function (el) {
      el.addEventListener('click', function () {
        _goTo(parseInt(el.dataset.step), 'back');
      });
    });
  }

  function _updateProgress(idx) {
    _progressFill.style.width = ((idx / (STEPS.length - 1)) * 100) + '%';
  }

  /* ─────────────────────────────────────────────────────────────
     STEP RENDERS
     ───────────────────────────────────────────────────────────── */

  /* ── Step 0: Vibe ─────────────────────────────────────────── */
  function renderVibe() {
    const sel = _s.answers.vibe || '';
    return _heading('01', STEPS[0].q) +
      '<div class="tp-grid tp-grid-sm" id="tp-vibe-grid">' +
      VIBES.map(function (v) {
        return '<div class="tp-card' + (sel === v.id ? ' tp-sel' : '') + '" data-vibe="' + v.id + '" tabindex="0">' +
          '<img src="' + v.img + '" alt="' + v.label + '" loading="lazy">' +
          '<div class="tp-card-overlay"><div class="tp-card-name">' + v.label + '</div><div class="tp-card-sub">' + v.sub + '</div></div>' +
          '<div class="tp-check">✓</div></div>';
      }).join('') +
      '</div>';
  }

  /* ── Step 1: Destination ──────────────────────────────────── */
  function renderDestination() {
    const vibeId = _s.answers.vibe;
    const sel    = _s.answers.destination || '';

    /* Strict filter — only destinations tagged with the chosen vibe */
    const list = vibeId
      ? DESTINATIONS.filter(function (d) { return d.vibes.includes(vibeId); })
      : DESTINATIONS;

    return _heading('02', STEPS[1].q) +
      '<div class="tp-grid tp-grid-dest" id="tp-dest-grid">' +
      list.map(function (d) {
        const proofHtml = d.proofPop
          ? '<div class="tp-proof tp-proof-pop">★ ' + _fmt(d.proof) + '+ travelers</div>'
          : '<div class="tp-proof">· ' + _fmt(d.proof) + '+ travelers</div>';
        return '<div class="tp-card' + (sel === d.id ? ' tp-sel' : '') + '" data-dest="' + d.id + '" tabindex="0">' +
          '<img src="' + d.img + '" alt="' + d.name + '" loading="lazy">' +
          proofHtml +
          '<div class="tp-card-overlay">' +
            '<div class="tp-card-name">' + d.name + '</div>' +
            '<div class="tp-card-sub">' + d.country + '</div>' +
          '</div>' +
          '<div class="tp-check">✓</div></div>';
      }).join('') +
      '</div>';
  }

  /* ── Step 2: Who's traveling ──────────────────────────────── */
  function renderTravelers() {
    const sel = _s.answers.travelerType || '';
    return _heading('03', STEPS[2].q) +
      '<div class="tp-icon-grid" id="tp-trav-grid">' +
      TRAVELER_TYPES.map(function (t) {
        return '<div class="tp-icon-card' + (sel === t.id ? ' tp-sel' : '') + '" data-trav="' + t.id + '" tabindex="0">' +
          '<div class="tp-icon-glyph">' + t.icon + '</div>' +
          '<div class="tp-icon-label">' + t.label + '</div>' +
          '<div class="tp-icon-sub">' + t.sub + '</div>' +
          '<div class="tp-icon-desc">' + t.desc + '</div>' +
          '</div>';
      }).join('') +
      '</div>';
  }

  /* ── Step 3: Traveler count + rooms ──────────────────────── */
  function renderCount() {
    const adults   = _s.answers.adults   !== undefined ? _s.answers.adults   : 2;
    const children = _s.answers.children !== undefined ? _s.answers.children : 0;
    const rooms    = _s.answers.rooms    !== undefined ? _s.answers.rooms    : 1;
    return _heading('04', STEPS[3].q) +
      '<div class="tp-stepper-grid">' +
      _stepper('tp-adults',   'Adults',   '12 years and above', adults,   1, 20) +
      _stepper('tp-children', 'Children', 'Under 12 years',     children, 0, 20) +
      _stepper('tp-rooms',    'Rooms',    'Hotel rooms needed',  rooms,    1, 10) +
      '</div>';
  }

  /* ── Step 4: Travel month ─────────────────────────────────── */
  function renderMonth() {
    const sel = _s.answers.month !== undefined ? _s.answers.month : -1;
    return _heading('05', STEPS[4].q) +
      '<div class="tp-month-grid" id="tp-month-grid">' +
      MONTHS.map(function (m) {
        return '<div class="tp-month-card' + (sel === m.idx ? ' tp-sel' : '') + '" data-midx="' + m.idx + '" tabindex="0">' +
          '<span class="tp-month-abbr">' + m.abbr + '</span><span class="tp-month-full">' + m.full + '</span></div>';
      }).join('') +
      '</div>';
  }

  /* ── Step 5: Origin city ──────────────────────────────────── */
  function renderOrigin() {
    const sel = _s.answers.originCity || '';
    return _heading('06', STEPS[5].q) +
      '<div class="tp-city-wrap">' +
      '<input class="tp-city-input" id="tp-city-input" type="text" placeholder="Search your city…" value="' + sel + '" autocomplete="off">' +
      '<div class="tp-city-list" id="tp-city-list">' +
      _cityRows(CITIES, sel) +
      '</div></div>';
  }

  function _cityRows(list, sel) {
    return list.map(function (c) {
      return '<div class="tp-city-row' + (sel === c.name ? ' tp-sel' : '') + '" data-city="' + c.name + '" tabindex="0">' +
        '<span>' + c.name + '</span><span class="tp-city-country">' + c.country + '</span></div>';
    }).join('');
  }

  /* ── Step 6: Duration ─────────────────────────────────────── */
  function renderDuration() {
    const sel = _s.answers.duration || '';
    return _heading('07', STEPS[6].q) +
      '<div class="tp-dur-grid" id="tp-dur-grid">' +
      DURATIONS.map(function (d) {
        return '<div class="tp-dur-card' + (sel === d.id ? ' tp-sel' : '') + '" data-dur="' + d.id + '" tabindex="0">' +
          (d.popular ? '<div class="tp-dur-pop">Most popular</div>' : '') +
          '<div class="tp-dur-days">' + d.label + '</div>' +
          '<div class="tp-dur-label">' + d.desc + '</div></div>';
      }).join('') +
      '</div>';
  }

  /* ── Step 7: Budget ───────────────────────────────────────── */
  function renderBudget() {
    const sel = _s.answers.budget || '';
    return _heading('08', STEPS[7].q) +
      '<div class="tp-budget-grid" id="tp-budget-grid">' +
      BUDGETS.map(function (b) {
        return '<div class="tp-budget-card' + (sel === b.id ? ' tp-sel' : '') + '" data-budget="' + b.id + '" tabindex="0">' +
          '<div class="tp-budget-icon">' + b.icon + '</div>' +
          '<div class="tp-budget-name">' + b.name + '</div>' +
          '<div class="tp-budget-desc">' + b.desc + '</div></div>';
      }).join('') +
      '</div>';
  }

  /* ── Step 8: Contact ──────────────────────────────────────── */
  function renderContact() {
    const a = _s.answers;
    return _heading('09', STEPS[8].q) +
      '<div class="tp-contact-form" id="tp-contact-form">' +
      _field('tp-cname',  'text',  'Full Name',     'Your name',          a.name  || '') +
      _field('tp-cphone', 'tel',   'Phone Number',  '+91 98765 43210',    a.phone || '') +
      _field('tp-cemail', 'email', 'Email Address', 'you@example.com',    a.email || '') +
      '<button class="tp-submit" id="tp-submit-btn">Send My Enquiry →</button>' +
      '</div>';
  }

  /* ─────────────────────────────────────────────────────────────
     STEP BIND (events for each step after render)
     ───────────────────────────────────────────────────────────── */
  function _bindStep(idx) {
    switch (idx) {
      case 0: _bindVibe();        break;
      case 1: _bindDestination(); break;
      case 2: _bindTravelers();   break;
      case 3: _bindCount();       break;
      case 4: _bindMonth();       break;
      case 5: _bindOrigin();      break;
      case 6: _bindDuration();    break;
      case 7: _bindBudget();      break;
      case 8: _bindContact();     break;
    }
  }

  function _bindVibe() {
    _stepWrap.querySelectorAll('[data-vibe]').forEach(function (el) {
      el.addEventListener('click', function () {
        const vibeId = el.dataset.vibe;
        const changed = _s.answers.vibe !== vibeId;
        _s.answers.vibe = vibeId;
        if (changed) delete _s.answers.destination; /* reset destination on vibe change */
        _s.warnDismissed = false;
        _setBg(VIBE_BGS[vibeId] || STEP_BGS[0]);
        _stepWrap.querySelectorAll('[data-vibe]').forEach(function (c) { c.classList.toggle('tp-sel', c === el); });
        _sbUpsert(1);
        setTimeout(_advance, 320);
      });
      el.addEventListener('mouseenter', function () { _setBg(VIBE_BGS[el.dataset.vibe] || STEP_BGS[0]); });
      el.addEventListener('mouseleave', function () {
        const cur = _s.answers.vibe;
        _setBg(cur ? VIBE_BGS[cur] : STEP_BGS[0]);
      });
    });
  }

  function _bindDestination() {
    _stepWrap.querySelectorAll('[data-dest]').forEach(function (el) {
      el.addEventListener('click', function () {
        _s.answers.destination = el.dataset.dest;
        _s.warnDismissed = false;
        _stepWrap.querySelectorAll('[data-dest]').forEach(function (c) { c.classList.toggle('tp-sel', c === el); });
        _sbUpsert(2);
        setTimeout(_advance, 320);
      });
    });
  }

  function _bindTravelers() {
    _stepWrap.querySelectorAll('[data-trav]').forEach(function (el) {
      el.addEventListener('click', function () {
        _s.answers.travelerType = el.dataset.trav;
        _stepWrap.querySelectorAll('[data-trav]').forEach(function (c) { c.classList.toggle('tp-sel', c === el); });
        _sbUpsert(3);
        setTimeout(_advance, 320);
      });
    });
  }

  function _bindCount() {
    function _mkStepper(baseId, key, min, max) {
      const minusBtn = document.getElementById(baseId + '-minus');
      const plusBtn  = document.getElementById(baseId + '-plus');
      const valEl    = document.getElementById(baseId + '-val');
      if (!minusBtn) return;

      minusBtn.addEventListener('click', function () {
        const cur = _s.answers[key] !== undefined ? _s.answers[key] : (key === 'adults' ? 2 : key === 'rooms' ? 1 : 0);
        if (cur > min) {
          _s.answers[key] = cur - 1;
          valEl.textContent = _s.answers[key];
          minusBtn.disabled = _s.answers[key] <= min;
          plusBtn.disabled  = false;
        }
      });
      plusBtn.addEventListener('click', function () {
        const cur = _s.answers[key] !== undefined ? _s.answers[key] : (key === 'adults' ? 2 : key === 'rooms' ? 1 : 0);
        if (cur < max) {
          _s.answers[key] = cur + 1;
          valEl.textContent = _s.answers[key];
          plusBtn.disabled  = _s.answers[key] >= max;
          minusBtn.disabled = false;
        }
      });
    }
    _mkStepper('tp-adults',   'adults',   1, 20);
    _mkStepper('tp-children', 'children', 0, 20);
    _mkStepper('tp-rooms',    'rooms',    1, 10);

    /* Auto-advance: no single-click trigger; add a continue button instead */
    const wrap = document.createElement('div');
    wrap.style.cssText = 'margin-top:24px;display:flex;justify-content:flex-end;';
    wrap.innerHTML = '<button class="tp-submit" style="width:auto;padding:13px 32px;" id="tp-count-next">Continue →</button>';
    _stepWrap.appendChild(wrap);
    document.getElementById('tp-count-next').addEventListener('click', function () {
      if (_s.answers.adults === undefined) _s.answers.adults = 2;
      if (_s.answers.rooms  === undefined) _s.answers.rooms  = 1;
      if (_s.answers.children === undefined) _s.answers.children = 0;
      _sbUpsert(4);
      _advance();
    });
  }

  function _bindMonth() {
    _stepWrap.querySelectorAll('[data-midx]').forEach(function (el) {
      el.addEventListener('click', function () {
        const mIdx = parseInt(el.dataset.midx);
        _s.answers.month = mIdx;
        _stepWrap.querySelectorAll('[data-midx]').forEach(function (c) { c.classList.toggle('tp-sel', c === el); });
        _sbUpsert(5);
        _checkSeasonalWarning();
        setTimeout(_advance, 360);
      });
    });
  }

  function _checkSeasonalWarning() {
    if (_s.warnDismissed) return;
    const destId = _s.answers.destination;
    const mIdx   = _s.answers.month;
    if (destId === undefined || mIdx === undefined) return;
    const dest = DESTINATIONS.find(function (d) { return d.id === destId; });
    if (!dest || !dest.alt) return;
    if (!dest.bestMonths.includes(mIdx)) {
      const destName = dest.name;
      const monName  = MONTHS[mIdx].full;
      document.getElementById('tp-warn-text').innerHTML =
        '⚠️  <strong>' + destName + ' in ' + monName + '</strong> hits ' + dest.altReason +
        ' — still beautiful, but <strong>' + dest.alt + '</strong> might suit better this time of year.';
      _warn.classList.add('tp-show');
    }
  }

  function _bindOrigin() {
    const input  = document.getElementById('tp-city-input');
    const list   = document.getElementById('tp-city-list');

    function _filter(q) {
      const lower = q.toLowerCase();
      const filtered = CITIES.filter(function (c) { return c.name.toLowerCase().includes(lower); });
      list.innerHTML = _cityRows(filtered, _s.answers.originCity || '');
      _bindCityRows();
    }

    function _bindCityRows() {
      list.querySelectorAll('[data-city]').forEach(function (el) {
        el.addEventListener('click', function () {
          _s.answers.originCity = el.dataset.city;
          list.querySelectorAll('[data-city]').forEach(function (c) { c.classList.toggle('tp-sel', c === el); });
          _checkSeasonalWarning();
          _sbUpsert(6);
          setTimeout(_advance, 300);
        });
      });
    }

    input.addEventListener('input', function () { _filter(input.value); });
    _bindCityRows();
  }

  function _bindDuration() {
    _stepWrap.querySelectorAll('[data-dur]').forEach(function (el) {
      el.addEventListener('click', function () {
        _s.answers.duration = el.dataset.dur;
        _stepWrap.querySelectorAll('[data-dur]').forEach(function (c) { c.classList.toggle('tp-sel', c === el); });
        _sbUpsert(7);
        setTimeout(_advance, 320);
      });
    });
  }

  function _bindBudget() {
    _stepWrap.querySelectorAll('[data-budget]').forEach(function (el) {
      el.addEventListener('click', function () {
        _s.answers.budget = el.dataset.budget;
        _stepWrap.querySelectorAll('[data-budget]').forEach(function (c) { c.classList.toggle('tp-sel', c === el); });
        _sbUpsert(8);
        setTimeout(_advance, 320);
      });
    });
  }

  function _bindContact() {
    const btn = document.getElementById('tp-submit-btn');
    btn.addEventListener('click', _submitContact);
  }

  function _submitContact() {
    const nameEl  = document.getElementById('tp-cname');
    const phoneEl = document.getElementById('tp-cphone');
    const emailEl = document.getElementById('tp-cemail');

    let ok = true;
    [nameEl, phoneEl, emailEl].forEach(function (el) {
      el.classList.remove('tp-err');
      if (!el.value.trim()) { el.classList.add('tp-err'); ok = false; }
    });
    if (!ok) return;
    if (!/^\S+@\S+\.\S+$/.test(emailEl.value.trim())) {
      emailEl.classList.add('tp-err'); return;
    }

    _s.answers.name  = nameEl.value.trim();
    _s.answers.phone = phoneEl.value.trim();
    _s.answers.email = emailEl.value.trim();

    const btn = document.getElementById('tp-submit-btn');
    btn.disabled = true;
    btn.textContent = 'Submitting…';

    _sbSubmit().then(function () {
      _confirm.classList.add('tp-show');
    }).catch(function () {
      btn.disabled = false;
      btn.textContent = 'Send My Enquiry →';
      alert('Something went wrong. Please try again.');
    });
  }

  /* ─────────────────────────────────────────────────────────────
     SUPABASE  (JS client v2 via CDN)
     ───────────────────────────────────────────────────────────── */
  function _buildPayload(completedStep, status) {
    const a = _s.answers;
    return {
      session_id:    _s.sessionId,
      current_step:  completedStep,
      status:        status,
      vibe:          a.vibe          || null,
      destination:   a.destination   || null,
      traveler_type: a.travelerType  || null,
      adult_count:   a.adults        !== undefined ? a.adults   : null,
      child_count:   a.children      !== undefined ? a.children : null,
      room_count:    a.rooms         !== undefined ? a.rooms    : null,
      travel_month:  a.month         !== undefined ? MONTHS[a.month].full : null,
      origin_city:   a.originCity    || null,
      duration:      a.duration      || null,
      budget_range:  a.budget        || null,
      contact_name:  a.name          || null,
      contact_phone: a.phone         || null,
      contact_email: a.email         || null,
    };
  }

  function _sbUpsert(completedStep) {
    const sb = _getSb();
    if (!sb) return;
    sb.from('trip_leads')
      .upsert(_buildPayload(completedStep, 'in_progress'), { onConflict: 'session_id' })
      .then(function () {})
      .catch(function () {});
  }

  function _sbSubmit() {
    const sb = _getSb();
    if (!sb) return Promise.reject(new Error('Supabase not ready'));
    return sb.from('trip_leads')
      .upsert(_buildPayload(9, 'submitted'), { onConflict: 'session_id' })
      .then(function (res) {
        if (res.error) throw res.error;
      });
  }

  /* ─────────────────────────────────────────────────────────────
     HTML HELPERS
     ───────────────────────────────────────────────────────────── */
  function _heading(num, q) {
    return '<div class="tp-step-eyebrow">Step ' + num + '</div>' +
           '<h2 class="tp-step-q">' + q + '</h2>';
  }

  function _stepper(id, label, desc, val, min, max) {
    return '<div class="tp-stepper-card">' +
      '<div class="tp-stepper-label">' + label + '</div>' +
      '<div class="tp-stepper-desc">' + desc + '</div>' +
      '<div class="tp-stepper-ctrl">' +
        '<button class="tp-spin-btn" id="' + id + '-minus"' + (val <= min ? ' disabled' : '') + '>−</button>' +
        '<span class="tp-spin-val" id="' + id + '-val">' + val + '</span>' +
        '<button class="tp-spin-btn" id="' + id + '-plus"' + (val >= max ? ' disabled' : '') + '>+</button>' +
      '</div></div>';
  }

  function _field(id, type, label, placeholder, val) {
    return '<div><label class="tp-field-label" for="' + id + '">' + label + '</label>' +
      '<input class="tp-input" id="' + id + '" type="' + type + '" placeholder="' + placeholder + '" value="' + _esc(val) + '"></div>';
  }

  function _esc(s) { return String(s).replace(/"/g, '&quot;').replace(/</g, '&lt;'); }
  function _fmt(n) { return n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k' : String(n); }
  function _uuid() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }

  /* ─── Expose ─────────────────────────────────────────────── */
  window.initTripPlanner = initTripPlanner;

})();
