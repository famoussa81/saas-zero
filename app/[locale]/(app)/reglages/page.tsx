"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  updateProfile,
  updatePassword,
  deleteAccount,
} from "@/lib/actions/profile";

export default function ReglagesPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Profile form state
  const [profileData, setProfileData] = useState({
    full_name: "",
    locale: "fr",
    timezone: "Europe/Paris",
  });
  const [profileMessage, setProfileMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Password form state
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [passwordMessage, setPasswordMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Delete account state
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteMessage, setDeleteMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleProfileSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setProfileMessage(null);

    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateProfile(formData);
      if (result.success) {
        setProfileMessage({
          type: "success",
          text: result.message ?? "Profil mis à jour",
        });
      } else {
        setProfileMessage({
          type: "error",
          text: result.error ?? "Erreur lors de la mise à jour",
        });
      }
    });
  };

  const handlePasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPasswordMessage(null);

    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updatePassword(formData);
      if (result.success) {
        setPasswordMessage({
          type: "success",
          text: result.message ?? "Mot de passe mis à jour",
        });
        setPasswordData({
          current_password: "",
          new_password: "",
          confirm_password: "",
        });
      } else {
        setPasswordMessage({
          type: "error",
          text: result.error ?? "Erreur lors du changement",
        });
      }
    });
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== "SUPPRIMER") {
      setDeleteMessage({
        type: "error",
        text: "Tapez 'SUPPRIMER' pour confirmer",
      });
      return;
    }

    setDeleteMessage(null);
    startTransition(async () => {
      const result = await deleteAccount();
      if (result.success) {
        setDeleteMessage({
          type: "success",
          text: result.message ?? "Compte supprimé",
        });
        // Redirect to home after deletion
        router.push("/fr");
        router.refresh();
      } else {
        setDeleteMessage({
          type: "error",
          text: result.error ?? "Erreur lors de la suppression",
        });
      }
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Réglages</h1>
        <p className="mt-1 text-muted-foreground">
          Gère ton profil, ta sécurité et ton compte.
        </p>
      </header>

      {/* Profil */}
      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-xl font-semibold">Profil</h2>
        <form onSubmit={handleProfileSubmit} className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="full_name"
                className="block text-sm font-medium mb-1"
              >
                Nom complet
              </label>
              <input
                type="text"
                id="full_name"
                name="full_name"
                value={profileData.full_name}
                onChange={(e) =>
                  setProfileData({ ...profileData, full_name: e.target.value })
                }
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Ton nom"
              />
            </div>
            <div>
              <label
                htmlFor="locale"
                className="block text-sm font-medium mb-1"
              >
                Langue
              </label>
              <select
                id="locale"
                name="locale"
                value={profileData.locale}
                onChange={(e) =>
                  setProfileData({ ...profileData, locale: e.target.value })
                }
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="fr">Français</option>
                <option value="en">English</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="timezone"
                className="block text-sm font-medium mb-1"
              >
                Fuseau horaire
              </label>
              <input
                type="text"
                id="timezone"
                name="timezone"
                value={profileData.timezone}
                onChange={(e) =>
                  setProfileData({ ...profileData, timezone: e.target.value })
                }
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Europe/Paris"
              />
            </div>
          </div>

          {profileMessage && (
            <div
              className={`rounded-md p-3 text-sm ${
                profileMessage.type === "success"
                  ? "bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20"
                  : "bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20"
              }`}
            >
              {profileMessage.text}
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none"
          >
            {isPending ? "Enregistrement..." : "Enregistrer les modifications"}
          </button>
        </form>
      </section>

      {/* Sécurité */}
      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-xl font-semibold">Sécurité</h2>

        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div>
              <h3 className="font-medium">
                Authentification à deux facteurs (2FA)
              </h3>
              <p className="text-sm text-muted-foreground">
                Ajoute une couche de sécurité supplémentaire à ton compte.
              </p>
            </div>
            <button
              disabled
              className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-muted-foreground cursor-not-allowed"
            >
              Bientôt disponible
            </button>
          </div>

          <div className="border-t border-border pt-6">
            <h3 className="font-medium mb-4">Changer le mot de passe</h3>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label
                    htmlFor="current_password"
                    className="block text-sm font-medium mb-1"
                  >
                    Mot de passe actuel
                  </label>
                  <input
                    type="password"
                    id="current_password"
                    name="current_password"
                    value={passwordData.current_password}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        current_password: e.target.value,
                      })
                    }
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="new_password"
                    className="block text-sm font-medium mb-1"
                  >
                    Nouveau mot de passe
                  </label>
                  <input
                    type="password"
                    id="new_password"
                    name="new_password"
                    value={passwordData.new_password}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        new_password: e.target.value,
                      })
                    }
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    minLength={8}
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="confirm_password"
                    className="block text-sm font-medium mb-1"
                  >
                    Confirmer le nouveau mot de passe
                  </label>
                  <input
                    type="password"
                    id="confirm_password"
                    name="confirm_password"
                    value={passwordData.confirm_password}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        confirm_password: e.target.value,
                      })
                    }
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    minLength={8}
                    required
                  />
                </div>
              </div>

              {passwordMessage && (
                <div
                  className={`rounded-md p-3 text-sm ${
                    passwordMessage.type === "success"
                      ? "bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20"
                      : "bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20"
                  }`}
                >
                  {passwordMessage.text}
                </div>
              )}

              <button
                type="submit"
                disabled={isPending}
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none"
              >
                {isPending ? "Mise à jour..." : "Mettre à jour le mot de passe"}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Zone de danger */}
      <section className="rounded-xl border border-red-500/20 bg-red-500/5 p-6">
        <h2 className="text-xl font-semibold text-red-600 dark:text-red-400">
          Zone de danger
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Une fois ton compte supprimé, cette action est irréversible. Toutes
          tes données seront définitivement effacées.
        </p>

        <div className="mt-4 flex items-center gap-4">
          <input
            type="text"
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            placeholder="Tapez 'SUPPRIMER' pour confirmer"
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
            style={{ maxWidth: "300px" }}
          />
          <button
            onClick={handleDeleteAccount}
            disabled={isPending}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 disabled:pointer-events-none"
          >
            {isPending ? "Suppression..." : "Supprimer mon compte"}
          </button>
        </div>

        {deleteMessage && (
          <div
            className={`mt-4 rounded-md p-3 text-sm ${
              deleteMessage.type === "success"
                ? "bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20"
                : "bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20"
            }`}
          >
            {deleteMessage.text}
          </div>
        )}
      </section>
    </div>
  );
}
