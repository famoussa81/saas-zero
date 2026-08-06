-- =============================================================================
-- Migration: 20260802000002_b2b_schema.sql
-- Description: B2B Schema - Organizations, Teams, Members, Invites
-- This migration is for B2B (Organization/Team) architecture
-- =============================================================================

-- =============================================================================
-- ORGANIZATIONS
-- =============================================================================

CREATE TABLE public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    logo_url TEXT,
    website TEXT,
    billing_email TEXT,
    metadata JSONB DEFAULT '{}',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Organization Members (Users belonging to organizations)
CREATE TABLE public.organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'suspended', 'removed')),
    invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    joined_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(organization_id, user_id)
);

-- Organization Invites
CREATE TABLE public.organization_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member', 'viewer')),
    invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- USER PROFILES (B2B Variant - linked to organization)
-- Table de base créée en 20260802000001_initial_schema.sql (shared core).
-- Ici on AUGMENTE seulement avec organization_id (choix B2B vs B2C à la création).
-- =============================================================================

ALTER TABLE public.user_profiles
    ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Organizations
CREATE INDEX idx_organizations_slug ON public.organizations(slug);
CREATE INDEX idx_organizations_deleted_at ON public.organizations(deleted_at) WHERE deleted_at IS NOT NULL;

-- Organization Members
CREATE INDEX idx_organization_members_organization_id ON public.organization_members(organization_id);
CREATE INDEX idx_organization_members_user_id ON public.organization_members(user_id);
CREATE INDEX idx_organization_members_status ON public.organization_members(status);
CREATE INDEX idx_organization_members_role ON public.organization_members(role);

-- Organization Invites
CREATE INDEX idx_organization_invites_organization_id ON public.organization_invites(organization_id);
CREATE INDEX idx_organization_invites_email ON public.organization_invites(email);
CREATE INDEX idx_organization_invites_token ON public.organization_invites(token);
CREATE INDEX idx_organization_invites_expires_at ON public.organization_invites(expires_at);

-- User Profiles (B2B)
CREATE INDEX idx_user_profiles_organization_id ON public.user_profiles(organization_id);

-- =============================================================================
-- UPDATED_AT TRIGGERS
-- =============================================================================

CREATE TRIGGER set_updated_at_organizations
    BEFORE UPDATE ON public.organizations
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_organization_members
    BEFORE UPDATE ON public.organization_members
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_organization_invites
    BEFORE UPDATE ON public.organization_invites
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_user_profiles_b2b
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) - B2B TABLES
-- =============================================================================

-- Enable RLS on all B2B tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- ORGANIZATIONS POLICIES
-- =============================================================================

-- Users can view organizations they are members of
CREATE POLICY "Members can view their organizations"
    ON public.organizations
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members om
            WHERE om.organization_id = organizations.id
            AND om.user_id = auth.uid()
            AND om.status = 'active'
        )
    );

-- Organization owners/admins can update organization
CREATE POLICY "Owners and admins can update organization"
    ON public.organizations
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members om
            WHERE om.organization_id = organizations.id
            AND om.user_id = auth.uid()
            AND om.status = 'active'
            AND om.role IN ('owner', 'admin')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.organization_members om
            WHERE om.organization_id = organizations.id
            AND om.user_id = auth.uid()
            AND om.status = 'active'
            AND om.role IN ('owner', 'admin')
        )
    );

-- Users can create organizations (become owner)
CREATE POLICY "Users can create organizations"
    ON public.organizations
    FOR INSERT
    WITH CHECK (TRUE);

-- =============================================================================
-- ORGANIZATION MEMBERS POLICIES
-- =============================================================================

-- Members can view other members in their organization
CREATE POLICY "Members can view organization members"
    ON public.organization_members
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members om
            WHERE om.organization_id = organization_members.organization_id
            AND om.user_id = auth.uid()
            AND om.status = 'active'
        )
    );

-- Owners/admins can insert new members
CREATE POLICY "Owners and admins can add members"
    ON public.organization_members
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.organization_members om
            WHERE om.organization_id = organization_members.organization_id
            AND om.user_id = auth.uid()
            AND om.status = 'active'
            AND om.role IN ('owner', 'admin')
        )
    );

-- Owners/admins can update members (role, status)
CREATE POLICY "Owners and admins can update members"
    ON public.organization_members
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members om
            WHERE om.organization_id = organization_members.organization_id
            AND om.user_id = auth.uid()
            AND om.status = 'active'
            AND om.role IN ('owner', 'admin')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.organization_members om
            WHERE om.organization_id = organization_members.organization_id
            AND om.user_id = auth.uid()
            AND om.status = 'active'
            AND om.role IN ('owner', 'admin')
        )
    );

-- Owners can delete members (remove from org)
CREATE POLICY "Owners can remove members"
    ON public.organization_members
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members om
            WHERE om.organization_id = organization_members.organization_id
            AND om.user_id = auth.uid()
            AND om.status = 'active'
            AND om.role = 'owner'
        )
    );

-- Users can view their own membership across all orgs
CREATE POLICY "Users can view their own memberships"
    ON public.organization_members
    FOR SELECT
    USING (user_id = auth.uid());

-- =============================================================================
-- ORGANIZATION INVITES POLICIES
-- =============================================================================

-- Members can view invites for their organization
CREATE POLICY "Members can view organization invites"
    ON public.organization_invites
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members om
            WHERE om.organization_id = organization_invites.organization_id
            AND om.user_id = auth.uid()
            AND om.status = 'active'
        )
    );

-- Owners/admins can create invites
CREATE POLICY "Owners and admins can create invites"
    ON public.organization_invites
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.organization_members om
            WHERE om.organization_id = organization_invites.organization_id
            AND om.user_id = auth.uid()
            AND om.status = 'active'
            AND om.role IN ('owner', 'admin')
        )
    );

-- Owners/admins can update invites (resend, cancel)
CREATE POLICY "Owners and admins can update invites"
    ON public.organization_invites
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members om
            WHERE om.organization_id = organization_invites.organization_id
            AND om.user_id = auth.uid()
            AND om.status = 'active'
            AND om.role IN ('owner', 'admin')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.organization_members om
            WHERE om.organization_id = organization_invites.organization_id
            AND om.user_id = auth.uid()
            AND om.status = 'active'
            AND om.role IN ('owner', 'admin')
        )
    );

-- Anyone with valid token can view invite (for acceptance)
CREATE POLICY "Anyone can view invite by token"
    ON public.organization_invites
    FOR SELECT
    USING (token IS NOT NULL AND expires_at > NOW() AND accepted_at IS NULL);

-- =============================================================================
-- USER PROFILES POLICIES (B2B)
-- =============================================================================
-- Les policies de base ("Users can view/insert/update own profile") sont déjà
-- créées dans 20260802000001_initial_schema.sql (table partagée). On n'ajoute ici
-- que la politique B2B (visibilité entre membres d'une même organisation).

-- Organization members can view profiles of other members in same org
CREATE POLICY "Org members can view member profiles"
    ON public.user_profiles
    FOR SELECT
    USING (
        organization_id IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM public.organization_members om
            WHERE om.organization_id = user_profiles.organization_id
            AND om.user_id = auth.uid()
            AND om.status = 'active'
        )
    );

-- =============================================================================
-- HELPER FUNCTIONS (B2B)
-- =============================================================================

-- Get current user's organization ID
CREATE OR REPLACE FUNCTION public.get_my_organization_id()
RETURNS UUID AS $$
DECLARE
    org_id UUID;
BEGIN
    SELECT organization_id INTO org_id
    FROM public.user_profiles
    WHERE id = auth.uid()
    LIMIT 1;
    RETURN org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is owner of organization
CREATE OR REPLACE FUNCTION public.is_organization_owner(org_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    is_owner BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM public.organization_members
        WHERE organization_id = org_id
        AND user_id = auth.uid()
        AND status = 'active'
        AND role = 'owner'
    ) INTO is_owner;
    RETURN is_owner;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is admin or owner of organization
CREATE OR REPLACE FUNCTION public.is_organization_admin(org_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    is_admin BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM public.organization_members
        WHERE organization_id = org_id
        AND user_id = auth.uid()
        AND status = 'active'
        AND role IN ('owner', 'admin')
    ) INTO is_admin;
    RETURN is_admin;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user's role in organization
CREATE OR REPLACE FUNCTION public.get_my_organization_role(org_id UUID)
RETURNS TEXT AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role
    FROM public.organization_members
    WHERE organization_id = org_id
    AND user_id = auth.uid()
    AND status = 'active'
    LIMIT 1;
    RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;