-- ============================================================
--  Alpen Glow Tours — Package Page Content  (migration 004)
--  Run in: Supabase Dashboard → SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.package_pages (
  id                   UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  slug                 TEXT        NOT NULL UNIQUE,  -- matches filename: 'japan', 'norway', etc.

  -- Hero section
  page_title           TEXT,                         -- browser tab title
  hero_image_url       TEXT,
  duration             TEXT,
  location             TEXT,
  title                TEXT,

  -- Overview
  overview_heading     TEXT        DEFAULT 'Overview',
  overview_paragraphs  JSONB       DEFAULT '[]',     -- ["para1", "para2"]

  -- Places / Cities section
  places_heading       TEXT        DEFAULT 'Explore the Cities',
  places               JSONB       DEFAULT '[]',
  -- each place: {key, name, tagline, card_image_url, modal_image_url, modal_tagline, desc}

  -- What's Included
  inclusions_heading   TEXT        DEFAULT 'What''s Included',
  inclusions           JSONB       DEFAULT '[]',     -- ["8 nights accommodation", ...]

  active               BOOLEAN     DEFAULT TRUE,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_package_pages_slug ON public.package_pages (slug);

CREATE TRIGGER package_pages_updated_at
  BEFORE UPDATE ON public.package_pages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE public.package_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pkg_pages_public_read" ON public.package_pages FOR SELECT TO anon USING (true);
CREATE POLICY "pkg_pages_dev_insert"  ON public.package_pages FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "pkg_pages_dev_update"  ON public.package_pages FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "pkg_pages_dev_delete"  ON public.package_pages FOR DELETE TO anon USING (true);

-- ── SEED: JAPAN ───────────────────────────────────────────────
INSERT INTO public.package_pages
  (slug, page_title, hero_image_url, duration, location, title,
   overview_heading, overview_paragraphs,
   places_heading, places,
   inclusions_heading, inclusions)
VALUES (
  'japan',
  'Japan — Land of Contrasts | Alpen Glow Tours and Travels',
  'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1600&q=80',
  '9 Days / 8 Nights',
  'Japan',
  'Japan — Land of Contrasts',
  'Overview',
  '[
    "Japan holds two ideas in balance better than almost anywhere else — centuries-old tradition and some of the world''s most futuristic cities, often on the same block. This trip moves from Tokyo''s neon density to Kyoto''s temple gardens to Mount Fuji''s classic postcard view, built around the bullet train so the transitions feel as smooth as the destinations are different.",
    "Best for travelers who want both the modern-Japan spectacle and the quieter, older side of the country."
  ]'::jsonb,
  'Explore the Cities',
  '[
    {"key":"tokyo",     "name":"Tokyo",                "tagline":"Centuries-old shrines beside neon-lit crossings.",                 "card_image_url":"https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=900&q=80", "modal_image_url":"https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=900&q=80", "modal_tagline":"Where two timelines run at once",                              "desc":"Tokyo is twenty-three wards that somehow never repeat themselves. Asakusa keeps its centuries-old temple rhythm while Shibuya rebuilds its skyline every few years. Shinjuku turns electric after dark, and a five-minute train ride can drop you somewhere entirely quiet."},
    {"key":"kyoto",     "name":"Kyoto",                "tagline":"Thousands of red gates and a city that moves slower on purpose.", "card_image_url":"https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=900&q=80", "modal_image_url":"https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=900&q=80", "modal_tagline":"Japan''s former capital, still set at its own pace",           "desc":"Kyoto was the imperial capital for over a thousand years, and it still carries that weight without showing it off. Thousands of vermillion gates climb the hillside at Fushimi Inari, and the geisha district of Gion keeps its evenings quiet by design."},
    {"key":"osaka",     "name":"Osaka",                "tagline":"Japan''s kitchen, built around eating in the street.",            "card_image_url":"https://images.unsplash.com/photo-1590559899731-a382839e5549?w=900&q=80", "modal_image_url":"https://images.unsplash.com/photo-1590559899731-a382839e5549?w=900&q=80", "modal_tagline":"Japan''s kitchen, built around eating in the street",          "desc":"Osaka has a reputation as Japan''s food capital, and the city is built to back that up. Dotonbori''s canal-side stalls run late into the night, and the local sense of humor is famously looser than Tokyo''s."},
    {"key":"hiroshima", "name":"Hiroshima & Nagasaki", "tagline":"Two cities defined by resilience, not just history.",             "card_image_url":"https://images.unsplash.com/photo-1624253321171-1be53e12f5f4?w=900&q=80", "modal_image_url":"https://images.unsplash.com/photo-1624253321171-1be53e12f5f4?w=900&q=80", "modal_tagline":"Two cities defined by resilience, not just history",          "desc":"Both cities are remembered for August 1945, and both have spent the decades since refusing to be defined only by that. Hiroshima''s Peace Memorial Park sits beside a city that rebuilt itself into a genuinely livable, green place."},
    {"key":"fukuoka",   "name":"Fukuoka",              "tagline":"Japan''s most underrated food city, facing the sea toward Korea.", "card_image_url":"https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=900&q=80", "modal_image_url":"https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=900&q=80", "modal_tagline":"Japan''s most underrated food city, facing the sea toward Korea", "desc":"Fukuoka rarely makes a first-time itinerary, which is exactly its appeal. The city is the birthplace of tonkotsu ramen, and its yatai food stalls line the riverside every evening."}
  ]'::jsonb,
  'What''s Included',
  '["8 nights accommodation","JR rail pass for bullet train travel","Mount Fuji & Hakone day trip","Fushimi Inari guided visit","Daily breakfast"]'::jsonb
);
