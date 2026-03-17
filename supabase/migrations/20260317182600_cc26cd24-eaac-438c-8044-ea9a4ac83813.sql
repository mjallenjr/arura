
-- DM table: one-word messages between a user and their followers
CREATE TABLE public.direct_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id uuid NOT NULL,
  receiver_id uuid NOT NULL,
  word text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  read_at timestamp with time zone DEFAULT null
);

ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

-- Sender can insert DMs only to their followers
CREATE POLICY "Users can send DMs" ON public.direct_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM follows WHERE follower_id = receiver_id AND following_id = sender_id
    )
  );

-- Both sender and receiver can read their DMs
CREATE POLICY "Users can read their DMs" ON public.direct_messages
  FOR SELECT TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Receiver can mark DMs as read
CREATE POLICY "Receiver can update read status" ON public.direct_messages
  FOR UPDATE TO authenticated
  USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id);

-- Track when user has viewed their own signal (for re-view restriction)
CREATE TABLE public.signal_owner_views (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  signal_id uuid NOT NULL REFERENCES public.signals(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(signal_id, user_id)
);

ALTER TABLE public.signal_owner_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own signal views" ON public.signal_owner_views
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own signal views" ON public.signal_owner_views
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Enable realtime for DMs
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;
