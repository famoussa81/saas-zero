-- =============================================================================
-- Migration: 20260807000001_fix_org_owner_membership.sql
-- Description: BUGFIX — the client-facing onboarding flow inserts an
-- organization and then the creator as owner. But the "Owners and admins can
-- add members" RLS policy requires the actor to ALREADY be an active
-- owner/admin member — a chicken-and-egg that blocks every org creation.
--
-- Fix: AFTER INSERT trigger on organizations that auto-adds the creator as an
-- active owner member. The trigger runs SECURITY DEFINER (as the function
-- owner, bypassing RLS), which is the only way to seed the first membership.
-- =============================================================================

-- Function: add the creator as the organization's first member (owner)
CREATE OR REPLACE FUNCTION public.handle_organization_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    creator_id UUID := auth.uid();
BEGIN
    -- Skip when created by service role / no authenticated user (bulk import).
    IF creator_id IS NULL THEN
        RETURN NEW;
    END IF;

    INSERT INTO public.organization_members (
        organization_id,
        user_id,
        role,
        status,
        invited_by,
        joined_at
    )
    VALUES (
        NEW.id,
        creator_id,
        'owner',
        'active',
        creator_id,
        NOW()
    )
    ON CONFLICT (organization_id, user_id) DO NOTHING;

    RETURN NEW;
END;
$$;

-- Attach trigger
DROP TRIGGER IF EXISTS handle_organization_created_trigger ON public.organizations;
CREATE TRIGGER handle_organization_created_trigger
    AFTER INSERT ON public.organizations
    FOR EACH ROW EXECUTE FUNCTION public.handle_organization_created();

-- =============================================================================
-- Tighten org creation: WITH CHECK (TRUE) lets ANON create organizations
-- (anon has INSERT privilege on public tables by default), enabling anonymous
-- org spam. Require an authenticated user — the trigger above then seeds the
-- creator as owner.
-- =============================================================================
DROP POLICY IF EXISTS "Users can create organizations" ON public.organizations;
CREATE POLICY "Users can create organizations" ON public.organizations
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);
