
-- Add heat_level to signals for "keep it burning" lifecycle
ALTER TABLE public.signals ADD COLUMN IF NOT EXISTS heat_level text NOT NULL DEFAULT 'match';
ALTER TABLE public.signals ADD COLUMN IF NOT EXISTS last_engagement_at timestamptz DEFAULT now();

-- Function to get top 3 embers per vibe with avatars
CREATE OR REPLACE FUNCTION public.get_vibe_top_embers(p_vibes text[])
RETURNS TABLE(vibe text, user_id uuid, display_name text, avatar_url text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT DISTINCT ON (v.vibe, p.user_id)
    v.vibe,
    p.user_id,
    p.display_name,
    p.avatar_url
  FROM unnest(p_vibes) AS v(vibe)
  JOIN profiles p ON p.interests @> ARRAY[v.vibe]
  ORDER BY v.vibe, p.user_id, p.created_at ASC
  LIMIT 100
$$;

-- Function to calculate and update heat levels based on engagement
CREATE OR REPLACE FUNCTION public.update_signal_heat_levels()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  sig RECORD;
  heat_score bigint;
  new_level text;
  new_expiry timestamptz;
BEGIN
  FOR sig IN
    SELECT s.id, s.created_at, s.heat_level, s.last_engagement_at, s.expires_at,
      COALESCE(f.cnt, 0) AS felt_count,
      COALESCE(st.cnt, 0) AS stitch_count,
      COALESCE(v.cnt, 0) AS view_count
    FROM signals s
    LEFT JOIN LATERAL (SELECT COUNT(*) AS cnt FROM felts WHERE signal_id = s.id) f ON true
    LEFT JOIN LATERAL (SELECT COUNT(*) AS cnt FROM stitches WHERE signal_id = s.id) st ON true
    LEFT JOIN LATERAL (SELECT COUNT(*) AS cnt FROM signal_views WHERE signal_id = s.id) v ON true
    WHERE s.expires_at > now()
  LOOP
    heat_score := sig.felt_count * 3 + sig.stitch_count * 8 + sig.view_count;
    
    -- Determine heat level
    IF heat_score >= 250 THEN new_level := 'star';
    ELSIF heat_score >= 180 THEN new_level := 'inferno';
    ELSIF heat_score >= 120 THEN new_level := 'raging';
    ELSIF heat_score >= 80 THEN new_level := 'burning';
    ELSIF heat_score >= 50 THEN new_level := 'hot';
    ELSIF heat_score >= 30 THEN new_level := 'flame';
    ELSIF heat_score >= 15 THEN new_level := 'ignite';
    ELSIF heat_score >= 5 THEN new_level := 'spark';
    ELSE new_level := 'match';
    END IF;

    -- If star level, extend to 1 year
    IF new_level = 'star' AND sig.heat_level != 'star' THEN
      new_expiry := now() + interval '1 year';
    -- If no engagement in 2 hours, mark for removal
    ELSIF sig.last_engagement_at < now() - interval '2 hours' AND new_level = 'match' THEN
      new_expiry := now();
    ELSE
      new_expiry := sig.expires_at;
    END IF;

    -- Update if changed
    IF new_level != sig.heat_level OR new_expiry != sig.expires_at THEN
      UPDATE signals SET heat_level = new_level, expires_at = new_expiry WHERE id = sig.id;
    END IF;
  END LOOP;
END;
$$;

-- Trigger to update last_engagement_at on felts
CREATE OR REPLACE FUNCTION public.update_signal_engagement()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE signals SET last_engagement_at = now() WHERE id = NEW.signal_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER felts_engagement_trigger
AFTER INSERT ON public.felts
FOR EACH ROW EXECUTE FUNCTION update_signal_engagement();

CREATE OR REPLACE TRIGGER stitches_engagement_trigger
AFTER INSERT ON public.stitches
FOR EACH ROW EXECUTE FUNCTION update_signal_engagement();

CREATE OR REPLACE TRIGGER views_engagement_trigger
AFTER INSERT ON public.signal_views
FOR EACH ROW EXECUTE FUNCTION update_signal_engagement();
