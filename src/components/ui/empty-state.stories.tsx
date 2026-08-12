import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { FolderOpen, SearchX } from "lucide-react";
import { EmptyState } from "./empty-state";
import { Button } from "./button";

const meta: Meta<typeof EmptyState> = {
  title: "UI/EmptyState",
  component: EmptyState,
  tags: ["autodocs"],
  argTypes: {
    variant: { control: "radio", options: ["first-run", "no-results"] },
  },
};

export default meta;
type Story = StoryObj<typeof EmptyState>;

/** Premier usage : c'est une opportunité d'onboarding, pas un constat. */
export const FirstRun: Story = {
  args: {
    variant: "first-run",
    icon: <FolderOpen className="h-10 w-10" />,
    title: "Créez votre premier projet",
    description:
      "Un projet regroupe vos tâches et votre équipe. Commencez par lui donner un nom.",
    action: <Button>Nouveau projet</Button>,
  },
};

/** Filtre sans résultat : c'est une impasse, il faut une sortie. */
export const NoResults: Story = {
  args: {
    variant: "no-results",
    icon: <SearchX className="h-10 w-10" />,
    title: "Aucun résultat pour « facturation »",
    description: "Vérifiez l'orthographe ou élargissez vos filtres.",
    action: <Button variant="outline">Réinitialiser les filtres</Button>,
  },
};

/** Sans icône ni action — cas minimal. */
export const Minimal: Story = {
  args: {
    title: "Aucune facture pour le moment",
    description: "Vos factures apparaîtront ici après votre premier paiement.",
  },
};
