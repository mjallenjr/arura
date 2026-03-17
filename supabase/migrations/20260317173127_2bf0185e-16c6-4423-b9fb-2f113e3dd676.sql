
-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '',
  phone TEXT,
  avatar_url TEXT,
  qr_code TEXT UNIQUE DEFAULT gen_random_uuid()::text,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view profiles" ON public.profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Create follows table
CREATE TABLE public.follows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own follows" ON public.follows
  FOR SELECT TO authenticated USING (auth.uid() = follower_id OR auth.uid() = following_id);

CREATE POLICY "Users can follow others" ON public.follows
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow" ON public.follows
  FOR DELETE TO authenticated USING (auth.uid() = follower_id);

-- Create signals table (posts)
CREATE TABLE public.signals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'video' CHECK (type IN ('video', 'photo')),
  storage_path TEXT,
  song_clip_url TEXT,
  song_title TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '2 hours'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view signals from people they follow" ON public.signals
  FOR SELECT TO authenticated USING (
    user_id IN (SELECT following_id FROM public.follows WHERE follower_id = auth.uid())
    OR user_id = auth.uid()
  );

CREATE POLICY "Users can create signals" ON public.signals
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own signals" ON public.signals
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Create felt interactions table
CREATE TABLE public.felts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  signal_id UUID NOT NULL REFERENCES public.signals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(signal_id, user_id)
);

ALTER TABLE public.felts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view felts on their signals" ON public.felts
  FOR SELECT TO authenticated USING (
    user_id = auth.uid() OR
    signal_id IN (SELECT id FROM public.signals WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can felt signals" ON public.felts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', split_part(NEW.email, '@', 1)),
    NEW.phone
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Timestamp update function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for signals media
INSERT INTO storage.buckets (id, name, public) VALUES ('signals', 'signals', true);

CREATE POLICY "Anyone can view signal media" ON storage.objects
  FOR SELECT USING (bucket_id = 'signals');

CREATE POLICY "Users can upload signal media" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'signals' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own signal media" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'signals' AND auth.uid()::text = (storage.foldername(name))[1]);
