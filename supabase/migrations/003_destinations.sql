-- ============================================================
--  Alpen Glow Tours — Destinations & Packages  (migration 003)
--  Run in: Supabase Dashboard → SQL Editor
-- ============================================================

-- ── DESTINATIONS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.destinations (
  id               UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  slug             TEXT        NOT NULL UNIQUE,   -- used as data-dest + panel-{slug}
  number           TEXT        NOT NULL DEFAULT '01',
  name             TEXT        NOT NULL,
  countries        TEXT,                           -- e.g. "India · Nepal · Bhutan"
  description      TEXT,
  image_url        TEXT,
  panel_title      TEXT,                           -- title inside the expanded panel
  sub_destinations JSONB       DEFAULT '[]',       -- array of {name,desc,image_url,link}
  sort_order       INTEGER     DEFAULT 0,
  active           BOOLEAN     DEFAULT TRUE,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── TOUR PACKAGES ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.packages (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT        NOT NULL,
  location    TEXT,
  duration    TEXT,                               -- e.g. "8 Days / 7 Nights"
  description TEXT,
  image_url   TEXT,
  link        TEXT,                               -- relative path e.g. packages/norway.html
  sort_order  INTEGER     DEFAULT 0,
  active      BOOLEAN     DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── INDEXES ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_destinations_order ON public.destinations (sort_order, created_at);
CREATE INDEX IF NOT EXISTS idx_packages_order     ON public.packages      (sort_order, created_at);

-- ── UPDATED_AT TRIGGERS ───────────────────────────────────────
CREATE TRIGGER destinations_updated_at
  BEFORE UPDATE ON public.destinations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER packages_updated_at
  BEFORE UPDATE ON public.packages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── ROW LEVEL SECURITY ────────────────────────────────────────
ALTER TABLE public.destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packages     ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "destinations_public_read" ON public.destinations FOR SELECT TO anon USING (true);
CREATE POLICY "packages_public_read"     ON public.packages     FOR SELECT TO anon USING (true);

-- Dev editor write (anon key, gated by JS password in dev.html)
CREATE POLICY "destinations_dev_insert"  ON public.destinations FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "destinations_dev_update"  ON public.destinations FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "destinations_dev_delete"  ON public.destinations FOR DELETE TO anon USING (true);

CREATE POLICY "packages_dev_insert"      ON public.packages     FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "packages_dev_update"      ON public.packages     FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "packages_dev_delete"      ON public.packages     FOR DELETE TO anon USING (true);

-- ── SEED: DESTINATIONS ────────────────────────────────────────
INSERT INTO public.destinations (slug, number, name, countries, description, image_url, panel_title, sort_order, sub_destinations) VALUES
(
  'subcontinent', '01', 'The Cultural Soul',
  'India · Nepal · Bhutan · Sri Lanka',
  'Seamless border-crossing trails through the subcontinent''s sacred and scenic core.',
  'tajmahal.jpg', 'The Sub-Continent Expert', 1,
  '[
    {"name":"India","desc":"Discover the vibrant culture and breathtaking landscapes of India.","image_url":"india.jpg","link":"packages/india.html"},
    {"name":"Nepal","desc":"Explore the majestic mountains and rich cultural heritage of Nepal.","image_url":"nepal.jpg","link":"packages/nepal.html"},
    {"name":"Bhutan","desc":"Discover the unique culture and pristine landscapes of Bhutan.","image_url":"bhutan.jpg","link":"packages/bhutan.html"},
    {"name":"Sri Lanka","desc":"Explore the tropical beaches and ancient temples of Sri Lanka.","image_url":"srilanka.jpg","link":"packages/srilanka.html"}
  ]'::jsonb
),
(
  'longhaul', '02', 'Once-in-a-Lifetime',
  'Scandinavia · Japan · NZ · Australia · S. Korea',
  'Bucket-list journeys built for travelers who plan years, not weekends, ahead.',
  'aurora.jpg', 'The High-Value Long Haul', 2,
  '[
    {"name":"Scandinavia","desc":"Discover the stunning fjords and vibrant cities of Scandinavia.","image_url":"norway.jpg","link":"packages/norway.html"},
    {"name":"Japan","desc":"Experience the perfect blend of traditional culture and modern innovation in Japan.","image_url":"japan.png","link":"packages/japan.html"},
    {"name":"New Zealand","desc":"Discover the natural beauty and unique culture of New Zealand.","image_url":"newzealand.jpg","link":"packages/newzealand.html"},
    {"name":"Australia","desc":"Explore the diverse landscapes and vibrant cities of Australia.","image_url":"australia.jpg","link":"packages/australia.html"},
    {"name":"South Korea","desc":"Discover the dynamic culture and delicious cuisine of South Korea.","image_url":"southkorea.jpg","link":"packages/southkorea.html"}
  ]'::jsonb
),
(
  'islands', '03', 'Glowcations & Honeymoons',
  'Maldives · Seychelles · Mauritius · Bali',
  'Pure isolation or culture-plus-luxury, curated for couples and wellness escapes.',
  'honeymoon.jpg', 'The Island & Beach Specialist', 3,
  '[
    {"name":"Maldives","desc":"Experience the crystal-clear waters and overwater bungalows of the Maldives.","image_url":"maldives.jpg","link":"packages/maldives.html"},
    {"name":"Seychelles","desc":"Discover the pristine beaches and unique wildlife of the Seychelles.","image_url":"seychelles.jpg","link":"packages/seychelles.html"},
    {"name":"Mauritius","desc":"Explore the tropical paradise of Mauritius with its stunning beaches and vibrant culture.","image_url":"mauritius.jpg","link":"packages/mauritius.html"},
    {"name":"Bali","desc":"Discover the spiritual and cultural richness of Bali.","image_url":"bali.jpg","link":"packages/bali.html"}
  ]'::jsonb
),
(
  'cruises', '04', 'Family & MICE Sailings',
  'River Cruises · Large Liners',
  'The volume engine — European river cruising and large-liner departures across Asia.',
  'cruise.jpg', 'The Volume Driver: Cruise Sailings', 4,
  '[
    {"name":"European River Cruise","desc":"Experience the charm of Europe''s great rivers aboard luxury cruise ships.","image_url":"europeanrivercruise.jpg","link":"packages/rivercruise-europe.html"},
    {"name":"Royal Caribbean","desc":"Set sail on a luxury cruise through the Caribbean and beyond.","image_url":"royalcaribbean.jpg","link":"packages/royalcaribbean.html"},
    {"name":"Resorts World","desc":"Explore the luxurious amenities and stunning locations of Resorts World.","image_url":"resortsworld.jpg","link":"packages/resortsworld.html"}
  ]'::jsonb
);

-- ── SEED: TOUR PACKAGES ───────────────────────────────────────
INSERT INTO public.packages (name, location, duration, description, image_url, link, sort_order) VALUES
('Norwegian Fjords Expedition',  'Scandinavia', '8 Days / 7 Nights',  'Towering cliffs and crystal waters carve nature''s masterpiece. Cruise through breathtaking fjords beneath snow-capped peaks. Discover charming Nordic villages steeped in timeless traditions. An unforgettable journey into the heart of Scandinavia''s wilderness.', 'norway.jpg',    'packages/norway.html',      1),
('Santorini – Aegean Dreams',    'Greece',      '6 Days / 5 Nights',  'Whitewashed villages cascading down volcanic cliffs above the Aegean Sea. World-famous sunsets paint the horizon in shades of gold and crimson. Luxury, romance, and timeless Greek charm at every turn.',                                                     'santorini.jpg', 'packages/santorini.html',   2),
('Italian Grand Tour',           'Italy',       '10 Days / 9 Nights', 'Discover the rich culture and stunning landscapes of Italy on this unforgettable journey.',                                                                                                                                                                        'italy.jpg',     'packages/italy.html',       3),
('Swiss Alpine Wonderland',      'Switzerland', '7 Days / 6 Nights',  'Towering peaks and emerald valleys frame every moment. Ride legendary mountain railways through clouds and into the heart of the Alps. A journey built for wonder.',                                                                                                  'swissalps.jpg', 'packages/switzerland.html', 4),
('Japan – Land of Contrasts',    'Japan',       '9 Days / 8 Nights',  'Experience the perfect blend of traditional culture and modern innovation in Japan.',                                                                                                                                                                                'japan.jpg',     'packages/japan.html',       5),
('Bali – Island of the Gods',    'Indonesia',   '7 Days / 6 Nights',  'Immerse yourself in the vibrant culture and breathtaking scenery of Bali, where ancient traditions meet modern luxury.',                                                                                                                                            'baligods.jpg',  'packages/bali.html',        6);
