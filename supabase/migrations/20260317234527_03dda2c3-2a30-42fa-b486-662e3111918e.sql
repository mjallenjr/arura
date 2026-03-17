CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Allow service_role to delete expired signals
CREATE POLICY "Service role can delete expired signals"
  ON public.signals
  FOR DELETE
  TO service_role
  USING (true);

-- Allow service_role to update signals (null out storage_path)
CREATE POLICY "Service role can update signals"
  ON public.signals
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow service_role to select all signals for cleanup
CREATE POLICY "Service role can view all signals"
  ON public.signals
  FOR SELECT
  TO service_role
  USING (true);