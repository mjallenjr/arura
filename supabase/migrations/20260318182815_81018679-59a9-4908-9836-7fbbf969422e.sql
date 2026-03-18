
CREATE OR REPLACE FUNCTION public.update_seed_heat_scores()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE seed_content sc
  SET heat_score = COALESCE(stats.score, 0)
  FROM (
    SELECT
      seed_content_id,
      (COUNT(*) FILTER (WHERE felt = true)) * 3
      + (COUNT(*) FILTER (WHERE stitched = true)) * 8
      + COUNT(*) AS score
    FROM seed_content_views
    GROUP BY seed_content_id
  ) stats
  WHERE sc.id = stats.seed_content_id
    AND sc.heat_score IS DISTINCT FROM COALESCE(stats.score, 0);
END;
$$;
