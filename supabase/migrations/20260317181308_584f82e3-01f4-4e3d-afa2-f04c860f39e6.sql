
-- Add stitch_word to signals for creator's stitch on drop
ALTER TABLE public.signals ADD COLUMN stitch_word text DEFAULT null;

-- Create stitches table for viewer replies
CREATE TABLE public.stitches (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  signal_id uuid NOT NULL REFERENCES public.signals(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  word text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(signal_id, user_id)
);

ALTER TABLE public.stitches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can stitch signals" ON public.stitches
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Creator can view stitches on their signals" ON public.stitches
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() OR
    signal_id IN (SELECT id FROM signals WHERE user_id = auth.uid())
  );
