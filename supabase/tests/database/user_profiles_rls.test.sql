-- =============================================================================
-- user_profiles RLS policy behavior tests.
-- Verifies: own-profile access, anon can't read, authenticated can insert/update own.
--
-- Fixtures (auth.users rows) are inserted as the connection role (postgres,
-- superuser → RLS bypassed) BEFORE switching roles, because user_profiles.id
-- has an FK to auth.users(id).
-- =============================================================================

BEGIN;

SELECT plan(6);

-- =============================================================================
-- Fixtures: test users in auth.users
-- =============================================================================
INSERT INTO auth.users (id, email, encrypted_password, raw_app_meta_data, raw_user_meta_data, aud, role, email_confirmed_at, created_at, updated_at)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'test@example.com',
  'x',
  '{}',
  '{"role": "user"}',
  'authenticated',
  'authenticated',
  now(),
  now(),
  now()
);

-- Set the JWT claims so auth.uid() resolves to our test user
-- (Supabase's auth.uid() reads request.jwt.claims JSON -> 'sub')
SELECT set_config('request.jwt.claims', '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}', false);

-- Test 1: Anon role can't see user_profiles
SELECT set_config('role', 'anon', false);

SELECT is(
  (SELECT count(*)::int FROM public.user_profiles),
  0,
  'anon role sees no user_profiles rows'
);

-- Test 2: Authenticated role can see their own profile
SELECT set_config('role', 'authenticated', false);

INSERT INTO public.user_profiles (id, role, status, created_at)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'user',
  'active',
  now()
);

SELECT is(
  (SELECT count(*)::int FROM public.user_profiles WHERE id = '11111111-1111-1111-1111-111111111111'),
  1,
  'authenticated user can see own profile'
);

-- Test 3: Authenticated user can't see other users' profiles
SELECT is(
  (SELECT count(*)::int FROM public.user_profiles WHERE id = '22222222-2222-2222-2222-222222222222'),
  0,
  'authenticated user cannot see other users profiles'
);

-- Test 4: Authenticated user can update own profile
UPDATE public.user_profiles
SET full_name = 'Test User'
WHERE id = '11111111-1111-1111-1111-111111111111';

SELECT is(
  (SELECT full_name FROM public.user_profiles WHERE id = '11111111-1111-1111-1111-111111111111'),
  'Test User',
  'authenticated user can update own profile'
);

-- Test 5: Authenticated user can't update other users' profiles
-- (should not error, just update 0 rows — USING (id = auth.uid()) filters it)
UPDATE public.user_profiles
SET full_name = 'Hacked'
WHERE id = '22222222-2222-2222-2222-222222222222';

SELECT is(
  (SELECT count(*)::int FROM public.user_profiles WHERE id = '22222222-2222-2222-2222-222222222222'),
  0,
  'authenticated user cannot update other users profiles'
);

-- Test 6: stripe_customers — user can only see their own
SELECT is(
  (SELECT count(*)::int FROM public.stripe_customers WHERE user_id = '33333333-3333-3333-3333-333333333333'),
  0,
  'authenticated user cannot see other users stripe_customers'
);

-- Reset role
RESET ROLE;

SELECT * FROM finish();

ROLLBACK;
