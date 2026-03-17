
-- Fix the security definer view warning by using SECURITY INVOKER
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles
WITH (security_invoker = true)
AS SELECT user_id, display_name, avatar_url, bio_word, interests, qr_code, referral_code, created_at
FROM public.profiles;
