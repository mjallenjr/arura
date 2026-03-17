
-- Reserve "Ember" (case-insensitive) so no other user can claim it
CREATE UNIQUE INDEX idx_profiles_reserved_ember 
ON public.profiles (lower(display_name)) 
WHERE lower(display_name) = 'ember';
