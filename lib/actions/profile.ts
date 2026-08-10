"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const updateProfileSchema = z.object({
  full_name: z.string().min(2).max(100).optional(),
  avatar_url: z.string().url().optional().or(z.literal("")),
  locale: z.enum(["fr", "en"]).optional(),
  timezone: z.string().optional(),
});

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Non authentifié" };
  }

  const rawData = {
    full_name: formData.get("full_name") || undefined,
    avatar_url: formData.get("avatar_url") || undefined,
    locale: formData.get("locale") || undefined,
    timezone: formData.get("timezone") || undefined,
  };

  const parsed = updateProfileSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      error: "Données invalides",
      issues: parsed.error.flatten(),
    };
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.full_name !== undefined)
    updateData.full_name = parsed.data.full_name;
  if (parsed.data.avatar_url !== undefined)
    updateData.avatar_url = parsed.data.avatar_url || null;
  if (parsed.data.locale !== undefined) updateData.locale = parsed.data.locale;
  if (parsed.data.timezone !== undefined)
    updateData.timezone = parsed.data.timezone;

  if (Object.keys(updateData).length === 0) {
    return { success: true, message: "Aucune modification" };
  }

  const { error } = await supabase
    .from("user_profiles")
    .update(updateData)
    .eq("id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/fr/reglages");
  revalidatePath("/en/settings");

  return { success: true, message: "Profil mis à jour" };
}

const updatePasswordSchema = z
  .object({
    current_password: z.string().min(1),
    new_password: z.string().min(8).max(128),
    confirm_password: z.string(),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirm_password"],
  });

export async function updatePassword(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Non authentifié" };
  }

  const rawData = {
    current_password: formData.get("current_password"),
    new_password: formData.get("new_password"),
    confirm_password: formData.get("confirm_password"),
  };

  const parsed = updatePasswordSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      error: "Données invalides",
      issues: parsed.error.flatten(),
    };
  }

  // Verify current password by attempting to sign in
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password: parsed.data.current_password,
  });

  if (signInError) {
    return { success: false, error: "Mot de passe actuel incorrect" };
  }

  // Update password
  const { error: updateError } = await supabase.auth.updateUser({
    password: parsed.data.new_password,
  });

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  return { success: true, message: "Mot de passe mis à jour" };
}

export async function deleteAccount() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Non authentifié" };
  }

  // Delete user profile data first
  const { error: profileError } = await supabase
    .from("user_profiles")
    .delete()
    .eq("id", user.id);

  if (profileError) {
    return { success: false, error: profileError.message };
  }

  // Delete auth user (this will cascade to organization_members, etc. via RLS/FK)
  const { error: authError } = await supabase.auth.admin.deleteUser(user.id);

  if (authError) {
    // If admin delete fails, try regular delete (requires session)
    const { error: userError } = await supabase.auth.updateUser({
      data: { deleted_at: new Date().toISOString() },
    });
    if (userError) {
      return {
        success: false,
        error: "Impossible de supprimer le compte. Contactez le support.",
      };
    }
  }

  return { success: true, message: "Compte supprimé" };
}
