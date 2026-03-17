
-- 1. Lock down profiles: only the owner can see their own full row (including phone)
DROP POLICY IF EXISTS "Users can view public profile data" ON public.profiles;

-- Owner sees everything
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 2. Fix the public_profiles view: recreate with SECURITY INVOKER off
-- so other users can read non-sensitive profile data without seeing phone
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles AS
  SELECT user_id, display_name, avatar_url, bio_word, interests, qr_code, referral_code, created_at
  FROM public.profiles;

-- Grant select on the view to anon and authenticated
GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- 3. Fix permissive RLS: find and tighten INSERT/UPDATE/DELETE policies that use true
-- Check advertiser_leads - public insert is OK for lead gen form
-- Check interest_searches - should already use the function

-- 4. Add a SELECT policy so public_profiles view works (it needs to bypass profile RLS)
-- We need a security definer function to serve public profiles
CREATE OR REPLACE FUNCTION public.get_public_profile(p_user_id uuid)
RETURNS TABLE(
  user_id uuid,
  display_name text,
  avatar_url text,
  bio_word text,
  interests text[],
  qr_code text,
  referral_code text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.user_id, p.display_name, p.avatar_url, p.bio_word, p.interests, p.qr_code, p.referral_code, p.created_at
  FROM public.profiles p
  WHERE p.user_id = p_user_id;
$$;

-- 5. Create a broader function for searching profiles by name (without exposing phone)
CREATE OR REPLACE FUNCTION public.search_profiles(search_term text, requesting_user_id uuid)
RETURNS TABLE(
  user_id uuid,
  display_name text,
  avatar_url text,
  qr_code text,
  interests text[]
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.user_id, p.display_name, p.avatar_url, p.qr_code, p.interests
  FROM public.profiles p
  WHERE p.user_id != requesting_user_id
    AND p.display_name ILIKE '%' || search_term || '%'
  LIMIT 20;
$$;

-- 6. Function to get profiles by user_ids (for resolving names without exposing phone)
CREATE OR REPLACE FUNCTION public.get_profiles_by_ids(p_user_ids uuid[])
RETURNS TABLE(
  user_id uuid,
  display_name text,
  avatar_url text,
  qr_code text,
  interests text[]
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.user_id, p.display_name, p.avatar_url, p.qr_code, p.interests
  FROM public.profiles p
  WHERE p.user_id = ANY(p_user_ids);
$$;
