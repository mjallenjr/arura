
-- FIX: Notification RLS policy had s.user_id = s.user_id (always true) instead of s.user_id = notifications.user_id
DROP POLICY IF EXISTS "Users can create notifications for valid interactions" ON public.notifications;

CREATE POLICY "Users can create notifications for valid interactions"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = from_user_id
    AND (
      (type = 'stitch' AND signal_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM signals s WHERE s.id = notifications.signal_id AND s.user_id = notifications.user_id
      ))
      OR (type = 'follow' AND EXISTS (
        SELECT 1 FROM follows f WHERE f.follower_id = notifications.from_user_id AND f.following_id = notifications.user_id
      ))
      OR (type = 'felt' AND signal_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM signals s WHERE s.id = notifications.signal_id AND s.user_id = notifications.user_id
      ))
    )
  );
