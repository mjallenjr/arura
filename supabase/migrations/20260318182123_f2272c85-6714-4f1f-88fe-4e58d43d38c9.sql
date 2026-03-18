
-- Add media_url column to signals for external image support (stock photos)
ALTER TABLE public.signals ADD COLUMN IF NOT EXISTS media_url text;

-- Seed exposure tracking for per-user 2-hour content windows
CREATE TABLE public.seed_exposures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  signal_id uuid NOT NULL REFERENCES public.signals(id) ON DELETE CASCADE,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, signal_id)
);

ALTER TABLE public.seed_exposures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own seed exposures" ON public.seed_exposures
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own seed exposures" ON public.seed_exposures
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
