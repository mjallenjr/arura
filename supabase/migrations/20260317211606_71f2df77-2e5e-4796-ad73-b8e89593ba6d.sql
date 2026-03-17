
DROP POLICY "Users can send DMs" ON public.direct_messages;

CREATE POLICY "Users can send DMs" ON public.direct_messages
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = sender_id
  AND (
    -- Original: receiver follows sender
    EXISTS (
      SELECT 1 FROM follows
      WHERE follows.follower_id = direct_messages.receiver_id
        AND follows.following_id = direct_messages.sender_id
    )
    -- New: or there's an existing message from receiver to sender (reply)
    OR EXISTS (
      SELECT 1 FROM direct_messages dm
      WHERE dm.sender_id = direct_messages.receiver_id
        AND dm.receiver_id = direct_messages.sender_id
    )
  )
);
