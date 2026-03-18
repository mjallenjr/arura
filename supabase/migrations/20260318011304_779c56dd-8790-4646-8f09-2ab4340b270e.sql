
-- Create a function for engagement-weighted signal ranking
CREATE OR REPLACE FUNCTION public.get_engagement_ranked_signals(p_user_id uuid)
RETURNS TABLE(
  signal_id uuid,
  signal_user_id uuid,
  signal_type text,
  storage_path text,
  song_clip_url text,
  song_title text,
  stitch_word text,
  created_at timestamptz,
  expires_at timestamptz,
  engagement_score bigint
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    s.id AS signal_id,
    s.user_id AS signal_user_id,
    s.type AS signal_type,
    s.storage_path,
    s.song_clip_url,
    s.song_title,
    s.stitch_word,
    s.created_at,
    s.expires_at,
    -- Engagement score: felts * 5 + stitches * 8 + views * 1 + recency bonus
    COALESCE(felt_cnt.cnt, 0) * 5
    + COALESCE(stitch_cnt.cnt, 0) * 8
    + COALESCE(view_cnt.cnt, 0)
    + GREATEST(0, 120 - EXTRACT(EPOCH FROM (now() - s.created_at)) / 60)::bigint
    AS engagement_score
  FROM signals s
  LEFT JOIN LATERAL (
    SELECT COUNT(*) AS cnt FROM felts f WHERE f.signal_id = s.id
  ) felt_cnt ON true
  LEFT JOIN LATERAL (
    SELECT COUNT(*) AS cnt FROM stitches st WHERE st.signal_id = s.id
  ) stitch_cnt ON true
  LEFT JOIN LATERAL (
    SELECT COUNT(*) AS cnt FROM signal_views sv WHERE sv.signal_id = s.id
  ) view_cnt ON true
  WHERE s.expires_at > now()
    AND s.user_id != p_user_id
  ORDER BY engagement_score DESC, s.created_at DESC
  LIMIT 50
$$;

-- Create a function to get vibe ember counts for social proof
CREATE OR REPLACE FUNCTION public.get_vibe_counts(p_vibes text[])
RETURNS TABLE(vibe text, ember_count bigint)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT v.vibe, COUNT(DISTINCT p.user_id) AS ember_count
  FROM unnest(p_vibes) AS v(vibe)
  LEFT JOIN profiles p ON p.interests @> ARRAY[v.vibe]
  GROUP BY v.vibe
$$;
