
-- Advertiser leads (self-serve signup)
CREATE TABLE public.advertiser_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  contact_email text NOT NULL,
  website text,
  budget_range text NOT NULL DEFAULT 'starter',
  message text,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.advertiser_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit advertiser lead"
  ON public.advertiser_leads FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view leads"
  ON public.advertiser_leads FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update leads"
  ON public.advertiser_leads FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Referral system
CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL,
  referred_id uuid NOT NULL,
  code text NOT NULL,
  rewarded boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(referred_id)
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own referrals"
  ON public.referrals FOR SELECT
  TO authenticated
  USING (referrer_id = auth.uid() OR referred_id = auth.uid());

CREATE POLICY "Authenticated can insert referral"
  ON public.referrals FOR INSERT
  TO authenticated
  WITH CHECK (referred_id = auth.uid());

-- Add referral_code to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code text UNIQUE DEFAULT substring(replace(gen_random_uuid()::text, '-', '') from 1 for 8);
