
-- The public_profiles view with security_invoker=true won't work because 
-- the underlying profiles RLS now restricts SELECT to owner only.
-- We INTENTIONALLY use a security definer view here because it only 
-- exposes non-sensitive columns (no phone, no id).
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles AS
  SELECT user_id, display_name, avatar_url, bio_word, interests, qr_code, referral_code, created_at
  FROM public.profiles;

GRANT SELECT ON public.public_profiles TO anon, authenticated;
