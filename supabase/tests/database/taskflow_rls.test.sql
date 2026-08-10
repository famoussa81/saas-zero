-- =============================================================================
-- projects / tasks / task_comments RLS tests (multi-tenant, org-scoped).
-- Verifies: org members can CRUD, outsiders are fully isolated.
-- =============================================================================

BEGIN;

SELECT plan(12);

-- =============================================================================
-- Fixtures (as postgres): org + owner(1111) + member(2222) + outsider(3333)
-- =============================================================================
INSERT INTO auth.users (id, email, encrypted_password, raw_app_meta_data, raw_user_meta_data, aud, role, email_confirmed_at, created_at, updated_at)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'owner@example.com', 'x', '{}', '{}', 'authenticated', 'authenticated', now(), now(), now()),
  ('22222222-2222-2222-2222-222222222222', 'member@example.com', 'x', '{}', '{}', 'authenticated', 'authenticated', now(), now(), now()),
  ('33333333-3333-3333-3333-333333333333', 'outsider@example.com', 'x', '{}', '{}', 'authenticated', 'authenticated', now(), now(), now());

INSERT INTO public.organizations (id, name, slug)
VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'TaskFlow Org', 'taskflow-org');

INSERT INTO public.organization_members (organization_id, user_id, role, status)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'owner', 'active'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'member', 'active');

-- =============================================================================
-- PROJECTS
-- =============================================================================
-- Test 1: Member can create a project
SELECT set_config('role', 'authenticated', false);
SELECT set_config('request.jwt.claims', '{"sub": "22222222-2222-2222-2222-222222222222", "role": "authenticated"}', false);

INSERT INTO public.projects (id, organization_id, name)
VALUES ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Launch');

SELECT is(
  (SELECT count(*)::int FROM public.projects WHERE id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  1,
  'member can create a project'
);

-- Test 2: Member can view projects
SELECT is(
  (SELECT count(*)::int FROM public.projects),
  1,
  'member can view projects'
);

-- Test 3: Outsider cannot view projects
SELECT set_config('request.jwt.claims', '{"sub": "33333333-3333-3333-3333-333333333333", "role": "authenticated"}', false);

SELECT is(
  (SELECT count(*)::int FROM public.projects),
  0,
  'outsider cannot view projects'
);

-- Test 4: Outsider cannot create a project (RLS violation)
SELECT throws_ok(
  $$INSERT INTO public.projects (organization_id, name)
    VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Hacked')$$,
  '42501',
  NULL,
  'outsider cannot create a project'
);

-- =============================================================================
-- TASKS
-- =============================================================================
-- Test 5: Member can create a task
SELECT set_config('request.jwt.claims', '{"sub": "22222222-2222-2222-2222-222222222222", "role": "authenticated"}', false);

INSERT INTO public.tasks (id, organization_id, project_id, title)
VALUES ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Build landing');

SELECT is(
  (SELECT count(*)::int FROM public.tasks WHERE id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'),
  1,
  'member can create a task'
);

-- Test 6: Member can view tasks
SELECT is(
  (SELECT count(*)::int FROM public.tasks),
  1,
  'member can view tasks'
);

-- Test 7: Outsider cannot view tasks
SELECT set_config('request.jwt.claims', '{"sub": "33333333-3333-3333-3333-333333333333", "role": "authenticated"}', false);

SELECT is(
  (SELECT count(*)::int FROM public.tasks),
  0,
  'outsider cannot view tasks'
);

-- =============================================================================
-- TASK COMMENTS
-- =============================================================================
-- Test 8: Member can create a comment (user_id must equal auth.uid())
SELECT set_config('request.jwt.claims', '{"sub": "22222222-2222-2222-2222-222222222222", "role": "authenticated"}', false);

INSERT INTO public.task_comments (id, organization_id, task_id, user_id, body)
VALUES ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '22222222-2222-2222-2222-222222222222', 'Looking good');

SELECT is(
  (SELECT count(*)::int FROM public.task_comments WHERE id = 'dddddddd-dddd-dddd-dddd-dddddddddddd'),
  1,
  'member can create a comment'
);

-- Test 9: Member can view comments
SELECT is(
  (SELECT count(*)::int FROM public.task_comments),
  1,
  'member can view comments'
);

-- Test 10: Outsider cannot view comments
SELECT set_config('request.jwt.claims', '{"sub": "33333333-3333-3333-3333-333333333333", "role": "authenticated"}', false);

SELECT is(
  (SELECT count(*)::int FROM public.task_comments),
  0,
  'outsider cannot view comments'
);

-- Test 11: Outsider cannot delete someone else's comment (0 rows — user_id != auth.uid())
DELETE FROM public.task_comments WHERE id = 'dddddddd-dddd-dddd-dddd-dddddddddddd';

SELECT set_config('request.jwt.claims', '{"sub": "22222222-2222-2222-2222-222222222222", "role": "authenticated"}', false);

SELECT is(
  (SELECT count(*)::int FROM public.task_comments WHERE id = 'dddddddd-dddd-dddd-dddd-dddddddddddd'),
  1,
  'outsider cannot delete another members comment'
);

-- Test 12: Comment author can delete own comment
DELETE FROM public.task_comments WHERE id = 'dddddddd-dddd-dddd-dddd-dddddddddddd';

SELECT is(
  (SELECT count(*)::int FROM public.task_comments WHERE id = 'dddddddd-dddd-dddd-dddd-dddddddddddd'),
  0,
  'author can delete own comment'
);

RESET ROLE;

SELECT * FROM finish();

ROLLBACK;
