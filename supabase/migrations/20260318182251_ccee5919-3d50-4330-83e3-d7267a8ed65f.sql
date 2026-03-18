
-- Drop unused seed_exposures table (FK to signals won't work for virtual seed content)
DROP TABLE IF EXISTS public.seed_exposures;

-- Seed content pool - curated stock photos for content density
CREATE TABLE public.seed_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text NOT NULL,
  display_name text NOT NULL,
  stitch_word text,
  category text,
  heat_score integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.seed_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view seed content" ON public.seed_content
  FOR SELECT TO authenticated USING (true);

-- Per-user seed exposure tracking with interaction state
CREATE TABLE public.seed_content_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  seed_content_id uuid NOT NULL REFERENCES public.seed_content(id) ON DELETE CASCADE,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  felt boolean NOT NULL DEFAULT false,
  stitched boolean NOT NULL DEFAULT false,
  stitch_word text,
  UNIQUE(user_id, seed_content_id)
);

ALTER TABLE public.seed_content_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert own seed views" ON public.seed_content_views
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own seed views" ON public.seed_content_views
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own seed views" ON public.seed_content_views
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
