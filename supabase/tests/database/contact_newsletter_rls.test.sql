-- =============================================================================
-- contact_submissions & newsletter_subscriptions RLS policy tests.
-- Verifies: anyone can insert, only admins can read, subscribers can update own.
--
-- Fixtures (auth.users rows) are inserted as the connection role (postgres,
-- superuser → RLS bypassed) because the admin read policy queries auth.users
-- and the "update own" policy matches the subscriber email to auth.users.email.
-- =============================================================================

BEGIN;

SELECT plan(7);

-- =============================================================================
-- Fixtures: admin + regular user in auth.users
-- =============================================================================
INSERT INTO auth.users (id, email, encrypted_password, raw_app_meta_data, raw_user_meta_data, aud, role, email_confirmed_at, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'admin@example.com',
  'x',
  '{}',
  '{"role": "admin"}',
  'authenticated',
  'authenticated',
  now(), now(), now()
);

INSERT INTO auth.users (id, email, encrypted_password, raw_app_meta_data, raw_user_meta_data, aud, role, email_confirmed_at, created_at, updated_at)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  'user@example.com',
  'x',
  '{}',
  '{"role": "user"}',
  'authenticated',
  'authenticated',
  now(), now(), now()
);

-- =============================================================================
-- contact_submissions
-- =============================================================================
-- Test 1: Anyone (anon) can submit a contact form
SELECT set_config('role', 'anon', false);
SELECT set_config('request.jwt.claims', '{}', false);

INSERT INTO public.contact_submissions (name, email, subject, message, created_at)
VALUES ('Test User', 'test@example.com', 'Test Subject', 'Hello', now());

SELECT is(
  (SELECT count(*)::int FROM public.contact_submissions WHERE email = 'test@example.com'),
  1,
  'anon can insert contact_submissions'
);

-- Test 2: Anon cannot read contact submissions
SELECT is(
  (SELECT count(*)::int FROM public.contact_submissions),
  0,
  'anon cannot read contact_submissions'
);

-- Test 3: Admin role can read contact submissions
SELECT set_config('role', 'authenticated', false);
SELECT set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-000000000001", "role": "authenticated"}', false);

SELECT is(
  (SELECT count(*)::int FROM public.contact_submissions),
  1,
  'admin can read contact_submissions'
);

-- =============================================================================
-- newsletter_subscriptions
-- =============================================================================
-- Test 4: Anyone can subscribe
SELECT set_config('role', 'anon', false);
SELECT set_config('request.jwt.claims', '{}', false);

INSERT INTO public.newsletter_subscriptions (email, status, created_at)
VALUES ('user@example.com', 'subscribed', now());

SELECT is(
  (SELECT count(*)::int FROM public.newsletter_subscriptions WHERE email = 'user@example.com'),
  1,
  'anon can insert newsletter_subscriptions'
);

-- Test 5: Anon cannot read newsletter list
SELECT is(
  (SELECT count(*)::int FROM public.newsletter_subscriptions),
  0,
  'anon cannot read newsletter_subscriptions list'
);

-- =============================================================================
-- Test 6: Subscriber can update own subscription (unsubscribe)
SELECT set_config('role', 'authenticated', false);
SELECT set_config('request.jwt.claims', '{"sub": "22222222-2222-2222-2222-222222222222", "role": "authenticated"}', false);

UPDATE public.newsletter_subscriptions
SET status = 'unsubscribed', unsubscribed_at = now()
WHERE email = 'user@example.com';

SELECT is(
  (SELECT status FROM public.newsletter_subscriptions WHERE email = 'user@example.com'),
  'unsubscribed',
  'subscriber can update own subscription (unsubscribe)'
);

-- Test 7: User cannot update someone else's subscription
-- (0 rows updated — USING clause matches email to auth.users.email)
UPDATE public.newsletter_subscriptions
SET status = 'unsubscribed'
WHERE email = 'admin@example.com';

SELECT is(
  (SELECT count(*)::int FROM public.newsletter_subscriptions
   WHERE email = 'admin@example.com' AND status = 'subscribed'),
  1,
  'user cannot update another subscription'
);

RESET ROLE;

SELECT * FROM finish();

ROLLBACK;
