
-- Fix the security definer view issue: use security_invoker
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles
WITH (security_invoker = true)
AS SELECT user_id, display_name, avatar_url, bio_word, interests, qr_code, referral_code, created_at
FROM public.profiles;

GRANT SELECT ON public.public_profiles TO anon, authenticated;
