
-- Fan a flare to another ember
CREATE TABLE public.fans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_id uuid NOT NULL REFERENCES public.signals(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  recipient_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(signal_id, sender_id, recipient_id)
);

ALTER TABLE public.fans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can fan flares" ON public.fans
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id AND sender_id != recipient_id);

CREATE POLICY "Users can view fans they sent or received" ON public.fans
  FOR SELECT TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- Update notifications policy to allow 'fan' type
DROP POLICY IF EXISTS "Users can create notifications for valid interactions" ON public.notifications;

CREATE POLICY "Users can create notifications for valid interactions" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (
    (auth.uid() = from_user_id) AND (
      ((type = 'stitch') AND (signal_id IS NOT NULL) AND (EXISTS (SELECT 1 FROM signals s WHERE s.id = notifications.signal_id AND s.user_id = notifications.user_id)))
      OR ((type = 'follow') AND (EXISTS (SELECT 1 FROM follows f WHERE f.follower_id = notifications.from_user_id AND f.following_id = notifications.user_id)))
      OR ((type = 'felt') AND (signal_id IS NOT NULL) AND (EXISTS (SELECT 1 FROM signals s WHERE s.id = notifications.signal_id AND s.user_id = notifications.user_id)))
      OR ((type = 'refuel') AND (EXISTS (SELECT 1 FROM follows f WHERE f.follower_id = notifications.from_user_id AND f.following_id = notifications.user_id)))
      OR ((type = 'fan') AND (signal_id IS NOT NULL) AND (EXISTS (SELECT 1 FROM fans fan WHERE fan.signal_id = notifications.signal_id AND fan.sender_id = notifications.from_user_id AND fan.recipient_id = notifications.user_id)))
    )
  );

-- Enable realtime for fans table so fanned flares appear immediately
ALTER PUBLICATION supabase_realtime ADD TABLE public.fans;
