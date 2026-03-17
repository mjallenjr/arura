-- Aura score function: returns followed user IDs ordered by interaction frequency
-- Higher score = more felts exchanged = closer connection
CREATE OR REPLACE FUNCTION public.get_aura_ranked_following(p_user_id uuid)
RETURNS TABLE(following_id uuid, aura_score bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    f.following_id,
    COALESCE(felt_given.cnt, 0) + COALESCE(felt_received.cnt, 0) AS aura_score
  FROM follows f
  -- Felts I gave to their signals
  LEFT JOIN LATERAL (
    SELECT COUNT(*) AS cnt
    FROM felts fl
    JOIN signals s ON s.id = fl.signal_id
    WHERE fl.user_id = p_user_id
      AND s.user_id = f.following_id
  ) felt_given ON true
  -- Felts they gave to my signals
  LEFT JOIN LATERAL (
    SELECT COUNT(*) AS cnt
    FROM felts fl
    JOIN signals s ON s.id = fl.signal_id
    WHERE fl.user_id = f.following_id
      AND s.user_id = p_user_id
  ) felt_received ON true
  WHERE f.follower_id = p_user_id
  ORDER BY aura_score DESC, f.created_at DESC
$$;