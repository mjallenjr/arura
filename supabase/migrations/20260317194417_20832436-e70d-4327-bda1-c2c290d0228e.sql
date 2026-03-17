
-- Create test users in auth.users so profiles FK is satisfied
-- These are fake users for testing only
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, aud, role)
VALUES
  ('c1111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'aria@test.local', crypt('testpass123', gen_salt('bf')), now(), now(), now(), 'authenticated', 'authenticated'),
  ('c2222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'blaze@test.local', crypt('testpass123', gen_salt('bf')), now(), now(), now(), 'authenticated', 'authenticated'),
  ('c3333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000000', 'celeste@test.local', crypt('testpass123', gen_salt('bf')), now(), now(), now(), 'authenticated', 'authenticated'),
  ('c4444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000000', 'dante@test.local', crypt('testpass123', gen_salt('bf')), now(), now(), now(), 'authenticated', 'authenticated'),
  ('c5555555-5555-5555-5555-555555555555', '00000000-0000-0000-0000-000000000000', 'echo@test.local', crypt('testpass123', gen_salt('bf')), now(), now(), now(), 'authenticated', 'authenticated'),
  ('c6666666-6666-6666-6666-666666666666', '00000000-0000-0000-0000-000000000000', 'fern@test.local', crypt('testpass123', gen_salt('bf')), now(), now(), now(), 'authenticated', 'authenticated'),
  ('c7777777-7777-7777-7777-777777777777', '00000000-0000-0000-0000-000000000000', 'gemma@test.local', crypt('testpass123', gen_salt('bf')), now(), now(), now(), 'authenticated', 'authenticated'),
  ('c8888888-8888-8888-8888-888888888888', '00000000-0000-0000-0000-000000000000', 'hawk@test.local', crypt('testpass123', gen_salt('bf')), now(), now(), now(), 'authenticated', 'authenticated'),
  ('c9999999-9999-9999-9999-999999999999', '00000000-0000-0000-0000-000000000000', 'iris@test.local', crypt('testpass123', gen_salt('bf')), now(), now(), now(), 'authenticated', 'authenticated'),
  ('ca111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'jasper@test.local', crypt('testpass123', gen_salt('bf')), now(), now(), now(), 'authenticated', 'authenticated'),
  ('cb222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'kira@test.local', crypt('testpass123', gen_salt('bf')), now(), now(), now(), 'authenticated', 'authenticated'),
  ('cc333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000222222222', 'leo@test.local', crypt('testpass123', gen_salt('bf')), now(), now(), now(), 'authenticated', 'authenticated'),
  ('cd444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000000', 'mira@test.local', crypt('testpass123', gen_salt('bf')), now(), now(), now(), 'authenticated', 'authenticated'),
  ('ce555555-5555-5555-5555-555555555555', '00000000-0000-0000-0000-000000000000', 'nyx@test.local', crypt('testpass123', gen_salt('bf')), now(), now(), now(), 'authenticated', 'authenticated'),
  ('cf666666-6666-6666-6666-666666666666', '00000000-0000-0000-0000-000000000000', 'orion@test.local', crypt('testpass123', gen_salt('bf')), now(), now(), now(), 'authenticated', 'authenticated')
ON CONFLICT (id) DO NOTHING;

-- Create profiles for all test users (trigger may handle this, but ensure they exist)
INSERT INTO public.profiles (user_id, display_name, phone) VALUES
  ('c1111111-1111-1111-1111-111111111111', 'Aria Moonveil', '+15551001001'),
  ('c2222222-2222-2222-2222-222222222222', 'Blaze Thornton', '+15551001002'),
  ('c3333333-3333-3333-3333-333333333333', 'Celeste Duskfire', '+15551001003'),
  ('c4444444-4444-4444-4444-444444444444', 'Dante Emberheart', '+15551001004'),
  ('c5555555-5555-5555-5555-555555555555', 'Echo Nightshade', '+15551001005'),
  ('c6666666-6666-6666-6666-666666666666', 'Fern Wildglow', '+15551001006'),
  ('c7777777-7777-7777-7777-777777777777', 'Gemma Starfall', '+15551001007'),
  ('c8888888-8888-8888-8888-888888888888', 'Hawk Cindervale', '+15551001008'),
  ('c9999999-9999-9999-9999-999999999999', 'Iris Flamecrest', '+15551001009'),
  ('ca111111-1111-1111-1111-111111111111', 'Jasper Dawnlight', '+15551001010'),
  ('cb222222-2222-2222-2222-222222222222', 'Kira Sunweaver', '+15551001011'),
  ('cc333333-3333-3333-3333-333333333333', 'Leo Ashcroft', '+15551001012'),
  ('cd444444-4444-4444-4444-444444444444', 'Mira Emberglass', '+15551001013'),
  ('ce555555-5555-5555-5555-555555555555', 'Nyx Shadowflame', '+15551001014'),
  ('cf666666-6666-6666-6666-666666666666', 'Orion Blazetrail', '+15551001015')
ON CONFLICT (user_id) DO NOTHING;
