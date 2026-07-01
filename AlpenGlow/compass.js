;(function () {
  'use strict'

  // Only show the COMPASS button if the user is verified
  if (!sessionStorage.getItem('ag_verified')) return

  function _buildButton() {
    // Inject CSS for the floating button
    var style = document.createElement('style')
    style.textContent =
      '#compass-btn{' +
        'position:fixed;bottom:28px;right:28px;z-index:9000;' +
        'width:58px;height:58px;border-radius:50%;' +
        'background:#ef7e19;' +
        'box-shadow:0 4px 20px rgba(239,126,25,.45),0 2px 8px rgba(0,0,0,.3);' +
        'border:none;cursor:pointer;' +
        'display:flex;align-items:center;justify-content:center;' +
        'transition:transform .25s cubic-bezier(.34,1.56,.64,1),box-shadow .25s;' +
        'text-decoration:none;' +
      '}' +
      '#compass-btn:hover{' +
        'transform:scale(1.1);' +
        'box-shadow:0 6px 28px rgba(239,126,25,.6),0 2px 10px rgba(0,0,0,.35);' +
      '}' +
      '#compass-btn svg{width:26px;height:26px;color:#181818;flex-shrink:0}' +
      '#compass-tooltip{' +
        'position:fixed;bottom:96px;right:28px;z-index:9000;' +
        'background:#191512;color:rgba(255,255,255,.88);' +
        'font-family:"DM Sans",system-ui,sans-serif;' +
        'font-size:.75rem;font-weight:500;letter-spacing:.03em;' +
        'padding:7px 13px;border-radius:20px;white-space:nowrap;' +
        'border:1px solid rgba(239,126,25,.2);' +
        'box-shadow:0 4px 18px rgba(0,0,0,.35);' +
        'opacity:0;pointer-events:none;' +
        'transition:opacity .2s ease,transform .2s ease;transform:translateY(4px);' +
      '}' +
      '#compass-btn:hover + #compass-tooltip,' +
      '#compass-btn:focus + #compass-tooltip{opacity:1;transform:translateY(0)}' +
      '@media(max-width:480px){#compass-btn{right:16px;bottom:20px}#compass-tooltip{right:16px;bottom:84px}}'
    document.head.appendChild(style)

    // Detect if we're in a subdirectory (packages/)
    var inSub    = location.pathname.includes('/packages/')
    var pagePath = inSub ? '../compass.html' : 'compass.html'

    var btn = document.createElement('a')
    btn.id   = 'compass-btn'
    btn.href = pagePath
    btn.setAttribute('aria-label', 'Open COMPASS trip planner')
    btn.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
        '<circle cx="12" cy="12" r="10"/>' +
        '<polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>' +
      '</svg>'

    var tooltip = document.createElement('div')
    tooltip.id          = 'compass-tooltip'
    tooltip.textContent = 'Plan your trip with COMPASS'

    document.body.appendChild(btn)
    document.body.appendChild(tooltip)
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _buildButton)
  } else {
    _buildButton()
  }

})()
