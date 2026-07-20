/* ═══════════════════════════════════════════════════════════
   ALPENGLOW TRIP PLANNER — vanilla JS, no frameworks
   Requires: @supabase/supabase-js v2 loaded via CDN before this file
   Exposes: window.initTripPlanner()
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ─── Supabase JS client (CDN: @supabase/supabase-js v2) ─── */
  // Self-hosted Supabase (see deploy/README.md).
  const SB_URL = 'https://api.alpenglowglobal.com';
  const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzg0NDczMjU5LCJleHAiOjE5NDIxNTMyNTl9.Flq3Vf1QHQA23sieMT472T5tnKkhzhLcJxdxtbjIv-s';

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
    { id:'beach',     label:'Beach',                sub:'Sun, sand & sea',              img: UNS('photo-1507525428034-b723cf961d3e') },
    { id:'mountains', label:'Mountains',             sub:'Peaks & crisp air',            img: UNS('photo-1506905925346-21bda4d32df4') },
    { id:'cultural',  label:'Cultural / Heritage',  sub:'History & traditions',         img: UNS('photo-1524492412937-b28074a5d7da') },
    { id:'adventure', label:'Adventure & Wildlife',  sub:'Thrills, nature & the wild',  img: UNS('photo-1551632811-561732d1e306') },
    { id:'honeymoon', label:'Honeymoon / Romantic',  sub:'Just the two of you',         img: UNS('photo-1519307212971-dd9561667ffb') },
  ];

  /* Vibe backgrounds — full-screen hero on hover / select */
  const VIBE_BGS = {
    beach:     UNS('photo-1507525428034-b723cf961d3e', 1920),
    mountains: UNS('photo-1506905925346-21bda4d32df4', 1920),
    cultural:  UNS('photo-1524492412937-b28074a5d7da', 1920),
    adventure: UNS('photo-1551632811-561732d1e306',    1920),
    honeymoon: UNS('photo-1519307212971-dd9561667ffb', 1920),
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
      vibes:['beach','cultural','adventure'],
      bestMonths:[10,11,0,1,2,3],
      proof:634, proofPop:false,
      alt:'Thailand',
      altReason:'southwest monsoon (May–Sep)'
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
      vibes:['mountains','adventure'],
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
      id:'norway', name:'Norwegian Fjords', country:'Norway · Iceland · Finland',
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
      vibes:['mountains','adventure'],
      bestMonths:[11,0,1,2],
      proof:718, proofPop:false,
      alt:'Australia',
      altReason:'winter (Jun–Aug — cold in the South Island)'
    },
    {
      id:'australia', name:'Australia', country:'Pacific',
      img: BASE + 'australia.jpg',
      vibes:['adventure'],
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
      vibes:['cultural','adventure'],
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
  /* Feather Icons — all verified 24×24 stroke paths */
  const _S = 'xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';
  const _svg = {
    /* traveler types */
    heart:  '<svg ' + _S + '><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
    home:   '<svg ' + _S + '><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
    users:  '<svg ' + _S + '><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    user:   '<svg ' + _S + '><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    sun:    '<svg ' + _S + '><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>',
    /* budget tiers */
    card:   '<svg ' + _S + '><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>',
    send:   '<svg ' + _S + '><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>',
    star:   '<svg ' + _S + '><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
    award:  '<svg ' + _S + '><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>',
  };

  const TRAVELER_TYPES = [
    { id:'couple',  label:'Couple',          sub:'Two of you',            icon:_svg.heart, desc:'Romantic getaways & honeymoon packages' },
    { id:'family',  label:'Family',          sub:'Kids & grown-ups',      icon:_svg.home,  desc:'Kid-friendly stays & activities included' },
    { id:'friends', label:'Friends',         sub:'Squad goals',           icon:_svg.users, desc:'Group bookings & shared experiences' },
    { id:'solo',    label:'Solo',            sub:'Just me',               icon:_svg.user,  desc:'Safe, curated experiences for one' },
    { id:'senior',  label:'Senior Citizen',  sub:'Comfort & ease first',  icon:_svg.sun,   desc:'Slower pace, comfortable transfers' },
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
    { id:'budget',    icon:_svg.card,  name:'Budget',    desc:'Value picks, local stays, street food & smart choices.' },
    { id:'midrange',  icon:_svg.send,  name:'Mid-range', desc:'Comfortable hotels, curated tours, a few splurges.' },
    { id:'premium',   icon:_svg.star,  name:'Premium',   desc:'4-star resorts, business class, private transfers.' },
    { id:'luxury',    icon:_svg.award, name:'Luxury',    desc:'Over-water villas, butler service, bespoke itineraries.' },
  ];

  /* Step backgrounds (full-screen behind each question) */
  const STEP_BGS = [
    UNS('photo-1476514525535-07fb3b4ae5f1', 1920), /* 0 – vibe          */
    UNS('photo-1476514525535-07fb3b4ae5f1', 1920), /* 1 – destination   */
    UNS('photo-1529156069898-49953e39b3ac', 1920), /* 2 – travelers     */
    UNS('photo-1566438480900-0609be27a4be', 1920), /* 3 – count/rooms   */
    UNS('photo-1436491865332-7a61a109cc05', 1920), /* 4 – month         */
    UNS('photo-1500835556837-99ac94a94552', 1920), /* 5 – origin city   */
    UNS('photo-1503220317375-aaad61436b1b', 1920), /* 6 – duration      */
    UNS('photo-1566073771259-6a8506099945', 1920), /* 7 – budget        */
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
  <div id="tp-glow"></div>

  <div id="tp-progress"><div id="tp-progress-fill"></div></div>
  <button id="tp-close" aria-label="Close trip planner" onclick="window.__tpClose&&window.__tpClose()">✕</button>

  <header id="tp-header">
    <nav id="tp-breadcrumb"></nav>
  </header>

  <main id="tp-main">
    <div id="tp-step-wrap"></div>
  </main>

  <div id="tp-confirm">
    <div class="tp-confirm-circle">&#10003;</div>
    <div class="tp-confirm-title">You&#8217;re all set!</div>
    <div class="tp-confirm-sub">Our travel expert will reach out within 24 hours with a personalised itinerary just for you.</div>
    <div class="tp-confirm-divider"></div>
    <div class="tp-confirm-summary" id="tp-confirm-summary"></div>
    <button class="tp-confirm-close">CLOSE</button>
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
    _warn         = null; /* seasonal warning removed */
    _confirm      = document.getElementById('tp-confirm');
  }

  /* ─────────────────────────────────────────────────────────────
     GLOBAL EVENT BINDINGS
     ───────────────────────────────────────────────────────────── */
  function _bindGlobal() {
    var closeBtn = document.getElementById('tp-close');
    if (closeBtn) { closeBtn.onclick = function() { _close(); }; }
    _btnBack.onclick = _goBack;
    _confirm.querySelector('.tp-confirm-close').onclick = _close;
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && _root && _root.classList.contains('tp-open')) _close();
    });
    _bindMouseGlow();
  }

  /* ─────────────────────────────────────────────────────────────
     MOUSE-FOLLOWING AMBIENT GLOW
     ───────────────────────────────────────────────────────────── */
  function _bindMouseGlow() {
    var glow = document.getElementById('tp-glow');
    if (!glow || !_root) return;
    _root.addEventListener('mousemove', function (e) {
      var rect = _root.getBoundingClientRect();
      _root.style.setProperty('--gx', (e.clientX - rect.left) + 'px');
      _root.style.setProperty('--gy', (e.clientY - rect.top) + 'px');
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
    if (!_root) return;
    _root.classList.remove('tp-open');
    setTimeout(function () {
      document.body.style.overflow = '';
      if (_confirm) _confirm.classList.remove('tp-show');
    }, 500);
  }

  /* Expose globally so inline onclick in HTML always works */
  window.__tpClose = function () { _close(); };

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
    if (_s.step > 0) {
      var prev = _s.step - 1;
      /* Solo traveler: skip back over the count step */
      if (prev === 3 && _s.answers.travelerType === 'solo') prev = 2;
      _goTo(prev, 'back');
    }
  }

  function _advance() {
    if (_s.step < STEPS.length - 1) {
      var next = _s.step + 1;
      /* Solo traveler: counts already set to 1 adult — skip the count step */
      if (next === 3 && _s.answers.travelerType === 'solo') next = 4;
      _goTo(next, 'fwd');
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
    if (_warn) _warn.classList.remove('tp-show');

    const animClass = dir === 'back' ? 'tp-anim-in-back' : 'tp-anim-in-fwd';
    const html = STEPS[idx].render();
    _stepWrap.innerHTML = html;
    _stepWrap.classList.remove('tp-anim-in-fwd', 'tp-anim-in-back');
    void _stepWrap.offsetWidth; /* reflow to restart animation */
    _stepWrap.classList.add(animClass);

    STEPS[idx].bind && STEPS[idx].bind();
    _bindStep(idx);
    _bindNextBtn();
  }

  /* Maps step.id → the answers key that indicates the step is complete */
  var _stepDoneKey = {
    vibe:'vibe', destination:'destination', travelers:'travelerType',
    count:'adults', month:'month', origin:'originCity',
    duration:'duration', budget:'budget', contact:'name'
  };

  function _updateBreadcrumb(currentIdx) {
    let html = '';
    STEPS.forEach(function (s, i) {
      var key = _stepDoneKey[s.id] || s.id;
      const isDone   = _s.answers[key] !== undefined && i < currentIdx;
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

  /* ── Next Step button helpers ─────────────────────────────── */
  function _nextBtnHtml() {
    return '<div class="tp-next-wrap"><button class="tp-next-btn" id="tp-next" disabled>Next Step &rarr;</button></div>';
  }
  function _bindNextBtn() {
    var btn = document.getElementById('tp-next');
    if (btn) btn.onclick = _advance;
  }
  function _enableNextBtn() {
    var btn = document.getElementById('tp-next');
    if (btn) { btn.disabled = false; }
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
      '</div>' +
      _nextBtnHtml();
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
      '</div>' +
      _nextBtnHtml();
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
      '</div>' +
      _nextBtnHtml();
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
      '</div>' +
      _nextBtnHtml();
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
      '</div>' +
      _nextBtnHtml();
  }

  /* ── Step 5: Origin city ──────────────────────────────────── */
  function renderOrigin() {
    const sel = _s.answers.originCity || '';
    return _heading('06', STEPS[5].q) +
      '<div class="tp-city-wrap">' +
      '<input class="tp-city-input" id="tp-city-input" type="text" placeholder="Search your city…" value="' + sel + '" autocomplete="off">' +
      '<div class="tp-city-list" id="tp-city-list">' +
      _cityRows(CITIES, sel) +
      '</div></div>' +
      _nextBtnHtml();
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
          '<div class="tp-dur-days">' + d.label + '</div>' +
          '<div class="tp-dur-label">' + d.desc + '</div>' +
          (d.popular ? '<div class="tp-dur-pop">Most popular</div>' : '') +
          '</div>';
      }).join('') +
      '</div>' +
      _nextBtnHtml();
  }

  /* ── Step 7: Budget ───────────────────────────────────────── */
  function renderBudget() {
    const sel = _s.answers.budget || '';
    const exactVal = _s.answers.exactBudget || '';
    return _heading('08', STEPS[7].q) +
      '<div class="tp-budget-grid" id="tp-budget-grid">' +
      BUDGETS.map(function (b) {
        return '<div class="tp-budget-card' + (sel === b.id ? ' tp-sel' : '') + '" data-budget="' + b.id + '" tabindex="0">' +
          '<div class="tp-budget-icon">' + b.icon + '</div>' +
          '<div class="tp-budget-name">' + b.name + '</div>' +
          '<div class="tp-budget-desc">' + b.desc + '</div></div>';
      }).join('') +
      '</div>' +
      '<div class="tp-exact-budget-wrap">' +
        '<label class="tp-exact-budget-label">Expected budget (₹) <span style="opacity:.5;font-size:.8em">— optional</span></label>' +
        '<div class="tp-exact-budget-row">' +
          '<span class="tp-exact-budget-prefix">₹</span>' +
          '<input class="tp-input tp-exact-budget-input" id="tp-exact-budget" type="number" min="0" placeholder="e.g. 150000"' +
          (exactVal ? ' value="' + exactVal + '"' : '') + '>' +
        '</div>' +
      '</div>' +
      _nextBtnHtml();
  }

  /* ── Step 8: Contact ──────────────────────────────────────── */
  var _TP_CC_OPTS = [
    {v:'+91',l:'🇮🇳 +91'},{v:'+1',l:'🇺🇸 +1'},{v:'+44',l:'🇬🇧 +44'},
    {v:'+61',l:'🇦🇺 +61'},{v:'+65',l:'🇸🇬 +65'},{v:'+971',l:'🇦🇪 +971'},
    {v:'+60',l:'🇲🇾 +60'},{v:'+64',l:'🇳🇿 +64'},{v:'+49',l:'🇩🇪 +49'},{v:'+33',l:'🇫🇷 +33'}
  ];
  function _ccOptions(sel) {
    return _TP_CC_OPTS.map(function(c){
      return '<option value="'+c.v+'"'+(c.v===(sel||'+91')?' selected':'')+'>'+c.l+'</option>';
    }).join('');
  }

  function renderContact() {
    var a = _s.answers;
    var ccSel = a.phoneCC || '+91';
    return _heading('09', STEPS[8].q) +
      '<div class="tp-contact-form" id="tp-contact-form">' +

      /* ── Name ── */
      _field('tp-cname', 'text', 'Full Name', 'Your name', a.name || '') +

      /* ── Phone + inline OTP ── */
      '<div class="tp-field-wrap">' +
        '<div class="tp-verify-row">' +
          '<select class="tp-cc-select" id="tp-cphone-cc">'+_ccOptions(ccSel)+'</select>' +
          '<div class="tp-input-slot">' +
            '<input class="tp-input" id="tp-cphone" type="tel" placeholder=" " maxlength="10"' +
            ' value="'+_esc(a.phone||'')+'" oninput="this.value=this.value.replace(/\\D/g,\'\')" inputmode="numeric">' +
            '<label class="tp-field-label tp-field-float" for="tp-cphone">Phone (10 digits)</label>' +
          '</div>' +
          '<button class="tp-send-otp-btn" id="tp-phone-send-btn">Send OTP</button>' +
        '</div>' +
        '<div class="tp-otp-inline" id="tp-phone-otp-block">' +
          '<p class="tp-verify-note" id="tp-potp-note" style="margin-top:10px;">Enter the code sent to your WhatsApp.</p>' +
          '<div class="tp-otp-row">' +
            '<input type="tel" maxlength="1" class="tp-otp-digit" id="tp-otp-0">' +
            '<input type="tel" maxlength="1" class="tp-otp-digit" id="tp-otp-1">' +
            '<input type="tel" maxlength="1" class="tp-otp-digit" id="tp-otp-2">' +
            '<input type="tel" maxlength="1" class="tp-otp-digit" id="tp-otp-3">' +
          '</div>' +
          '<div class="tp-resend-line">Didn\'t get it? <span class="tp-resend-link" id="tp-potp-resend">Resend</span></div>' +
          '<button class="tp-submit" id="tp-phone-confirm-btn" style="width:100%;margin-bottom:12px;">Confirm Phone &rarr;</button>' +
        '</div>' +
      '</div>' +

      /* ── Email + inline OTP ── */
      '<div class="tp-field-wrap">' +
        '<div class="tp-verify-row">' +
          '<div class="tp-input-slot">' +
            '<input class="tp-input" id="tp-cemail" type="email" placeholder=" " value="'+_esc(a.email||'')+'">' +
            '<label class="tp-field-label tp-field-float" for="tp-cemail">Email Address</label>' +
          '</div>' +
          '<button class="tp-send-otp-btn" id="tp-email-send-btn">Send OTP</button>' +
        '</div>' +
        '<div class="tp-otp-inline" id="tp-email-otp-block">' +
          '<p class="tp-verify-note" id="tp-eotp-note" style="margin-top:10px;">Enter the code sent to your email.</p>' +
          '<div class="tp-otp-row">' +
            '<input type="tel" maxlength="1" class="tp-otp-digit" id="tp-eotp-0">' +
            '<input type="tel" maxlength="1" class="tp-otp-digit" id="tp-eotp-1">' +
            '<input type="tel" maxlength="1" class="tp-otp-digit" id="tp-eotp-2">' +
            '<input type="tel" maxlength="1" class="tp-otp-digit" id="tp-eotp-3">' +
          '</div>' +
          '<div class="tp-resend-line">Didn\'t get it? <span class="tp-resend-link" id="tp-eotp-resend">Resend</span></div>' +
          '<button class="tp-submit" id="tp-email-confirm-btn" style="width:100%;margin-bottom:12px;">Confirm Email &rarr;</button>' +
        '</div>' +
      '</div>' +

      '<button class="tp-submit" id="tp-final-submit-btn" style="display:none;width:100%;">Submit Enquiry &rarr;</button>' +
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
        if (changed) delete _s.answers.destination;
        _s.warnDismissed = false;
        _setBg(VIBE_BGS[vibeId] || STEP_BGS[0]);
        _stepWrap.querySelectorAll('[data-vibe]').forEach(function (c) { c.classList.toggle('tp-sel', c === el); });
        _sbUpsert(1);
        _enableNextBtn();
      });
      el.addEventListener('mouseenter', function () { _setBg(VIBE_BGS[el.dataset.vibe] || STEP_BGS[0]); });
      el.addEventListener('mouseleave', function () {
        const cur = _s.answers.vibe;
        _setBg(cur ? VIBE_BGS[cur] : STEP_BGS[0]);
      });
    });
    /* re-enable if vibe already chosen (returning to this step) */
    if (_s.answers.vibe) _enableNextBtn();
  }

  function _bindDestination() {
    _stepWrap.querySelectorAll('[data-dest]').forEach(function (el) {
      el.addEventListener('click', function () {
        _s.answers.destination = el.dataset.dest;
        _s.warnDismissed = false;
        _stepWrap.querySelectorAll('[data-dest]').forEach(function (c) { c.classList.toggle('tp-sel', c === el); });
        _sbUpsert(2);
        _enableNextBtn();
      });
    });
    if (_s.answers.destination) _enableNextBtn();
  }

  function _bindTravelers() {
    _stepWrap.querySelectorAll('[data-trav]').forEach(function (el) {
      el.addEventListener('click', function () {
        _s.answers.travelerType = el.dataset.trav;
        if (_s.answers.travelerType === 'solo') {
          _s.answers.adults   = 1;
          _s.answers.children = 0;
          _s.answers.rooms    = 1;
        }
        _stepWrap.querySelectorAll('[data-trav]').forEach(function (c) { c.classList.toggle('tp-sel', c === el); });
        _sbUpsert(3);
        _enableNextBtn();
      });
    });
    if (_s.answers.travelerType) _enableNextBtn();
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
    /* Set defaults before enabling */
    if (_s.answers.adults   === undefined) _s.answers.adults   = 2;
    if (_s.answers.children === undefined) _s.answers.children = 0;
    if (_s.answers.rooms    === undefined) _s.answers.rooms    = 1;

    _mkStepper('tp-adults',   'adults',   1, 20);
    _mkStepper('tp-children', 'children', 0, 20);
    _mkStepper('tp-rooms',    'rooms',    1, 10);

    _sbUpsert(4);
    _enableNextBtn();
  }

  function _bindMonth() {
    _stepWrap.querySelectorAll('[data-midx]').forEach(function (el) {
      el.addEventListener('click', function () {
        const mIdx = parseInt(el.dataset.midx);
        _s.answers.month = mIdx;
        _stepWrap.querySelectorAll('[data-midx]').forEach(function (c) { c.classList.toggle('tp-sel', c === el); });
        _sbUpsert(5);
        _enableNextBtn();
      });
    });
    if (_s.answers.month !== undefined) _enableNextBtn();
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
          _sbUpsert(6);
          _enableNextBtn();
        });
      });
    }

    input.addEventListener('input', function () { _filter(input.value); });
    _bindCityRows();
    if (_s.answers.originCity) _enableNextBtn();
  }

  function _bindDuration() {
    _stepWrap.querySelectorAll('[data-dur]').forEach(function (el) {
      el.addEventListener('click', function () {
        _s.answers.duration = el.dataset.dur;
        _stepWrap.querySelectorAll('[data-dur]').forEach(function (c) { c.classList.toggle('tp-sel', c === el); });
        _sbUpsert(7);
        _enableNextBtn();
      });
    });
    if (_s.answers.duration) _enableNextBtn();
  }

  function _bindBudget() {
    _stepWrap.querySelectorAll('[data-budget]').forEach(function (el) {
      el.addEventListener('click', function () {
        _s.answers.budget = el.dataset.budget;
        _stepWrap.querySelectorAll('[data-budget]').forEach(function (c) { c.classList.toggle('tp-sel', c === el); });
        _sbUpsert(8);
        _enableNextBtn();
      });
    });
    var exactInput = document.getElementById('tp-exact-budget');
    if (exactInput) {
      exactInput.addEventListener('input', function () {
        _s.answers.exactBudget = this.value ? parseInt(this.value, 10) : null;
      });
    }
    if (_s.answers.budget) _enableNextBtn();
  }

  function _bindContact() {
    function _bindOtpGroup(prefix, count) {
      for (var i = 0; i < count; i++) {
        (function(idx) {
          var el = document.getElementById(prefix + idx);
          if (!el) return;
          el.addEventListener('input', function() {
            this.value = this.value.replace(/\D/g,'').slice(0,1);
            if (this.value && idx < count - 1) document.getElementById(prefix+(idx+1)).focus();
          });
          el.addEventListener('keydown', function(e) {
            if (e.key === 'Backspace' && !this.value && idx > 0) document.getElementById(prefix+(idx-1)).focus();
          });
        })(i);
      }
    }
    _bindOtpGroup('tp-otp-', 4);
    _bindOtpGroup('tp-eotp-', 4);

    document.getElementById('tp-phone-send-btn').addEventListener('click', _tpSendPhoneOTP);
    document.getElementById('tp-phone-confirm-btn').addEventListener('click', _tpConfirmPhoneOTP);
    document.getElementById('tp-email-send-btn').addEventListener('click', _tpSendEmailOTP);
    document.getElementById('tp-email-confirm-btn').addEventListener('click', _tpConfirmEmailOTP);
    document.getElementById('tp-final-submit-btn').addEventListener('click', _tpFinalSubmit);
    document.getElementById('tp-potp-resend').addEventListener('click', function() {
      AlpenAPI.sendSMSOTP(_s.answers.fullPhone, 'trip_planner').catch(function(){});
    });
    document.getElementById('tp-eotp-resend').addEventListener('click', function() {
      AlpenAPI.sendEmailOTP(_s.answers.email, 'trip_planner').catch(function(){});
    });
  }

  function _tpSendPhoneOTP() {
    var nameEl  = document.getElementById('tp-cname');
    var phoneEl = document.getElementById('tp-cphone');
    var ccEl    = document.getElementById('tp-cphone-cc');
    nameEl.classList.remove('tp-err');
    phoneEl.classList.remove('tp-err');
    if (!nameEl.value.trim()) { nameEl.classList.add('tp-err'); nameEl.focus(); return; }
    if (phoneEl.value.replace(/\D/g,'').length !== 10) { phoneEl.classList.add('tp-err'); phoneEl.focus(); return; }

    _s.answers.name      = nameEl.value.trim();
    _s.answers.phone     = phoneEl.value.trim();
    _s.answers.phoneCC   = ccEl.value;
    _s.answers.fullPhone = ccEl.value + phoneEl.value.trim();

    // DEV MODE, or already verified within the planner's own 10-min
    // session (separate from the rest of the site) — skip OTP entirely.
    var _devSkip    = window.AlpenAPI && window.AlpenAPI.isDevMode && window.AlpenAPI.isDevMode();
    var _plannerSkip = !_devSkip && window.AlpenAPI && window.AlpenAPI.isVerified && window.AlpenAPI.isVerified('planner');
    if (_devSkip || _plannerSkip) {
      _s.answers.phoneVerified = true;
      var sendBtn = document.getElementById('tp-phone-send-btn');
      sendBtn.textContent = _devSkip ? '✓ Verified (dev)' : '✓ Verified'; sendBtn.disabled = true;
      sendBtn.classList.remove('tp-otp-sent'); sendBtn.classList.add('tp-otp-ok');
      document.getElementById('tp-cphone').readOnly = true;
      document.getElementById('tp-cphone-cc').disabled = true;
      _tpCheckBothVerified();
      return;
    }

    var btn = document.getElementById('tp-phone-send-btn');
    btn.textContent = '...'; btn.disabled = true;

    AlpenAPI.sendSMSOTP(_s.answers.fullPhone, 'trip_planner').then(function() {
      document.getElementById('tp-potp-note').textContent = 'Code sent to ' + _s.answers.fullPhone;
      document.getElementById('tp-phone-otp-block').classList.add('tp-open');
      btn.textContent = 'Resend'; btn.disabled = false;
      btn.classList.add('tp-otp-sent');
      setTimeout(function() { document.getElementById('tp-otp-0').focus(); }, 420);
    }).catch(function(e) {
      btn.textContent = 'Send OTP'; btn.disabled = false;
      alert((e && e.message) || 'Could not send code. Please check your number.');
    });
  }

  function _tpConfirmPhoneOTP() {
    var code = ['tp-otp-0','tp-otp-1','tp-otp-2','tp-otp-3']
      .map(function(id){ return document.getElementById(id).value; }).join('');
    if (code.length < 4) { document.getElementById('tp-otp-0').focus(); return; }

    var btn = document.getElementById('tp-phone-confirm-btn');
    btn.disabled = true; btn.textContent = 'Verifying…';

    AlpenAPI.verifySMSOTP(_s.answers.fullPhone, code).then(function() {
      _s.answers.phoneVerified = true;
      document.getElementById('tp-phone-otp-block').classList.remove('tp-open');
      var sendBtn = document.getElementById('tp-phone-send-btn');
      sendBtn.textContent = '✓ Verified'; sendBtn.disabled = true;
      sendBtn.classList.remove('tp-otp-sent'); sendBtn.classList.add('tp-otp-ok');
      document.getElementById('tp-cphone').readOnly = true;
      document.getElementById('tp-cphone-cc').disabled = true;
      _tpCheckBothVerified();
    }).catch(function(e) {
      btn.disabled = false; btn.textContent = 'Confirm Phone →';
      alert((e && e.message) || 'Invalid code. Please try again.');
    });
  }

  function _tpSendEmailOTP() {
    var emailEl = document.getElementById('tp-cemail');
    emailEl.classList.remove('tp-err');
    if (!/^\S+@\S+\.\S+$/.test(emailEl.value.trim())) { emailEl.classList.add('tp-err'); emailEl.focus(); return; }

    _s.answers.email = emailEl.value.trim();

    // DEV MODE, or already verified within the planner's own 10-min
    // session (separate from the rest of the site) — skip OTP entirely.
    var _devSkipE    = window.AlpenAPI && window.AlpenAPI.isDevMode && window.AlpenAPI.isDevMode();
    var _plannerSkipE = !_devSkipE && window.AlpenAPI && window.AlpenAPI.isVerified && window.AlpenAPI.isVerified('planner');
    if (_devSkipE || _plannerSkipE) {
      _s.answers.emailVerified = true;
      var sendBtn = document.getElementById('tp-email-send-btn');
      sendBtn.textContent = _devSkipE ? '✓ Verified (dev)' : '✓ Verified'; sendBtn.disabled = true;
      sendBtn.classList.remove('tp-otp-sent'); sendBtn.classList.add('tp-otp-ok');
      document.getElementById('tp-cemail').readOnly = true;
      _tpCheckBothVerified();
      return;
    }

    var btn = document.getElementById('tp-email-send-btn');
    btn.textContent = '...'; btn.disabled = true;

    AlpenAPI.sendEmailOTP(_s.answers.email, 'trip_planner').then(function() {
      document.getElementById('tp-eotp-note').textContent = 'Code sent to ' + _s.answers.email;
      document.getElementById('tp-email-otp-block').classList.add('tp-open');
      btn.textContent = 'Resend'; btn.disabled = false;
      btn.classList.add('tp-otp-sent');
      setTimeout(function() { document.getElementById('tp-eotp-0').focus(); }, 420);
    }).catch(function(e) {
      btn.textContent = 'Send OTP'; btn.disabled = false;
      alert((e && e.message) || 'Could not send code. Please check your email.');
    });
  }

  function _tpConfirmEmailOTP() {
    var code = ['tp-eotp-0','tp-eotp-1','tp-eotp-2','tp-eotp-3']
      .map(function(id){ return document.getElementById(id).value; }).join('');
    if (code.length < 4) { document.getElementById('tp-eotp-0').focus(); return; }

    var btn = document.getElementById('tp-email-confirm-btn');
    btn.disabled = true; btn.textContent = 'Verifying…';

    AlpenAPI.verifyEmailOTP(_s.answers.email, code, 'planner').then(function() {
      _s.answers.emailVerified = true;
      document.getElementById('tp-email-otp-block').classList.remove('tp-open');
      var sendBtn = document.getElementById('tp-email-send-btn');
      sendBtn.textContent = '✓ Verified'; sendBtn.disabled = true;
      sendBtn.classList.remove('tp-otp-sent'); sendBtn.classList.add('tp-otp-ok');
      document.getElementById('tp-cemail').readOnly = true;
      _tpCheckBothVerified();
    }).catch(function(e) {
      btn.disabled = false; btn.textContent = 'Confirm Email →';
      alert((e && e.message) || 'Invalid code. Please try again.');
    });
  }

  function _tpCheckBothVerified() {
    if (_s.answers.phoneVerified && _s.answers.emailVerified) {
      // Starts/refreshes the planner-scope 10-min window — separate from
      // the rest of the site and shared only with the COMPASS chatbot.
      if (window.AlpenAPI && window.AlpenAPI.markVerified) window.AlpenAPI.markVerified('planner');

      // Share the verified contact + trip context with COMPASS, so it never
      // has to ask for name/phone/email again and can reference what the
      // visitor already told the planner. Values are pre-formatted for
      // display here (Title Case, "N – M Days") so every place that reads
      // this profile shows it consistently, matching the planner's own
      // confirmation screen.
      var a = _s.answers;
      var _cap = function (s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; };
      var _durLabel = (function () {
        var d = DURATIONS.filter(function (x) { return x.id === a.duration; })[0];
        return d ? d.label : (a.duration || '');
      })();
      try {
        sessionStorage.setItem('ag_planner_profile', JSON.stringify({
          name:         a.name || '',
          phone:        a.fullPhone || '',
          email:        a.email || '',
          destination:  _cap(a.destination),
          travelerType: _cap(a.travelerType),
          duration:     _durLabel,
          budget:       _cap(a.budget),
          month:        (a.month !== undefined && MONTHS[a.month]) ? MONTHS[a.month].full : '',
        }));
      } catch (e) {}

      var submitBtn = document.getElementById('tp-final-submit-btn');
      submitBtn.style.display = 'block';
      setTimeout(function() { submitBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, 100);
    }
  }

  function _tpFinalSubmit() {
    var btn = document.getElementById('tp-final-submit-btn');
    btn.disabled = true; btn.textContent = 'Submitting…';
    _sbSubmit().then(function() {
      _confirm.classList.add('tp-show');
      var a = _s.answers;
      var bits = [
        a.destination  && a.destination.charAt(0).toUpperCase()  + a.destination.slice(1),
        a.travelerType && a.travelerType.charAt(0).toUpperCase() + a.travelerType.slice(1),
        a.month !== undefined && MONTHS[a.month].full,
        a.duration && a.duration + ' days',
        a.budget   && a.budget.charAt(0).toUpperCase() + a.budget.slice(1),
      ].filter(Boolean);
      var el = document.getElementById('tp-confirm-summary');
      if (el) el.innerHTML = bits.map(function(b){ return '<span class="tp-sum-pill">'+b+'</span>'; }).join('');

      // If the visitor arrived here via COMPASS's "verify first" redirect,
      // send them back to COMPASS now that verification + trip data are done.
      if (sessionStorage.getItem('ag_return_to_compass') === '1') {
        sessionStorage.removeItem('ag_return_to_compass');
        setTimeout(function() { window.location.href = 'compass.html'; }, 1600);
      }
    }).catch(function(e) {
      btn.disabled = false; btn.textContent = 'Submit Enquiry →';
      alert((e && e.message) || 'Something went wrong. Please try again.');
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
      exact_budget:  a.exactBudget   || null,
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
    if (!sb) return Promise.resolve(); /* no CDN (file://) — skip silently */
    return sb.from('trip_leads')
      .upsert(_buildPayload(9, 'submitted'), { onConflict: 'session_id' })
      .then(function (res) {
        if (res.error) throw res.error;
        return _insertLeadRecord();
      });
  }

  function _insertLeadRecord() {
    const sb = _getSb();
    if (!sb) return Promise.resolve();
    const a = _s.answers;

    const parts = [];
    if (a.vibe)         parts.push('Vibe: ' + a.vibe.charAt(0).toUpperCase() + a.vibe.slice(1));
    if (a.destination)  parts.push('Destination: ' + a.destination.charAt(0).toUpperCase() + a.destination.slice(1));
    if (a.travelerType) parts.push('Type: ' + a.travelerType);
    const adultStr = a.adults  !== undefined ? a.adults  + ' Adult'  + (a.adults  !== 1 ? 's' : '') : '';
    const childStr = a.children !== undefined && a.children > 0 ? a.children + ' Child' + (a.children !== 1 ? 'ren' : '') : '';
    const roomStr  = a.rooms   !== undefined ? a.rooms   + ' Room'   + (a.rooms   !== 1 ? 's' : '') : '';
    const travelers = [adultStr, childStr, roomStr].filter(Boolean).join(', ');
    if (travelers)      parts.push('Travelers: ' + travelers);
    if (a.month !== undefined) parts.push('Month: ' + MONTHS[a.month].full);
    if (a.originCity)   parts.push('From: ' + a.originCity);
    if (a.duration)     parts.push('Duration: ' + a.duration);
    if (a.budget)       parts.push('Budget: ' + a.budget.charAt(0).toUpperCase() + a.budget.slice(1));
    if (a.exactBudget)  parts.push('Expected Price: ₹' + Number(a.exactBudget).toLocaleString('en-IN'));

    // Goes through the submit-lead Edge Function (service-role) — the
    // `leads` table is not writable with the anon key (see migration 007),
    // so a direct sb.from('leads').insert() here would silently fail.
    return fetch(SB_URL + '/functions/v1/submit-lead', {
      method: 'POST',
      headers: { 'apikey': SB_KEY, 'Authorization': 'Bearer ' + SB_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name:         a.name         || null,
        phone:        a.phone        || null,
        email:        a.email        || null,
        source:       'trip_planner',
        packageName:  a.destination  ? a.destination.charAt(0).toUpperCase() + a.destination.slice(1) : null,
        message:      parts.join(' | ') || null,
      }),
    })
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, data: d }; }); })
      .then(function (res) {
        if (!res.ok) console.warn('[TripPlanner] leads sync error:', res.data && res.data.error);
      })
      .catch(function (e) { console.warn('[TripPlanner] leads sync error:', e); });
  }

  /* ─────────────────────────────────────────────────────────────
     HTML HELPERS
     ───────────────────────────────────────────────────────────── */
  function _heading(num, q) {
    return '<div class="tp-step-eyebrow">Step ' + num + ' of ' + STEPS.length + '</div>' +
           '<h2 class="tp-step-q">' + q + '</h2>' +
           '<div class="tp-q-rule"></div>';
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
    return '<div class="tp-field-wrap">' +
      '<input class="tp-input" id="' + id + '" type="' + type + '" placeholder=" " value="' + _esc(val) + '">' +
      '<label class="tp-field-label tp-field-float" for="' + id + '">' + label + '</label>' +
      '</div>';
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
