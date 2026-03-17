
-- Create test auth users and their profiles will be created by the handle_new_user trigger
-- Using fixed UUIDs for predictability

INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, raw_app_meta_data, raw_user_meta_data)
VALUES
  ('a1111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'luna@test.ember', crypt('testpass123', gen_salt('bf')), now(), now(), now(), '', '{"provider":"email","providers":["email"]}', '{"display_name":"Luna Blaze"}'),
  ('a2222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'kai@test.ember', crypt('testpass123', gen_salt('bf')), now(), now(), now(), '', '{"provider":"email","providers":["email"]}', '{"display_name":"Kai Flicker"}'),
  ('a3333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'nova@test.ember', crypt('testpass123', gen_salt('bf')), now(), now(), now(), '', '{"provider":"email","providers":["email"]}', '{"display_name":"Nova Spark"}'),
  ('a4444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ren@test.ember', crypt('testpass123', gen_salt('bf')), now(), now(), now(), '', '{"provider":"email","providers":["email"]}', '{"display_name":"Ren Ashwood"}'),
  ('a5555555-5555-5555-5555-555555555555', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'soleil@test.ember', crypt('testpass123', gen_salt('bf')), now(), now(), now(), '', '{"provider":"email","providers":["email"]}', '{"display_name":"Soleil Ray"}');

-- Also insert identities so they can actually log in
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
VALUES
  ('a1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', '{"sub":"a1111111-1111-1111-1111-111111111111","email":"luna@test.ember"}', 'email', 'a1111111-1111-1111-1111-111111111111', now(), now(), now()),
  ('a2222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-222222222222', '{"sub":"a2222222-2222-2222-2222-222222222222","email":"kai@test.ember"}', 'email', 'a2222222-2222-2222-2222-222222222222', now(), now(), now()),
  ('a3333333-3333-3333-3333-333333333333', 'a3333333-3333-3333-3333-333333333333', '{"sub":"a3333333-3333-3333-3333-333333333333","email":"nova@test.ember"}', 'email', 'a3333333-3333-3333-3333-333333333333', now(), now(), now()),
  ('a4444444-4444-4444-4444-444444444444', 'a4444444-4444-4444-4444-444444444444', '{"sub":"a4444444-4444-4444-4444-444444444444","email":"ren@test.ember"}', 'email', 'a4444444-4444-4444-4444-444444444444', now(), now(), now()),
  ('a5555555-5555-5555-5555-555555555555', 'a5555555-5555-5555-5555-555555555555', '{"sub":"a5555555-5555-5555-5555-555555555555","email":"soleil@test.ember"}', 'email', 'a5555555-5555-5555-5555-555555555555', now(), now(), now());
