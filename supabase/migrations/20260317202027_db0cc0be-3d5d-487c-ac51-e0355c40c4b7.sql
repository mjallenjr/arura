
-- Table to track interest search terms and their popularity
CREATE TABLE public.interest_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  term text NOT NULL UNIQUE,
  search_count bigint NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.interest_searches ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read search terms
CREATE POLICY "Authenticated users can view interest searches"
  ON public.interest_searches FOR SELECT
  TO authenticated
  USING (true);

-- Anyone authenticated can insert (upsert handled in code)
CREATE POLICY "Authenticated users can insert interest searches"
  ON public.interest_searches FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Anyone authenticated can update count
CREATE POLICY "Authenticated users can update search count"
  ON public.interest_searches FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
