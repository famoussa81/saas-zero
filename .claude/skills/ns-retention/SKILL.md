---
name: ns-retention
description: Rétention & notifications — emails transactionnels (Bienvenue, reset, facture, onboarding), notifications in-app, séquences d'usage. Utiliser pour faire "rester" le client.
---

# ns-retention — Le client reste

> **Ton objectif final** : pas juste inscrire/faire payer — **faire rester**.
> Emails utiles + notifications + habitude = revenu récurrent.
>
> 📌 **Skills officiels à référencer** : `resend/email-best-practices`, `resend/react-email`
> (registre VoltAgent) — patterns emails transactionnels propres et frappables.

## Contrat design (non négociable)

Avant d'écrire du JSX, lire dans cet ordre :

1. **`DESIGN-CHOICE.md`** (racine) — palette, ambiance, élément signature, tier de motion.
2. **`src/styles/globals.css`** — les tokens réellement définis. Ne pas en inventer.
3. **`src/components/ui/`** — 21 primitives Radix + CVA déjà là. Ne pas les réécrire (et ne jamais en créer dans `components/ui/`).
4. **`.claude/design/UI-CONTRACT.md`** — densité, cinq états, cartes KPI, tables, formulaires, accessibilité, dark mode.

Si `DESIGN-CHOICE.md` est encore le template non rempli : s'arrêter et le signaler. Générer de l'UI sans direction artistique décidée produit exactement le générique que la pipeline existe pour éviter.

Aucune valeur en dur — couleur, espacement, rayon, ombre, taille de police. Avant de rendre la main :

```bash
pnpm design:tokens:audit
```

## Emails transactionnels (Brevo)

| Email              | Quand                             | Contenu                        |
| ------------------ | --------------------------------- | ------------------------------ |
| Bienvenue          | inscription                       | confirmer, lancer l'onboarding |
| Magic link / reset | demande                           | lien sécurisé                  |
| Facture / reçu     | invoice.paid                      | reçu Stripe                    |
| Fin d'essai        | avant expiration (3j, 1j, jour J) | CTA upgrade                    |
| Réactivation       | après inactivité                  | rappeler la valeur             |

Implémentation :

- Envoyer via API Brevo (`workers/brevo-email.ts` ou edge function).
- Templates Brevo (IDs) ou HTML inline via `email_queue` table (déjà dans le schema shared).

## Notifications in-app

- Table `notifications` (B2B : scoped par organization_id + RLS).
- Realtime Supabase : `supabase.channel("org:"+orgId).on("postgres_changes"...)`.
- Compteur non-lus dans le header du layout (voir ns-dashboard).

## Habitude / séquences

- **Première semaine** : email J1 (première valeur), J3 (astuce), J7 (bilan/usage).
- **Feature discovery** : notifier quand une fonction clé est dispo.
- **Usage drops** : détecter inactivité (logins, activité) → relancer.

## Outils & jobs

- Jobs cron (migration pg_cron) : reminder essai, email queue, cleanup invites.
- Analytics d'usage (voir ns-analytics) pour déclencher les séquences.

## Checklist de sortie

- [ ] Email bienvenue + reset + facture fonctionnels
- [ ] Reminders fin d'essai (3j/1j/0)
- [ ] Notifications in-app + realtime + compteur
- [ ] Séquence onboarding J1/J3/J7
- [ ] Detection d'inactivité → relance
