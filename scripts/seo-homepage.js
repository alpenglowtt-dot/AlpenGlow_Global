const fs = require('fs');
const F = require('path').join(__dirname, '..', 'AlpenGlow', 'index.html');
let h = fs.readFileSync(F, 'utf8');

/* ---------- 1. Remove previously generated blocks (idempotent) ---------- */
// Swallow the surrounding blank lines too: the FAQ is re-inserted with a
// "\n\n" before <footer>, so stripping only one newline grew the file by a
// blank line on every run.
h = h.replace(/\n*<!-- SEOCONTENT:BEGIN -->[\s\S]*?<!-- SEOCONTENT:END -->\n*/g, '\n');
h = h.replace(/\n?<!-- SEOFOOTER:BEGIN -->[\s\S]*?<!-- SEOFOOTER:END -->/g, '');
h = h.replace(/\n?<!-- SEOSTYLE:BEGIN -->[\s\S]*?<!-- SEOSTYLE:END -->/g, '');
h = h.replace(/\n?<!-- SEOPRELOAD:BEGIN -->[\s\S]*?<!-- SEOPRELOAD:END -->/g, '');

/* ---------- 2. Preload the LCP hero image ---------- */
const HERO = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&amp;q=80';
const preload = '<!-- SEOPRELOAD:BEGIN -->\n' +
  '<link rel="preload" as="image" href="' + HERO + '" fetchpriority="high">\n' +
  '<!-- SEOPRELOAD:END -->';
h = h.replace('<!-- SEO:END -->', '<!-- SEO:END -->\n' + preload);

/* ---------- 3. Styles for the new FAQ + destination-hub blocks ---------- */
const css = `<!-- SEOSTYLE:BEGIN -->
<style>
#faq { padding: 6rem 3rem; background: var(--warm-gray); }
#faq .faq-head { text-align: center; max-width: 760px; margin: 0 auto 3rem; }
#faq h2 { font-family: var(--font-display); font-size: clamp(2rem, 4vw, 3rem); font-weight: 400; color: var(--dark); }
#faq h2 em { font-style: italic; color: var(--red); }
#faq .faq-intro { margin-top: 1rem; color: var(--text-light); font-size: 0.95rem; line-height: 1.8; }
.faq-list { max-width: 860px; margin: 0 auto; }
.faq-item { background: var(--white); border-radius: 16px; margin-bottom: 0.9rem; overflow: hidden; box-shadow: 0 2px 14px rgba(24,24,24,0.05); }
.faq-item > summary { list-style: none; cursor: pointer; padding: 1.3rem 1.6rem; font-weight: 600; font-size: 0.95rem; color: var(--dark); display: flex; justify-content: space-between; align-items: center; gap: 1rem; }
.faq-item > summary::-webkit-details-marker { display: none; }
.faq-item > summary::after { content: '+'; color: var(--orange); font-size: 1.4rem; line-height: 1; flex: none; }
.faq-item[open] > summary::after { content: '\\2212'; }
.faq-item .faq-a { padding: 0 1.6rem 1.4rem; color: var(--text-light); font-size: 0.9rem; line-height: 1.8; }
.faq-item .faq-a a { color: var(--red); font-weight: 600; }
.faq-item .faq-a a:hover { text-decoration: underline; }
.footer-all-link { display: inline-block; color: rgba(255,255,255,0.7); font-size: 0.8rem; font-weight: 600; letter-spacing: 0.03em; margin-bottom: 1.2rem; border-bottom: 1px solid rgba(255,255,255,0.25); padding-bottom: 0.15rem; transition: color 0.3s, border-color 0.3s; }
.footer-all-link:hover { color: var(--orange); border-color: var(--orange); }
.footer-address { color: rgba(255,255,255,0.4); font-size: 0.78rem; margin-bottom: 0.4rem; }
@media (max-width: 768px) {
  #faq { padding: 3.5rem 1.2rem; }
}
</style>
<!-- SEOSTYLE:END -->`;
h = h.replace('<!-- SEOPRELOAD:END -->', '<!-- SEOPRELOAD:END -->\n' + css);

/* ---------- 4. FAQ section (visible content, backs the FAQPage schema) ---------- */
const faqs = [
  ['Where is AlpenGlow Global based?',
   'AlpenGlow Global is a travel agency at 1078, Big Bazaar Street, Coimbatore, 641001, Tamil Nadu. We plan international trips for travellers across India, and the whole itinerary can be built and confirmed remotely over WhatsApp and email.'],
  ['Which destinations do you build tour packages for?',
   'We currently run curated packages for Bali, Japan, Switzerland, Italy, Santorini, Norway, Australia, New Zealand, South Korea, India\u2019s Golden Triangle, Nepal, Bhutan, Sri Lanka, Maldives, Mauritius, Seychelles, and cruise sailings with Royal Caribbean, Resorts World and along the Danube.'],
  ['Can a package be customised to my dates and budget?',
   'Yes. Every itinerary on this site is a starting point rather than a fixed departure. Use <a href="compass.html">COMPASS</a>, our trip planner, to set your vibe, month, group size and budget, and we build the trip around that.'],
  ['Do you handle honeymoon trips?',
   'Honeymoons are one of the things we plan most: Maldives, Mauritius, Seychelles, Bali and Santorini all have dedicated packages with overwater villas, private transfers and beach-side stays.'],
  ['Do you arrange cruises as well as land trips?',
   'We book large-liner sailings out of Singapore with Royal Caribbean and Resorts World, and European river cruises along the Danube. Cruise packages include the sailing, transfers and the pre- or post-cruise city stay.'],
  ['How do I see the full itinerary and pricing?',
   'The overview of every package is free to read. Verifying your WhatsApp number and email on the package page unlocks the full day-by-day itinerary, the inclusions list and the pricing for your dates.'],
  ['How far in advance should I book an international trip?',
   'For peak season travel (December holidays, Japan\u2019s cherry blossom weeks, European summer) plan on three to five months ahead so flights, visas and the better rooms are still available. Shorter trips like the Maldives or a Singapore cruise can be put together in four to six weeks.']
];
const faqHtml = '<!-- SEOCONTENT:BEGIN -->\n<section id="faq">\n' +
  '  <div class="faq-head">\n' +
  '    <div class="section-tag">Before You Book</div>\n' +
  '    <h2>Frequently Asked <em>Questions</em></h2>\n' +
  '    <p class="faq-intro">Everything travellers ask us before planning an international trip with AlpenGlow Global: destinations, customisation, honeymoons, cruises and how pricing works.</p>\n' +
  '  </div>\n' +
  '  <div class="faq-list">\n' +
  faqs.map(([q, a], i) =>
    '    <details class="faq-item"' + (i === 0 ? ' open' : '') + '>\n' +
    '      <summary><h3 style="font:inherit;margin:0;">' + q + '</h3></summary>\n' +
    '      <div class="faq-a">' + a + '</div>\n' +
    '    </details>').join('\n') +
  '\n  </div>\n</section>\n<!-- SEOCONTENT:END -->';
h = h.replace('<footer id="footer">', faqHtml + '\n\n<footer id="footer">');

/* ---------- 5. Single crawlable link to destinations.html (fixes orphan pages) ----------
 * destinations.html carries the full 19-link grid (generated by seo-head.js from `packs`);
 * the footer just needs one static <a> so a crawler can reach it from the homepage. */
const hub = '<!-- SEOFOOTER:BEGIN -->\n' +
  '  <a class="footer-all-link" href="destinations.html">View All Tour Packages &amp; Cruises</a>\n' +
  '  <p class="footer-address">AlpenGlow Global, 1078, Big Bazaar Street, Coimbatore, 641001, Tamil Nadu, India</p>\n' +
  '<!-- SEOFOOTER:END -->';
h = h.replace(/(<div class="footer-links">[\s\S]*?<\/div>)/, '$1\n' + hub);

/* ---------- 6. Lazy-load below-the-fold images, keep the logo eager ---------- */
// The nav-logo image is rebuilt from scratch (not appended to) so re-running
// this script never piles up duplicate width/height/decoding attributes.
h = h.replace(/(<a href="#" class="nav-logo">\s*)<img[^>]*>/,
  '$1<img src="alpenglow-removebg-preview.png" alt="AlpenGlow Global, travel agency in Coimbatore" width="608" height="221" decoding="async">');
h = h.replace(/<img (?![^>]*loading=)([^>]*?)>/g, (m, a) =>
  /alpenglow-removebg-preview/.test(a) ? m : '<img ' + a + ' loading="lazy" decoding="async">');

/* ---------- 7. Hero sub-headline: accurate to the packages actually sold ---------- */
h = h.replace(
  /<p class="hero-sub">[\s\S]*?<\/p>/,
  '<p class="hero-sub">Handcrafted international tour packages, honeymoons and cruises, from Bali and Japan to the Swiss Alps, the Maldives and the Norwegian fjords, planned trip by trip from Coimbatore for travellers who want more than a checklist.</p>');

fs.writeFileSync(F, h, 'utf8');
console.log('index.html enhanced');
