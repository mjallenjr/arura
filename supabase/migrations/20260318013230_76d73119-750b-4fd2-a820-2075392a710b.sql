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
      COALESCE(v.cnt, 0) AS view_count
    FROM signals s
    LEFT JOIN LATERAL (SELECT COUNT(*) AS cnt FROM felts WHERE signal_id = s.id) f ON true
    LEFT JOIN LATERAL (SELECT COUNT(*) AS cnt FROM stitches WHERE signal_id = s.id) st ON true
    LEFT JOIN LATERAL (SELECT COUNT(*) AS cnt FROM signal_views WHERE signal_id = s.id) v ON true
    WHERE s.expires_at > now()
  LOOP
    heat_score := sig.felt_count * 3 + sig.stitch_count * 8 + sig.view_count;
    
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

    IF new_level != sig.heat_level OR new_expiry != sig.expires_at THEN
      UPDATE signals SET heat_level = new_level, expires_at = new_expiry WHERE id = sig.id;
    END IF;
  END LOOP;
END;
$function$;