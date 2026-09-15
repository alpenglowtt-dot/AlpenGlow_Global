const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', 'AlpenGlow');
const SITE = 'https://alpenglowglobal.com';
const ORG_ID = SITE + '/#organization';

const BIZ = {
  "@type": ["TravelAgency", "LocalBusiness"],
  "@id": ORG_ID,
  name: "AlpenGlow Global",
  alternateName: "Alpen Glow Tours and Travels",
  url: SITE + "/",
  logo: { "@type": "ImageObject", url: SITE + "/alpenglow-removebg-preview.png" },
  image: SITE + "/swissalps.jpg",
  description: "AlpenGlow Global is a travel agency in Coimbatore, India, building handcrafted international tour packages, honeymoon trips, cruises and custom itineraries.",
  slogan: "Don't Just Visit. Live the Journey.",
  address: { "@type": "PostalAddress", streetAddress: "1078, Big Bazaar Street", addressLocality: "Coimbatore", addressRegion: "Tamil Nadu", postalCode: "641001", addressCountry: "IN" },
  areaServed: [{ "@type": "Country", name: "India" }],
  priceRange: "$$$",
  knowsAbout: ["International tour packages", "Honeymoon packages", "Cruise holidays", "Custom itineraries", "Group tours", "Visa assistance"]
};

const P = (slug, o) => Object.assign({ slug }, o);

const pages = [
  P('index.html', {
    url: SITE + '/',
    title: 'Custom Tour Packages & Honeymoon Trips | AlpenGlow Global',
    desc: 'Handcrafted international tour packages, honeymoons and cruises from Coimbatore - Bali, Japan, Switzerland, Maldives, Santorini and 14 more, planned trip by trip.',
    image: SITE + '/swissalps.jpg',
    imageAlt: 'Snow-capped Swiss Alps at sunrise',
    type: 'website'
  }),
  P('compass.html', {
    url: SITE + '/compass.html',
    title: 'COMPASS Trip Planner - Build Your Trip | AlpenGlow',
    desc: 'Use COMPASS, the AlpenGlow trip planner, to match your travel vibe, budget, month and group size to a custom international itinerary in under two minutes.',
    image: SITE + '/aurora.jpg',
    imageAlt: 'Northern lights over a fjord',
    type: 'website',
    noindex: true
  }),
  P('destinations.html', {
    url: SITE + '/destinations.html',
    title: 'All Tour Packages - Every Destination | AlpenGlow Global',
    desc: 'Every AlpenGlow Global tour package in one place - Bali, Japan, Switzerland, the Maldives, Santorini and 14 more, grouped by region with pricing and itineraries.',
    image: SITE + '/swissalps.jpg',
    imageAlt: 'Snow-capped Swiss Alps at sunrise',
    type: 'website',
    isCollection: true
  })
];

// Which region-group each package belongs to on destinations.html, and the
// display order of the groups themselves.
const GROUPS = [
  ['Asia & the Subcontinent', ['japan', 'southkorea', 'india', 'nepal', 'bhutan', 'srilanka'], 'asia-subcontinent'],
  ['Islands & Honeymoons', ['bali', 'maldives', 'mauritius', 'seychelles', 'santorini'], 'islands-honeymoons'],
  ['Europe', ['italy', 'switzerland', 'norway'], 'europe'],
  ['Once-in-a-Lifetime', ['australia', 'newzealand'], 'once-in-a-lifetime'],
  ['Cruises', ['royalcaribbean', 'resortsworld', 'rivercruise-europe'], 'cruises']
];

const packs = [
  ['australia', 'Australia Tour Packages - 9 Days from India | AlpenGlow',
    'A 9-day Australia tour package covering Sydney harbour, the red Outback and the Great Barrier Reef, planned end to end by AlpenGlow Global for travellers from India.',
    'australia.jpg', 'Sydney Opera House and harbour at dusk', 'Australia', 'P9D', 'Australia'],
  ['bali', 'Bali Tour Packages - 7 Days Ubud & Seminyak | AlpenGlow',
    'A 7-day Bali tour package moving from the rice terraces and temples of Ubud to the beach clubs of the south coast, with a day-by-day itinerary and full inclusions.',
    'bali.jpg', 'Rice terraces in Ubud, Bali', 'Bali, Indonesia', 'P7D', 'Indonesia'],
  ['bhutan', 'Bhutan Tour Packages - 6 Days Paro & Thimphu | AlpenGlow',
    'A 6-day Bhutan tour package through Paro, Thimphu and the Tiger\u2019s Nest monastery, built around the country\u2019s high-value low-volume tourism policy.',
    'bhutan.jpg', 'Tiger\u2019s Nest monastery on a cliff in Paro, Bhutan', 'Bhutan', 'P6D', 'Bhutan'],
  ['india', 'Golden Triangle Tour Package - 8 Days India | AlpenGlow',
    'An 8-day Golden Triangle tour package covering Delhi, Agra and Jaipur, extended beyond the standard circuit with Mughal monuments and royal Rajasthan.',
    'tajmahal.jpg', 'The Taj Mahal in Agra at sunrise', 'India', 'P8D', 'India'],
  ['italy', 'Italy Tour Packages - 10-Day Grand Tour | AlpenGlow',
    'A 10-day Italy tour package through Rome, Florence and Venice - ruins, Renaissance art and canals in one sequence, with a full day-by-day itinerary.',
    'italy.jpg', 'Grand Canal in Venice, Italy', 'Italy', 'P10D', 'Italy'],
  ['japan', 'Japan Tour Packages - 9 Days Tokyo & Kyoto | AlpenGlow',
    'A 9-day Japan tour package from Tokyo\u2019s neon districts to Kyoto\u2019s temple gardens and the classic Mount Fuji viewpoints, planned by AlpenGlow Global.',
    'japan.jpg', 'Mount Fuji behind a pagoda in Japan', 'Japan', 'P9D', 'Japan'],
  ['maldives', 'Maldives Honeymoon Packages - 5 Days | AlpenGlow Global',
    'A 5-day Maldives honeymoon package with an overwater villa, a private sandbank and a lagoon clear enough to watch reef fish from bed. Short and unhurried.',
    'maldives.jpg', 'Overwater villas above a turquoise lagoon in the Maldives', 'Maldives', 'P5D', 'Maldives'],
  ['mauritius', 'Mauritius Honeymoon Packages - 6 Days | AlpenGlow Global',
    'A 6-day Mauritius honeymoon package mixing Indian Ocean beaches, volcanic mountain hikes and French-Indian-Creole culture across one compact island.',
    'mauritius.jpg', 'Beach and mountain scenery in Mauritius', 'Mauritius', 'P6D', 'Mauritius'],
  ['nepal', 'Nepal Tour Packages - 7 Days Kathmandu, Pokhara | AlpenGlow',
    'A 7-day Nepal tour package covering Kathmandu\u2019s temple quarter, lakeside Pokhara under the Annapurna range and an early-morning Himalayan mountain flight.',
    'nepal.jpg', 'Himalayan peaks above Pokhara, Nepal', 'Nepal', 'P7D', 'Nepal'],
  ['newzealand', 'New Zealand Tour Packages - 10 Days | AlpenGlow Global',
    'A 10-day New Zealand tour package covering both islands properly - geothermal valleys and Maori culture in the north, fjords and glacier peaks in the south.',
    'newzealand.jpg', 'Milford Sound fjord in New Zealand', 'New Zealand', 'P10D', 'New Zealand'],
  ['norway', 'Norway Fjords Tour Packages - 8 Days | AlpenGlow Global',
    'An 8-day Norway fjords expedition built around the country\u2019s most scenic rail and ferry routes, with vertical cliffs, mirror-still water and waterfall valleys.',
    'norway.jpg', 'Norwegian fjord with steep cliffs and still water', 'Norway', 'P8D', 'Norway'],
  ['resortsworld', 'Resorts World Cruise - 4-Day Singapore Sailing | AlpenGlow',
    'A 4-day Resorts World cruise from Singapore - casino floors, pool decks and a full entertainment lineup packed into a long weekend at sea.',
    'resortsworld.jpg', 'Resorts World cruise ship at sea', 'Singapore', 'P4D', 'Singapore'],
  ['rivercruise-europe', 'Danube River Cruise - 8-Day Europe Package | AlpenGlow',
    'An 8-day European river cruise along the Danube through three capitals - unpack once and step off the boat straight into each old town.',
    'europeanrivercruise.jpg', 'River cruise ship on the Danube in Europe', 'Europe', 'P8D', 'Hungary'],
  ['royalcaribbean', 'Royal Caribbean Cruise - 7 Days Singapore | AlpenGlow',
    'A 7-day Royal Caribbean sailing from Singapore through Penang, Phuket and Langkawi - Southeast Asia without separate flights and hotels between stops.',
    'royalcaribbean.jpg', 'Royal Caribbean cruise liner in Southeast Asia', 'Southeast Asia', 'P7D', 'Singapore'],
  ['santorini', 'Santorini Tour Packages - 6-Day Greece Trip | AlpenGlow',
    'A 6-day Santorini tour package built around the caldera sunset, the whitewashed cliff villages and the island\u2019s black- and red-sand beaches.',
    'santorini.jpg', 'Whitewashed village above the Santorini caldera', 'Santorini, Greece', 'P6D', 'Greece'],
  ['seychelles', 'Seychelles Honeymoon Packages - 6 Days | AlpenGlow Global',
    'A 6-day Seychelles honeymoon package - granite boulder beaches, giant tortoises and UNESCO-protected forest across the granitic inner islands.',
    'seychelles.jpg', 'Granite boulders on a Seychelles beach', 'Seychelles', 'P6D', 'Seychelles'],
  ['southkorea', 'South Korea Tour Packages - 8 Days Seoul | AlpenGlow',
    'An 8-day South Korea tour package through Seoul\u2019s palace courtyards, K-pop districts and photogenic cafe streets - the trending pick for Indian travellers.',
    'southkorea.jpg', 'Gyeongbokgung palace in Seoul, South Korea', 'South Korea', 'P8D', 'South Korea'],
  ['srilanka', 'Sri Lanka Tour Packages - 7 Days | AlpenGlow Global',
    'A 7-day Sri Lanka tour package threading ancient rock fortresses, tea-country hill stations, wildlife safaris and the palm-lined south coast.',
    'srilanka.jpg', 'Sigiriya rock fortress in Sri Lanka', 'Sri Lanka', 'P7D', 'Sri Lanka'],
  ['switzerland', 'Switzerland Tour Packages - 7-Day Alps Trip | AlpenGlow',
    'A 7-day Switzerland tour package riding the country\u2019s scenic mountain trains between snow-capped Alpine peaks, emerald valleys and lakeside towns.',
    'switzerland.jpg', 'Swiss Alps with a mountain railway', 'Switzerland', 'P7D', 'Switzerland']
];

packs.forEach(function (k) {
  const slug = k[0], title = k[1], desc = k[2], img = k[3], alt = k[4], loc = k[5], iso = k[6], country = k[7];
  pages.push(P('packages/' + slug + '.html', {
    url: SITE + '/packages/' + slug + '.html',
    title: title, desc: desc, image: SITE + '/' + img, imageAlt: alt, type: 'article',
    trip: { loc: loc, iso: iso, country: country, name: title.split(' - ')[0].split(' | ')[0] }
  }));
});

const esc = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');


function faqSchema() {
  const fs2 = require('fs');
  const html = fs2.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const items = [];
  const re = /<summary><h3[^>]*>([\s\S]*?)<\/h3><\/summary>\s*<div class="faq-a">([\s\S]*?)<\/div>/g;
  let m;
  const strip = t => t.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  while ((m = re.exec(html))) {
    items.push({ "@type": "Question", name: strip(m[1]),
      acceptedAnswer: { "@type": "Answer", text: strip(m[2]) } });
  }
  return { "@type": "FAQPage", "@id": SITE + "/#faq", mainEntity: items };
}

function jsonld(p) {
  const graph = [];
  if (p.slug === 'index.html') {
    graph.push(BIZ);
    graph.push({
      "@type": "WebSite", "@id": SITE + "/#website", url: SITE + "/", name: "AlpenGlow Global",
      publisher: { "@id": ORG_ID }, inLanguage: "en-IN"
    });
    graph.push(faqSchema());
    graph.push({
      "@type": "ItemList", name: "Tour packages by AlpenGlow Global",
      itemListElement: packs.map((k, i) => ({
        "@type": "ListItem", position: i + 1,
        name: k[1].split(' - ')[0].split(' | ')[0], url: SITE + '/packages/' + k[0] + '.html'
      }))
    });
  } else if (p.isCollection) {
    graph.push({
      "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE + "/" },
        { "@type": "ListItem", position: 2, name: "All Tour Packages", item: p.url }
      ]
    });
    graph.push({
      "@type": "CollectionPage", url: p.url, name: p.title, description: p.desc,
      isPartOf: { "@id": SITE + "/#website" }, about: { "@id": ORG_ID },
      mainEntity: {
        "@type": "ItemList", name: "Every AlpenGlow Global tour package",
        itemListElement: packs.map((k, i) => ({
          "@type": "ListItem", position: i + 1,
          name: k[1].split(' - ')[0].split(' | ')[0], url: SITE + '/packages/' + k[0] + '.html'
        }))
      }
    });
    graph.push(BIZ);
  } else if (p.trip) {
    graph.push({
      "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE + "/" },
        { "@type": "ListItem", position: 2, name: "Tour Packages", item: SITE + "/#packages" },
        { "@type": "ListItem", position: 3, name: p.trip.name, item: p.url }
      ]
    });
    graph.push({
      "@type": "TouristTrip", "@id": p.url + "#trip", name: p.trip.name,
      description: p.desc, url: p.url, image: p.image,
      touristType: ["Couples", "Families", "Honeymooners", "Groups"],
      subjectOf: { "@type": "WebPage", url: p.url },
      arrivalLocation: {
        "@type": "Place", name: p.trip.loc,
        address: { "@type": "PostalAddress", addressCountry: p.trip.country }
      },
      provider: { "@id": ORG_ID }
    });
    graph.push(BIZ);
  } else {
    graph.push({
      "@type": "WebPage", url: p.url, name: p.title, description: p.desc,
      isPartOf: { "@id": SITE + "/#website" }, about: { "@id": ORG_ID }
    });
    graph.push(BIZ);
  }
  return JSON.stringify({ "@context": "https://schema.org", "@graph": graph }, null, 1);
}

function block(p) {
  const L = [];
  L.push('<!-- SEO:BEGIN (generated) -->');
  L.push('<meta name="description" content="' + esc(p.desc) + '">');
  L.push('<link rel="canonical" href="' + p.url + '">');
  L.push(p.noindex
    ? '<meta name="robots" content="noindex, follow">'
    : '<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">');
  L.push('<meta name="author" content="AlpenGlow Global">');
  L.push('<meta name="theme-color" content="#9d2420">');
  L.push('<meta name="geo.region" content="IN-TN">');
  L.push('<meta name="geo.placename" content="Coimbatore">');
  L.push('<meta property="og:type" content="' + p.type + '">');
  L.push('<meta property="og:site_name" content="AlpenGlow Global">');
  L.push('<meta property="og:locale" content="en_IN">');
  L.push('<meta property="og:title" content="' + esc(p.title) + '">');
  L.push('<meta property="og:description" content="' + esc(p.desc) + '">');
  L.push('<meta property="og:url" content="' + p.url + '">');
  L.push('<meta property="og:image" content="' + p.image + '">');
  L.push('<meta property="og:image:alt" content="' + esc(p.imageAlt) + '">');
  L.push('<meta name="twitter:card" content="summary_large_image">');
  L.push('<meta name="twitter:title" content="' + esc(p.title) + '">');
  L.push('<meta name="twitter:description" content="' + esc(p.desc) + '">');
  L.push('<meta name="twitter:image" content="' + p.image + '">');
  L.push('<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>');
  L.push('<link rel="preconnect" href="https://images.unsplash.com" crossorigin>');
  L.push('<script type="application/ld+json">\n' + jsonld(p) + '\n</script>');
  L.push('<!-- SEO:END -->');
  return L.join('\n');
}

let n = 0;
for (const p of pages) {
  const f = path.join(ROOT, p.slug);
  let h = fs.readFileSync(f, 'utf8');
  // Match "\r?\n" so CRLF checkouts don't leave a lone "\r" behind on every run.
  h = h.replace(/(?:\r?\n)?<!-- SEO:BEGIN \(generated\) -->[\s\S]*?<!-- SEO:END -->/g, '');
  if (!/<title>[\s\S]*?<\/title>/.test(h)) { console.log('NO TITLE: ' + p.slug); continue; }
  h = h.replace(/<title>[\s\S]*?<\/title>/, '<title>' + esc(p.title) + '</title>\n' + block(p));
  fs.writeFileSync(f, h, 'utf8');
  n++;
}
console.log('updated ' + n + ' pages');

/* ---------- Destination grid on destinations.html (generated from `packs`) ---------- */
const packBySlug = Object.fromEntries(packs.map(k => [k[0], k]));
const groupedSlugs = new Set(GROUPS.flatMap(([, slugs]) => slugs));
const ungrouped = packs.map(k => k[0]).filter(s => !groupedSlugs.has(s));
if (ungrouped.length) console.log('WARNING: not in any GROUPS entry: ' + ungrouped.join(', '));

const card = (k) => {
  const [slug, title, desc, img] = k;
  const name = title.split(' - ')[0].split(' | ')[0];
  return '      <a class="dest-card" href="packages/' + slug + '.html">\n' +
    '        <img src="' + img + '" alt="' + esc(k[4]) + '" loading="lazy" decoding="async">\n' +
    '        <div class="dest-card-body">\n' +
    '          <h3>' + esc(name) + '</h3>\n' +
    '          <p>' + esc(desc) + '</p>\n' +
    '          <span class="dest-card-link">View package</span>\n' +
    '        </div>\n' +
    '      </a>';
};
const destList = '<!-- DESTLIST:BEGIN -->\n' +
  GROUPS.map(([label, slugs, id]) =>
    '<section class="dest-group" id="' + id + '">\n  <h2>' + esc(label) + '</h2>\n  <div class="dest-grid">\n' +
    slugs.filter(s => packBySlug[s]).map(s => card(packBySlug[s])).join('\n') +
    '\n  </div>\n</section>').join('\n') +
  '\n<!-- DESTLIST:END -->';

{
  const f = path.join(ROOT, 'destinations.html');
  let h = fs.readFileSync(f, 'utf8');
  h = h.replace(/<!-- DESTLIST:BEGIN -->[\s\S]*?<!-- DESTLIST:END -->/, destList);
  fs.writeFileSync(f, h, 'utf8');
  console.log('destinations.html grid rebuilt (' + packs.length + ' packages, ' + GROUPS.length + ' groups)');
}

/* ---------- sitemap.xml (every indexable page) ---------- */
{
  const today = new Date().toISOString().slice(0, 10);
  const urls = pages.filter(p => !p.noindex).map(p => ({
    loc: p.url,
    priority: p.slug === 'index.html' ? '1.0' : (p.isCollection ? '0.9' : '0.8'),
    freq: p.slug === 'index.html' ? 'weekly' : 'monthly'
  }));
  const xml = '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.map(u =>
      '  <url>\n    <loc>' + u.loc + '</loc>\n    <lastmod>' + today + '</lastmod>\n' +
      '    <changefreq>' + u.freq + '</changefreq>\n    <priority>' + u.priority + '</priority>\n  </url>').join('\n') +
    '\n</urlset>\n';
  fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), xml, 'utf8');
  console.log('sitemap.xml rebuilt (' + urls.length + ' urls)');
}
