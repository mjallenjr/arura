-- Add stripe_connect_id to profiles for Stripe Connect accounts
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stripe_connect_id text;

-- Create creator payouts table
CREATE TABLE IF NOT EXISTS public.creator_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  stripe_transfer_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);

ALTER TABLE public.creator_payouts ENABLE ROW LEVEL SECURITY;

-- Users can view their own payouts
CREATE POLICY "Users can view own payouts"
  ON public.creator_payouts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can request payouts
CREATE POLICY "Users can request payouts"
  ON public.creator_payouts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Admins can update payout status
CREATE POLICY "Admins can update payouts"
  ON public.creator_payouts
  FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));