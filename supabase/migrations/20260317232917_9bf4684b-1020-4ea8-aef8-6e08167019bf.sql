
-- VAPID key storage for web push (single row)
CREATE TABLE public.push_vapid_keys (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  public_key TEXT NOT NULL,
  private_key TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.push_vapid_keys ENABLE ROW LEVEL SECURITY;

-- Only service role can access VAPID keys
CREATE POLICY "Service role only for vapid keys"
  ON public.push_vapid_keys FOR ALL TO service_role
  USING (true) WITH CHECK (true);
