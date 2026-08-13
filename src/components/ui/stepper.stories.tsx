import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Stepper } from "./stepper";

const meta: Meta<typeof Stepper> = {
  title: "UI/Stepper",
  component: Stepper,
  tags: ["autodocs"],
  argTypes: { current: { control: { type: "number", min: 0, max: 3 } } },
};

export default meta;
type Story = StoryObj<typeof Stepper>;

/** Tunnel de commande d'une boutique. */
export const TunnelCommande: Story = {
  args: {
    label: "Étapes de la commande",
    current: 1,
    steps: [
      { label: "Panier", description: "Vérifier les articles" },
      { label: "Livraison", description: "Adresse et créneau" },
      { label: "Paiement", description: "Moyen de paiement" },
      { label: "Confirmation" },
    ],
  },
};

/** Onboarding d'un SaaS : trois étapes maximum jusqu'à la première valeur. */
export const Onboarding: Story = {
  args: {
    label: "Étapes de configuration",
    current: 0,
    steps: [
      { label: "Compte" },
      { label: "Équipe" },
      { label: "Premier projet" },
    ],
  },
};

/** Dernière étape : tout le reste porte une coche, pas un numéro. */
export const Terminee: Story = {
  args: {
    label: "Étapes de la commande",
    current: 3,
    steps: [
      { label: "Panier" },
      { label: "Livraison" },
      { label: "Paiement" },
      { label: "Confirmation" },
    ],
  },
};
