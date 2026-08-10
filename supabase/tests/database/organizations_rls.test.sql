-- =============================================================================
-- organizations / organization_members / organization_invites RLS tests.
-- Verifies: creator auto-becomes owner (20260807000001 trigger), member-only
-- reads, owner/admin-only writes, by-token invite reads.
--
-- Fixtures (auth.users rows) are inserted as the connection role (postgres,
-- superuser → RLS bypassed) because organization_members.user_id and
-- organization_invites.invited_by have FKs to auth.users(id).
-- =============================================================================

BEGIN;

SELECT plan(17);

-- =============================================================================
-- Fixtures: auth.users rows for owner, member, outsider
-- =============================================================================
INSERT INTO auth.users (id, email, encrypted_password, raw_app_meta_data, raw_user_meta_data, aud, role, email_confirmed_at, created_at, updated_at)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'owner@example.com', 'x', '{}', '{}', 'authenticated', 'authenticated', now(), now(), now()),
  ('22222222-2222-2222-2222-222222222222', 'member@example.com', 'x', '{}', '{}', 'authenticated', 'authenticated', now(), now(), now()),
  ('33333333-3333-3333-3333-333333333333', 'outsider@example.com', 'x', '{}', '{}', 'authenticated', 'authenticated', now(), now(), now());

-- =============================================================================
-- Test 1: Creator creates an org → trigger auto-adds them as active owner
-- =============================================================================
SELECT set_config('role', 'authenticated', false);
SELECT set_config('request.jwt.claims', '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}', false);

INSERT INTO public.organizations (id, name, slug)
VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Test Org', 'test-org');

SELECT is(
  (SELECT count(*)::int FROM public.organization_members
   WHERE organization_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
     AND user_id = '11111111-1111-1111-1111-111111111111'
     AND role = 'owner' AND status = 'active'),
  1,
  'creator is auto-added as active owner member'
);

-- =============================================================================
-- Test 2: Owner can view their organization
-- =============================================================================
SELECT is(
  (SELECT count(*)::int FROM public.organizations WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  1,
  'owner can view their organization'
);

-- =============================================================================
-- Test 3: Anon cannot see organizations
-- =============================================================================
SELECT set_config('role', 'anon', false);
SELECT set_config('request.jwt.claims', '{}', false);

SELECT is(
  (SELECT count(*)::int FROM public.organizations),
  0,
  'anon cannot see organizations'
);

-- =============================================================================
-- Test 4: Anon cannot see organization_members
-- =============================================================================
SELECT is(
  (SELECT count(*)::int FROM public.organization_members),
  0,
  'anon cannot see organization_members'
);

-- =============================================================================
-- Test 5: Outsider cannot view the organization
-- =============================================================================
SELECT set_config('role', 'authenticated', false);
SELECT set_config('request.jwt.claims', '{"sub": "33333333-3333-3333-3333-333333333333", "role": "authenticated"}', false);

SELECT is(
  (SELECT count(*)::int FROM public.organizations WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  0,
  'non-member cannot view organization'
);

-- =============================================================================
-- Test 6: Outsider cannot update the organization (USING filter → 0 rows)
-- =============================================================================
UPDATE public.organizations SET name = 'Hacked' WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

SELECT set_config('request.jwt.claims', '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}', false);

SELECT is(
  (SELECT name FROM public.organizations WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  'Test Org',
  'non-member update had no effect'
);

-- =============================================================================
-- Test 7: Owner can update their organization
-- =============================================================================
UPDATE public.organizations SET name = 'Renamed Org' WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

SELECT is(
  (SELECT name FROM public.organizations WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  'Renamed Org',
  'owner can update their organization'
);

-- =============================================================================
-- Test 8: Owner can add a member
-- =============================================================================
INSERT INTO public.organization_members (organization_id, user_id, role, status)
VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'member', 'active');

SELECT is(
  (SELECT count(*)::int FROM public.organization_members
   WHERE organization_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  2,
  'owner can add a member (now 2 members)'
);

-- =============================================================================
-- Test 9: New member can view the organization
-- =============================================================================
SELECT set_config('request.jwt.claims', '{"sub": "22222222-2222-2222-2222-222222222222", "role": "authenticated"}', false);

SELECT is(
  (SELECT count(*)::int FROM public.organizations WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  1,
  'member can view their organization'
);

-- =============================================================================
-- Test 10: Member can view other members of the org
-- =============================================================================
SELECT is(
  (SELECT count(*)::int FROM public.organization_members
   WHERE organization_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  2,
  'member can view organization members'
);

-- =============================================================================
-- Test 11: Member cannot add another member (RLS violation)
-- =============================================================================
SELECT throws_ok(
  $$INSERT INTO public.organization_members (organization_id, user_id, role, status)
    VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333', 'member', 'active')$$,
  '42501',
  NULL,
  'member cannot add another member'
);

-- =============================================================================
-- Test 12: Outsider cannot view organization_members
-- =============================================================================
SELECT set_config('request.jwt.claims', '{"sub": "33333333-3333-3333-3333-333333333333", "role": "authenticated"}', false);

SELECT is(
  (SELECT count(*)::int FROM public.organization_members),
  0,
  'outsider cannot view organization_members'
);

-- =============================================================================
-- Test 13: Owner can create an invite
-- =============================================================================
SELECT set_config('request.jwt.claims', '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}', false);

INSERT INTO public.organization_invites (organization_id, email, role, invited_by, token, expires_at)
VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'invitee@example.com', 'member', '11111111-1111-1111-1111-111111111111', 'tok-invite-123', now() + interval '1 day');

SELECT is(
  (SELECT count(*)::int FROM public.organization_invites WHERE token = 'tok-invite-123'),
  1,
  'owner can create an invite'
);

-- =============================================================================
-- Test 14: Member cannot create an invite (RLS violation)
-- =============================================================================
SELECT set_config('request.jwt.claims', '{"sub": "22222222-2222-2222-2222-222222222222", "role": "authenticated"}', false);

SELECT throws_ok(
  $$INSERT INTO public.organization_invites (organization_id, email, role, invited_by, token, expires_at)
    VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'x@example.com', 'member', '11111111-1111-1111-1111-111111111111', 'tok-invite-999', now() + interval '1 day')$$,
  '42501',
  NULL,
  'member cannot create an invite'
);

-- =============================================================================
-- Test 15: Anyone with a valid token can view the invite (acceptance flow)
-- =============================================================================
SELECT set_config('role', 'anon', false);
SELECT set_config('request.jwt.claims', '{}', false);

SELECT is(
  (SELECT count(*)::int FROM public.organization_invites WHERE token = 'tok-invite-123'),
  1,
  'anon can view invite by token'
);

-- =============================================================================
-- Test 16: Owner can update the invite (e.g. promote role)
-- =============================================================================
SELECT set_config('role', 'authenticated', false);
SELECT set_config('request.jwt.claims', '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}', false);

UPDATE public.organization_invites SET role = 'admin' WHERE token = 'tok-invite-123';

SELECT is(
  (SELECT role FROM public.organization_invites WHERE token = 'tok-invite-123'),
  'admin',
  'owner can update invite'
);

-- =============================================================================
-- Test 17: Member cannot update the invite (USING filter → 0 rows)
-- =============================================================================
SELECT set_config('request.jwt.claims', '{"sub": "22222222-2222-2222-2222-222222222222", "role": "authenticated"}', false);

UPDATE public.organization_invites SET role = 'viewer' WHERE token = 'tok-invite-123';

SELECT set_config('request.jwt.claims', '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}', false);

SELECT is(
  (SELECT role FROM public.organization_invites WHERE token = 'tok-invite-123'),
  'admin',
  'member update of invite had no effect'
);

RESET ROLE;

SELECT * FROM finish();

ROLLBACK;
