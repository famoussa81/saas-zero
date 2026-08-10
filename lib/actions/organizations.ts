"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const createOrganizationSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/),
  description: z.string().max(500).optional(),
});

export async function createOrganization(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Non authentifié" };
  }

  const rawData = {
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
  };

  const parsed = createOrganizationSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      error: "Données invalides",
      issues: parsed.error.flatten(),
    };
  }

  // Check if slug is taken
  const { data: existing } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", parsed.data.slug)
    .single();

  if (existing) {
    return { success: false, error: "Ce slug est déjà utilisé" };
  }

  // Create organization
  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .insert({
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description,
    })
    .select()
    .single();

  if (orgError) {
    return { success: false, error: orgError.message };
  }

  // Add user as owner
  const { error: memberError } = await supabase
    .from("organization_members")
    .insert({
      organization_id: org.id,
      user_id: user.id,
      role: "owner",
      status: "active",
      joined_at: new Date().toISOString(),
    });

  if (memberError) {
    // Rollback org creation
    await supabase.from("organizations").delete().eq("id", org.id);
    return { success: false, error: memberError.message };
  }

  // Update user profile with organization_id
  await supabase
    .from("user_profiles")
    .update({ organization_id: org.id })
    .eq("id", user.id);

  revalidatePath("/fr/equipe");
  revalidatePath("/fr/tableau-de-bord");

  return { success: true, organization: org };
}

const inviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "member", "viewer"]).default("member"),
});

export async function inviteMember(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Non authentifié" };
  }

  // Get user's organization
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  const orgId = profile?.organization_id;
  if (!orgId) {
    return { success: false, error: "Aucune organisation trouvée" };
  }

  // Check if user is owner/admin
  const { data: membership } = await supabase
    .from("organization_members")
    .select("role")
    .eq("organization_id", orgId)
    .eq("user_id", user.id)
    .eq("status", "active")
    .single();

  if (!membership || !["owner", "admin"].includes(membership.role)) {
    return { success: false, error: "Permissions insuffisantes" };
  }

  const rawData = {
    email: formData.get("email"),
    role: formData.get("role") || "member",
  };

  const parsed = inviteMemberSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      error: "Données invalides",
      issues: parsed.error.flatten(),
    };
  }

  // Check if already a member
  const { data: existingMember } = await supabase
    .from("organization_members")
    .select("id")
    .eq("organization_id", orgId)
    .eq(
      "user_id",
      (
        await supabase
          .from("auth.users")
          .select("id")
          .eq("email", parsed.data.email)
          .single()
      ).data?.id,
    )
    .single();

  if (existingMember) {
    return { success: false, error: "Cet utilisateur est déjà membre" };
  }

  // Check if invite already pending
  const { data: existingInvite } = await supabase
    .from("organization_invites")
    .select("id")
    .eq("organization_id", orgId)
    .eq("email", parsed.data.email)
    .is("accepted_at", null)
    .gt("expires_at", new Date().toISOString())
    .single();

  if (existingInvite) {
    return {
      success: false,
      error: "Une invitation est déjà en cours pour cet email",
    };
  }

  // Create invite
  const token = crypto.randomUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const { error } = await supabase.from("organization_invites").insert({
    organization_id: orgId,
    email: parsed.data.email,
    role: parsed.data.role,
    invited_by: user.id,
    token,
    expires_at: expiresAt.toISOString(),
  });

  if (error) {
    return { success: false, error: error.message };
  }

  // TODO: Send invitation email via Brevo
  // await sendTeamInvitationEmail(parsed.data.email, user.email || "", orgName, inviteUrl);

  revalidatePath("/fr/equipe");

  return { success: true };
}

export async function acceptInvitation(token: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Non authentifié" };
  }

  // Find valid invite
  const { data: invite, error: inviteError } = await supabase
    .from("organization_invites")
    .select("*")
    .eq("token", token)
    .is("accepted_at", null)
    .gt("expires_at", new Date().toISOString())
    .single();

  if (inviteError || !invite) {
    return { success: false, error: "Invitation invalide ou expirée" };
  }

  // Check if user email matches invite
  const { data: userData } = await supabase.auth.getUser();
  if (userData.user?.email !== invite.email) {
    return {
      success: false,
      error: "Cet email ne correspond pas à l'invitation",
    };
  }

  // Add user as member
  const { error: memberError } = await supabase
    .from("organization_members")
    .insert({
      organization_id: invite.organization_id,
      user_id: user.id,
      role: invite.role,
      status: "active",
      joined_at: new Date().toISOString(),
    });

  if (memberError) {
    return { success: false, error: memberError.message };
  }

  // Mark invite as accepted
  await supabase
    .from("organization_invites")
    .update({ accepted_at: new Date().toISOString() })
    .eq("id", invite.id);

  // Update user profile
  await supabase
    .from("user_profiles")
    .update({ organization_id: invite.organization_id })
    .eq("id", user.id);

  revalidatePath("/fr/equipe");
  revalidatePath("/fr/tableau-de-bord");

  return { success: true };
}

const updateMemberRoleSchema = z.object({
  memberId: z.string().uuid(),
  role: z.enum(["admin", "member", "viewer"]),
});

export async function updateMemberRole(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Non authentifié" };
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  const orgId = profile?.organization_id;
  if (!orgId) {
    return { success: false, error: "Aucune organisation" };
  }

  // Check if user is owner
  const { data: membership } = await supabase
    .from("organization_members")
    .select("role")
    .eq("organization_id", orgId)
    .eq("user_id", user.id)
    .eq("status", "active")
    .single();

  if (!membership || membership.role !== "owner") {
    return {
      success: false,
      error: "Seul le propriétaire peut changer les rôles",
    };
  }

  const rawData = {
    memberId: formData.get("memberId"),
    role: formData.get("role"),
  };

  const parsed = updateMemberRoleSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      error: "Données invalides",
      issues: parsed.error.flatten(),
    };
  }

  // Don't allow changing owner role
  const { data: targetMember } = await supabase
    .from("organization_members")
    .select("role")
    .eq("id", parsed.data.memberId)
    .single();

  if (targetMember?.role === "owner") {
    return {
      success: false,
      error: "Impossible de modifier le rôle du propriétaire",
    };
  }

  const { error } = await supabase
    .from("organization_members")
    .update({ role: parsed.data.role })
    .eq("id", parsed.data.memberId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/fr/equipe");

  return { success: true };
}

export async function removeMember(memberId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Non authentifié" };
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  const orgId = profile?.organization_id;
  if (!orgId) {
    return { success: false, error: "Aucune organisation" };
  }

  // Check if user is owner
  const { data: membership } = await supabase
    .from("organization_members")
    .select("role")
    .eq("organization_id", orgId)
    .eq("user_id", user.id)
    .eq("status", "active")
    .single();

  if (!membership || membership.role !== "owner") {
    return {
      success: false,
      error: "Seul le propriétaire peut supprimer des membres",
    };
  }

  // Don't allow removing owner
  const { data: targetMember } = await supabase
    .from("organization_members")
    .select("role, user_id")
    .eq("id", memberId)
    .single();

  if (targetMember?.role === "owner") {
    return { success: false, error: "Impossible de supprimer le propriétaire" };
  }

  const { error } = await supabase
    .from("organization_members")
    .delete()
    .eq("id", memberId);

  if (error) {
    return { success: false, error: error.message };
  }

  // If removed member was in this org, clear their organization_id
  if (targetMember?.user_id) {
    await supabase
      .from("user_profiles")
      .update({ organization_id: null })
      .eq("id", targetMember.user_id);
  }

  revalidatePath("/fr/equipe");

  return { success: true };
}

export async function getOrganizationMembers() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Non authentifié", members: [] };
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  const orgId = profile?.organization_id;
  if (!orgId) {
    return { success: true, members: [] };
  }

  const { data: members, error } = await supabase
    .from("organization_members")
    .select(
      `
      id,
      role,
      status,
      joined_at,
      user_profiles!inner (
        id,
        full_name,
        avatar_url,
        email
      )
    `,
    )
    .eq("organization_id", orgId)
    .eq("status", "active");

  if (error) {
    return { success: false, error: error.message, members: [] };
  }

  return { success: true, members: members || [] };
}

export async function getUserOrganization() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Non authentifié", organization: null };
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!profile?.organization_id) {
    return { success: true, organization: null };
  }

  const { data: org, error } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", profile.organization_id)
    .single();

  if (error) {
    return { success: false, error: error.message, organization: null };
  }

  return { success: true, organization: org };
}
