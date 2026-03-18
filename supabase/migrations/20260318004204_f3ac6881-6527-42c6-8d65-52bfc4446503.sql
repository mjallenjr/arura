CREATE POLICY "Authenticated users can view active signals for discovery"
ON public.signals
FOR SELECT
TO authenticated
USING (expires_at > now());