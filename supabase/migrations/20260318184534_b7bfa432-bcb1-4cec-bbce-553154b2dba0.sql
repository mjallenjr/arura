
-- Bulk check mutual follows for a list of user IDs
CREATE OR REPLACE FUNCTION public.get_mutual_follow_ids(p_user_id uuid, p_candidate_ids uuid[])
RETURNS uuid[]
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT ARRAY_AGG(f1.following_id)
  FROM follows f1
  JOIN follows f2 ON f2.follower_id = f1.following_id AND f2.following_id = f1.follower_id
  WHERE f1.follower_id = p_user_id
    AND f1.following_id = ANY(p_candidate_ids)
$$;
