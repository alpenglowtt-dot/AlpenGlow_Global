-- ============================================================
--  Alpen Glow Tours — Content Tables  (migration 002)
--  Run in: Supabase Dashboard → SQL Editor
-- ============================================================

-- ── OFFERS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.offers (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  title       TEXT        NOT NULL,
  badge       TEXT        NOT NULL DEFAULT '',
  code        TEXT        NOT NULL,
  description TEXT,
  image_url   TEXT,
  cta_text    TEXT        DEFAULT 'Claim Offer →',
  active      BOOLEAN     DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── BLOG POSTS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  title      TEXT        NOT NULL,
  meta       TEXT,         -- e.g. "Travel Tips — June 2026"
  excerpt    TEXT,         -- preview paragraph shown on homepage
  content    TEXT,         -- full HTML content shown after unlock
  image_url  TEXT,
  active     BOOLEAN     DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── INDEXES ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_offers_active    ON public.offers    (active, created_at);
CREATE INDEX IF NOT EXISTS idx_blog_active      ON public.blog_posts (active, created_at);

-- ── UPDATED_AT TRIGGERS ───────────────────────────────────────
CREATE TRIGGER offers_updated_at
  BEFORE UPDATE ON public.offers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER blog_posts_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── ROW LEVEL SECURITY ────────────────────────────────────────
ALTER TABLE public.offers     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Public read (homepage fetches these with anon key)
CREATE POLICY "offers_public_read"     ON public.offers     FOR SELECT TO anon USING (true);
CREATE POLICY "blog_public_read"       ON public.blog_posts FOR SELECT TO anon USING (true);

-- Dashboard write (uses same anon key — owner is gated by JS password)
CREATE POLICY "offers_dashboard_insert" ON public.offers     FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "offers_dashboard_update" ON public.offers     FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "offers_dashboard_delete" ON public.offers     FOR DELETE TO anon USING (true);

CREATE POLICY "blog_dashboard_insert"   ON public.blog_posts FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "blog_dashboard_update"   ON public.blog_posts FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "blog_dashboard_delete"   ON public.blog_posts FOR DELETE TO anon USING (true);

-- ── SEED: DEFAULT OFFERS ──────────────────────────────────────
INSERT INTO public.offers (title, badge, code, description, image_url, cta_text) VALUES
(
  'Summer Beach Escape',
  '30% OFF',
  'SUMMER30',
  'Book any beach destination — Maldives, Bali, Santorini — before July 31 and save 30% on your total package price.',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80',
  'Claim Offer →'
),
(
  'Plan Ahead & Save',
  'EARLY BIRD 20%',
  'EARLY2027',
  'Book your 2027 holiday before September and enjoy exclusive early-bird pricing across all Alpen Glow packages.',
  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600&q=80',
  'Learn More →'
),
(
  'Honeymoon Special',
  '25% Off + Upgrades',
  'HONEY25',
  'Celebrate your love in paradise. Applies to all couple packages with complimentary room upgrades and a welcome amenity.',
  'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600&q=80',
  'View Packages →'
);

-- ── SEED: DEFAULT BLOG POSTS ─────────────────────────────────
INSERT INTO public.blog_posts (title, meta, excerpt, content, image_url) VALUES
(
  '10 Hidden Beaches You''ve Never Heard Of',
  'Travel Tips — June 2026',
  'Beyond the crowded tourist shores lie some of the world''s most breathtaking coastal secrets. From the turquoise coves of the Philippines to the volcanic black sand beaches of the Azores, these untouched paradises offer solitude and natural beauty that will leave you speechless.',
  '<p>Beyond the crowded tourist shores lie some of the world''s most breathtaking coastal secrets. We spent months researching and visiting each location to bring you this definitive guide.</p>
<h4>1. El Nido Secret Beach, Philippines</h4>
<p>Accessible only by swimming through a narrow limestone crevice, this hidden lagoon near Palawan rewards the adventurous with impossibly clear turquoise water and absolute solitude. Visit at sunrise when the light turns everything gold.</p>
<h4>2. Praia do Camilo, Portugal</h4>
<p>Carved into dramatic ochre cliffs on the Algarve coast, reached by a wooden staircase cut into the rock face. Two sea arches frame the small cove and make for unforgettable photographs.</p>
<h4>3. Furuzamami Beach, Japan</h4>
<p>On the tiny Zamami Island of Okinawa, this beach consistently ranks among Asia''s finest yet sees a fraction of the crowds of the main island. Coral reefs teeming with tropical fish lie just metres from shore.</p>
<h4>4. Anse Source d''Argent, Seychelles</h4>
<p>Famous for its granite boulders and shallow calm waters on La Digue Island. The warm Indian Ocean water barely reaches waist height for hundreds of metres — perfect for families and couples alike.</p>
<h4>5. Whitehaven Beach, Australia</h4>
<p>Seven kilometres of 98% pure silica sand that stays cool to the touch even in peak summer. The swirling tidal flats at Hill Inlet create ever-changing patterns of white, cream, and turquoise visible from the hilltop lookout.</p>
<p><em>Planning a beach escape? Our travel team specialises in crafting bespoke itineraries to destinations like these. Get in touch for a personalised quote.</em></p>',
  'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&q=80'
),
(
  'Packing Like a Pro: The Ultimate Carry-On Guide',
  'Guides — May 2026',
  'Master the art of traveling light without sacrificing style or comfort. Our seasoned travel editors reveal the packing strategies used by flight crews and globetrotters alike — from rolling techniques that maximize every inch to the essential gadgets that make long-haul flights bearable.',
  '<p>Master the art of traveling light without sacrificing style or comfort. These are the strategies used by flight crews and veteran globetrotters who live out of a single bag.</p>
<h4>The Golden Rule: One Week, One Bag</h4>
<p>Every item you pack should serve at least two purposes. A merino wool sweater works as a layering piece, a pillow substitute, and a light blanket on cold flights. Dark-wash jeans go from hiking to a restaurant without looking out of place.</p>
<h4>The Fabric Hierarchy</h4>
<p>Merino wool is unbeatable for travel — it resists odour for days, wicks moisture, and packs down small. Synthetic blends dry overnight when hand-washed. Pure cotton is the enemy of the light packer: it wrinkles, holds moisture, and takes forever to dry.</p>
<h4>The Capsule Wardrobe Formula</h4>
<p>For a two-week trip: 3 tops, 2 bottoms, 1 dress or smart option, 1 layer, 2 pairs of shoes. Everything should mix and match. Stick to a three-colour palette — navy, white, and one accent colour works universally across climates and occasions.</p>
<p><em>Alpen Glow''s travel team provides destination-specific packing lists with every itinerary. Ask us when you book.</em></p>',
  'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&q=80'
),
(
  'Why Slow Travel Is the Future of Exploration',
  'Culture — April 2026',
  'In a world obsessed with checking off bucket lists, a growing movement of travelers is choosing depth over distance. Slow travel isn''t just about lingering longer — it''s a philosophy that prioritizes meaningful connections with local cultures and truly sustainable tourism.',
  '<p>In a world obsessed with checking off bucket lists, a growing movement of travelers is choosing depth over distance. Slow travel is not just about lingering longer in each destination — it''s a philosophy that prioritizes meaningful connections with local cultures and sustainable tourism.</p>
<h4>The Rush Problem</h4>
<p>The traditional European highlights tour — Paris, Rome, Barcelona, Amsterdam, Prague, Vienna, Budapest in ten days — creates a blur. You''ve technically been to seven countries but your memories are airport lounges, coach windows, and hotel lobbies.</p>
<h4>What Slow Travel Actually Means</h4>
<p>It means spending at least a week in each place. It means staying in neighborhoods rather than tourist districts. It means eating where locals eat, learning a few words of the language, and returning to the same café twice.</p>
<h4>How to Start</h4>
<p>Your next trip: halve the number of destinations and double the time in each one. If you were planning four cities in eight days, try two cities in eight days instead. You''ll spend less time in transit, save money on internal travel, and come back with a story rather than a highlight reel.</p>
<p><em>Talk to our team about building a slow travel itinerary. We specialise in giving you the feeling that you actually lived somewhere, even briefly.</em></p>',
  'https://images.unsplash.com/photo-1504150558240-0b4fd8946624?w=600&q=80'
);
