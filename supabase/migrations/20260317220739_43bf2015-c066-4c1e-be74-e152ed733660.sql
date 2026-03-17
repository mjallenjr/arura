
-- FIX: Add "refuel" type to notification insert policy so refuel notifications actually work
DROP POLICY IF EXISTS "Users can create notifications for valid interactions" ON public.notifications;

CREATE POLICY "Users can create notifications for valid interactions"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = from_user_id
    AND (
      -- Stitch notification
      (type = 'stitch' AND signal_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM signals s WHERE s.id = notifications.signal_id AND s.user_id = notifications.user_id
      ))
      -- Follow notification
      OR (type = 'follow' AND EXISTS (
        SELECT 1 FROM follows f WHERE f.follower_id = notifications.from_user_id AND f.following_id = notifications.user_id
      ))
      -- Felt notification
      OR (type = 'felt' AND signal_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM signals s WHERE s.id = notifications.signal_id AND s.user_id = notifications.user_id
      ))
      -- Refuel notification: sender must be following the recipient
      OR (type = 'refuel' AND EXISTS (
        SELECT 1 FROM follows f WHERE f.follower_id = notifications.from_user_id AND f.following_id = notifications.user_id
      ))
    )
  );

-- Create a view that hides phone/email from public profile queries
-- Actually, better to use a security definer function to strip phone
-- For now, the SELECT policy already returns all columns. Let's create a view:
CREATE OR REPLACE VIEW public.public_profiles AS
  SELECT user_id, display_name, avatar_url, bio_word, interests, qr_code, referral_code, created_at
  FROM public.profiles;
