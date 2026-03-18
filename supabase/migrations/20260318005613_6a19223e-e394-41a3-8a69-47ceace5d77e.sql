
-- Update the handle_new_user function to include default interests
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, phone, interests)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', split_part(NEW.email, '@', 1)),
    NEW.phone,
    ARRAY['fly fishing']
  );
  RETURN NEW;
END;
$$;

-- Also update existing profiles that have no interests to include fly fishing
UPDATE public.profiles
SET interests = ARRAY['fly fishing']
WHERE interests IS NULL OR interests = '{}';
