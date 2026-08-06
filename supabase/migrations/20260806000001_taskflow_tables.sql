-- =============================================================================
-- Migration: 20260806000001_taskflow_tables.sql
-- Description: Tables produit du SaaS de reference (TaskFlow) - projets, taches,
-- commentaires. Scoped par organization_id + RLS multi-tenant.
-- =============================================================================

-- =============================================================================
-- PROJECTS
-- =============================================================================
CREATE TABLE public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT,
    archived_at TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- TASKS (kanban)
-- =============================================================================
CREATE TABLE public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'done')),
    position INTEGER NOT NULL DEFAULT 0,
    assignee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    due_date DATE,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- TASK COMMENTS
-- =============================================================================
CREATE TABLE public.task_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- =============================================================================
CREATE INDEX idx_projects_organization_id ON public.projects(organization_id);
CREATE INDEX idx_tasks_organization_id ON public.tasks(organization_id);
CREATE INDEX idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_assignee ON public.tasks(assignee_id);
CREATE INDEX idx_task_comments_task_id ON public.task_comments(task_id);

-- =============================================================================
-- UPDATED_AT TRIGGERS
-- =============================================================================
CREATE TRIGGER set_updated_at_projects BEFORE UPDATE ON public.projects
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at_tasks BEFORE UPDATE ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =============================================================================
-- ROW LEVEL SECURITY (multi-tenant)
-- =============================================================================
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

-- Helper : l'utilisateur courant est-il membre actif de cette org ?
CREATE OR REPLACE FUNCTION public.is_org_member(p_org_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organization_id = p_org_id
    AND om.user_id = auth.uid()
    AND om.status = 'active'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- PROJECTS
CREATE POLICY "Members can view projects" ON public.projects
    FOR SELECT USING (public.is_org_member(organization_id));
CREATE POLICY "Members can create projects" ON public.projects
    FOR INSERT WITH CHECK (public.is_org_member(organization_id));
CREATE POLICY "Members can update projects" ON public.projects
    FOR UPDATE USING (public.is_org_member(organization_id));
CREATE POLICY "Members can delete projects" ON public.projects
    FOR DELETE USING (public.is_org_member(organization_id));

-- TASKS
CREATE POLICY "Members can view tasks" ON public.tasks
    FOR SELECT USING (public.is_org_member(organization_id));
CREATE POLICY "Members can create tasks" ON public.tasks
    FOR INSERT WITH CHECK (public.is_org_member(organization_id));
CREATE POLICY "Members can update tasks" ON public.tasks
    FOR UPDATE USING (public.is_org_member(organization_id));
CREATE POLICY "Members can delete tasks" ON public.tasks
    FOR DELETE USING (public.is_org_member(organization_id));

-- TASK COMMENTS
CREATE POLICY "Members can view comments" ON public.task_comments
    FOR SELECT USING (public.is_org_member(organization_id));
CREATE POLICY "Members can create comments" ON public.task_comments
    FOR INSERT WITH CHECK (public.is_org_member(organization_id) AND user_id = auth.uid());
CREATE POLICY "Members can delete own comments" ON public.task_comments
    FOR DELETE USING (user_id = auth.uid());
