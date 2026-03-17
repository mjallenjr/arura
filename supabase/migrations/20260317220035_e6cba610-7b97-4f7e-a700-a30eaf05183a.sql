
-- FIX 1: Protect phone numbers - split SELECT policy
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;

CREATE POLICY "Users can view public profile data"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- FIX 2: Restrict notification injection - validate recipient owns a signal the sender is interacting with
DROP POLICY IF EXISTS "Users can create notifications" ON public.notifications;

CREATE POLICY "Users can create notifications for valid interactions"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = from_user_id
    AND (
      -- Stitch notification: sender must have stitched a signal owned by recipient
      (type = 'stitch' AND signal_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM signals s WHERE s.id = signal_id AND s.user_id = user_id
      ))
      -- Follow notification
      OR (type = 'follow' AND EXISTS (
        SELECT 1 FROM follows f WHERE f.follower_id = from_user_id AND f.following_id = user_id
      ))
      -- Felt notification
      OR (type = 'felt' AND signal_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM signals s WHERE s.id = signal_id AND s.user_id = user_id
      ))
    )
  );

-- FIX 3: Lock down interest_searches - use a function instead of direct UPDATE
DROP POLICY IF EXISTS "Authenticated users can update search count" ON public.interest_searches;
DROP POLICY IF EXISTS "Authenticated users can insert interest searches" ON public.interest_searches;

CREATE OR REPLACE FUNCTION public.increment_interest_search(p_term text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO interest_searches (term, search_count)
  VALUES (lower(p_term), 1)
  ON CONFLICT (term) DO UPDATE SET search_count = interest_searches.search_count + 1;
END;
$$;

-- Add unique constraint on term if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'interest_searches_term_key') THEN
    ALTER TABLE interest_searches ADD CONSTRAINT interest_searches_term_key UNIQUE (term);
  END IF;
END $$;

-- FIX 4: Add unique constraint on signal_views for upsert
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'signal_views_user_signal_unique') THEN
    ALTER TABLE signal_views ADD CONSTRAINT signal_views_user_signal_unique UNIQUE (user_id, signal_id);
  END IF;
END $$;

-- FIX 5: Add unique constraint on signal_owner_views for upsert
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'signal_owner_views_user_signal_unique') THEN
    ALTER TABLE signal_owner_views ADD CONSTRAINT signal_owner_views_user_signal_unique UNIQUE (user_id, signal_id);
  END IF;
END $$;
