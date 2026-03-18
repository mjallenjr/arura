
-- 1. Camps table
CREATE TABLE public.camps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vibe text NOT NULL,
  name text,
  status text NOT NULL DEFAULT 'campfire',
  ranger_id uuid,
  member_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (vibe)
);

ALTER TABLE public.camps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view all camps" ON public.camps
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Service role can manage camps" ON public.camps
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 2. Camp members table
CREATE TABLE public.camp_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  camp_id uuid NOT NULL REFERENCES public.camps(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  joined_at timestamptz NOT NULL DEFAULT now(),
  contribution_score int NOT NULL DEFAULT 0,
  UNIQUE (camp_id, user_id)
);

ALTER TABLE public.camp_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view all camp members" ON public.camp_members
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can join camps" ON public.camp_members
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave camps" ON public.camp_members
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage camp members" ON public.camp_members
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 3. Camp flares table
CREATE TABLE public.camp_flares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  camp_id uuid NOT NULL REFERENCES public.camps(id) ON DELETE CASCADE,
  signal_id uuid NOT NULL REFERENCES public.signals(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.camp_flares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view camp flares" ON public.camp_flares
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.camp_members cm
      WHERE cm.camp_id = camp_flares.camp_id AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can post camp flares" ON public.camp_flares
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.camp_members cm
      WHERE cm.camp_id = camp_flares.camp_id AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage camp flares" ON public.camp_flares
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 4. Trigger to increment contribution_score on camp_flares INSERT
CREATE OR REPLACE FUNCTION public.increment_camp_contribution()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
BEGIN
  UPDATE camp_members
  SET contribution_score = contribution_score + 1
  WHERE camp_id = NEW.camp_id AND user_id = NEW.user_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_camp_flare_contribution
  AFTER INSERT ON public.camp_flares
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_camp_contribution();

-- 5. sync_camps_for_user RPC
CREATE OR REPLACE FUNCTION public.sync_camps_for_user(p_user_id uuid)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
DECLARE
  v_interest text;
  v_interests text[];
  v_camp_id uuid;
  v_count int;
  v_top_user uuid;
BEGIN
  SELECT interests INTO v_interests FROM profiles WHERE user_id = p_user_id;
  IF v_interests IS NULL THEN RETURN; END IF;

  FOREACH v_interest IN ARRAY v_interests
  LOOP
    -- Check if 5+ users share this interest
    SELECT COUNT(*) INTO v_count
    FROM profiles
    WHERE interests @> ARRAY[v_interest];

    IF v_count >= 5 THEN
      -- Upsert camp for this vibe
      INSERT INTO camps (vibe, member_count)
      VALUES (v_interest, 0)
      ON CONFLICT (vibe) DO NOTHING
      RETURNING id INTO v_camp_id;

      IF v_camp_id IS NULL THEN
        SELECT id INTO v_camp_id FROM camps WHERE vibe = v_interest;
      END IF;

      -- Add user to camp if not already member
      INSERT INTO camp_members (camp_id, user_id)
      VALUES (v_camp_id, p_user_id)
      ON CONFLICT (camp_id, user_id) DO NOTHING;

      -- Update member count
      SELECT COUNT(*) INTO v_count FROM camp_members WHERE camp_id = v_camp_id;
      UPDATE camps SET member_count = v_count WHERE id = v_camp_id;

      -- Bonfire promotion at 25 members
      IF v_count >= 25 THEN
        -- Only promote if not already bonfire
        IF (SELECT status FROM camps WHERE id = v_camp_id) = 'campfire' THEN
          SELECT user_id INTO v_top_user
          FROM camp_members
          WHERE camp_id = v_camp_id
          ORDER BY contribution_score DESC, joined_at ASC
          LIMIT 1;

          UPDATE camps
          SET status = 'bonfire', ranger_id = v_top_user
          WHERE id = v_camp_id;
        END IF;
      END IF;
    END IF;
  END LOOP;

  -- Remove user from camps whose vibe they no longer share
  DELETE FROM camp_members
  WHERE user_id = p_user_id
    AND camp_id IN (
      SELECT cm.camp_id FROM camp_members cm
      JOIN camps c ON c.id = cm.camp_id
      WHERE cm.user_id = p_user_id
        AND NOT (v_interests @> ARRAY[c.vibe])
    );

  -- Re-count after removals
  UPDATE camps c SET member_count = (
    SELECT COUNT(*) FROM camp_members cm WHERE cm.camp_id = c.id
  );
END;
$$;

-- 6. Enable realtime on camp_members
ALTER PUBLICATION supabase_realtime ADD TABLE public.camp_members;
