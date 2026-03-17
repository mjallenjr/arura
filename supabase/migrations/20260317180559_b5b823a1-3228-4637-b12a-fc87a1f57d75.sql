
-- Track signal views
CREATE TABLE public.signal_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  signal_id uuid NOT NULL REFERENCES public.signals(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, signal_id)
);

ALTER TABLE public.signal_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own views" ON public.signal_views
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own views" ON public.signal_views
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Update aura ranking to include views from both directions
CREATE OR REPLACE FUNCTION public.get_aura_ranked_following(p_user_id uuid)
RETURNS TABLE(following_id uuid, aura_score bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT
    f.following_id,
    -- Felts I gave to their signals
    COALESCE(felt_given.cnt, 0) * 3
    -- Felts they gave to my signals
    + COALESCE(felt_received.cnt, 0) * 3
    -- Views I gave to their signals
    + COALESCE(views_given.cnt, 0)
    -- Views they gave to my signals (the key addition)
    + COALESCE(views_received.cnt, 0) * 2
    AS aura_score
  FROM follows f
  LEFT JOIN LATERAL (
    SELECT COUNT(*) AS cnt FROM felts fl
    JOIN signals s ON s.id = fl.signal_id
    WHERE fl.user_id = p_user_id AND s.user_id = f.following_id
  ) felt_given ON true
  LEFT JOIN LATERAL (
    SELECT COUNT(*) AS cnt FROM felts fl
    JOIN signals s ON s.id = fl.signal_id
    WHERE fl.user_id = f.following_id AND s.user_id = p_user_id
  ) felt_received ON true
  LEFT JOIN LATERAL (
    SELECT COUNT(*) AS cnt FROM signal_views sv
    JOIN signals s ON s.id = sv.signal_id
    WHERE sv.user_id = p_user_id AND s.user_id = f.following_id
  ) views_given ON true
  LEFT JOIN LATERAL (
    SELECT COUNT(*) AS cnt FROM signal_views sv
    JOIN signals s ON s.id = sv.signal_id
    WHERE sv.user_id = f.following_id AND s.user_id = p_user_id
  ) views_received ON true
  WHERE f.follower_id = p_user_id
  ORDER BY aura_score DESC, f.created_at DESC
$$;
