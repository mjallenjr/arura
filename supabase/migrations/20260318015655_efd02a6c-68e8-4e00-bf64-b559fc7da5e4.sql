-- Rekindle table: lets users boost dying signals
CREATE TABLE public.rekindles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  signal_id uuid NOT NULL REFERENCES public.signals(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, signal_id)
);

ALTER TABLE public.rekindles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can rekindle signals" ON public.rekindles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own rekindles" ON public.rekindles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Add rekindle notification type support (already flexible text column)
-- Update heat function to account for rekindles
CREATE OR REPLACE FUNCTION public.update_signal_heat_levels()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  sig RECORD;
  heat_score bigint;
  new_level text;
  new_expiry timestamptz;
  is_pro_signal boolean;
BEGIN
  FOR sig IN
    SELECT s.id, s.created_at, s.heat_level, s.last_engagement_at, s.expires_at,
      COALESCE(f.cnt, 0) AS felt_count,
      COALESCE(st.cnt, 0) AS stitch_count,
      COALESCE(v.cnt, 0) AS view_count,
      COALESCE(r.cnt, 0) AS rekindle_count
    FROM signals s
    LEFT JOIN LATERAL (SELECT COUNT(*) AS cnt FROM felts WHERE signal_id = s.id) f ON true
    LEFT JOIN LATERAL (SELECT COUNT(*) AS cnt FROM stitches WHERE signal_id = s.id) st ON true
    LEFT JOIN LATERAL (SELECT COUNT(*) AS cnt FROM signal_views WHERE signal_id = s.id) v ON true
    LEFT JOIN LATERAL (SELECT COUNT(*) AS cnt FROM rekindles WHERE signal_id = s.id) r ON true
    WHERE s.expires_at > now() OR s.heat_level = 'match'
  LOOP
    heat_score := sig.felt_count * 3 + sig.stitch_count * 8 + sig.view_count + sig.rekindle_count * 10;
    
    is_pro_signal := (sig.expires_at - sig.created_at) > interval '3 hours';
    
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

    IF new_level = 'star' AND sig.heat_level != 'star' THEN
      new_expiry := now() + interval '1 year';
    ELSIF sig.last_engagement_at < now() - interval '2 hours' AND new_level = 'match' AND NOT is_pro_signal THEN
      new_expiry := now();
    ELSE
      new_expiry := sig.expires_at;
    END IF;

    -- Rekindle effect: if signal was about to expire and got rekindled, extend by 1 hour
    IF sig.rekindle_count > 0 AND sig.expires_at < now() + interval '30 minutes' AND sig.expires_at > now() THEN
      new_expiry := GREATEST(new_expiry, now() + interval '1 hour');
    END IF;

    IF new_level != sig.heat_level OR new_expiry != sig.expires_at THEN
      UPDATE signals SET heat_level = new_level, expires_at = new_expiry WHERE id = sig.id;
    END IF;
  END LOOP;
END;
$function$;

-- Trigger to update engagement timestamp on rekindle
CREATE OR REPLACE TRIGGER on_rekindle_engagement
  AFTER INSERT ON public.rekindles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_signal_engagement();