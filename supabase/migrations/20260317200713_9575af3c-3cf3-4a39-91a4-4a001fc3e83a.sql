
-- Advertisements table
CREATE TABLE public.advertisements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  headline text NOT NULL,
  description text,
  media_url text NOT NULL,
  media_type text NOT NULL DEFAULT 'image',
  cta_text text DEFAULT 'Learn More',
  cta_url text,
  target_interests text[] DEFAULT '{}'::text[],
  cost_per_impression numeric(10,4) DEFAULT 0.0050,
  active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Impression tracking for revenue
CREATE TABLE public.ad_impressions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id uuid REFERENCES public.advertisements(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  placement text NOT NULL DEFAULT 'feed',
  revenue numeric(10,4) NOT NULL DEFAULT 0.0050,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.advertisements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_impressions ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read active ads
CREATE POLICY "Authenticated users can view active ads"
  ON public.advertisements FOR SELECT TO authenticated
  USING (active = true);

-- Users can insert their own impressions
CREATE POLICY "Users can log impressions"
  ON public.ad_impressions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own impressions
CREATE POLICY "Users can view own impressions"
  ON public.ad_impressions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
