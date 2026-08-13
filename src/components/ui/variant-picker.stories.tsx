import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import * as React from "react";
import { VariantPicker, type VariantOption } from "./variant-picker";

const tailles: VariantOption[] = [
  { id: "s", label: "S", available: 8 },
  { id: "m", label: "M", available: 2 },
  { id: "l", label: "L", available: 12 },
  { id: "xl", label: "XL", available: 0 },
];

function Demo({ options }: { options: VariantOption[] }) {
  const [value, setValue] = React.useState<string | null>(null);
  return (
    <div className="max-w-sm">
      <VariantPicker
        legend="Taille"
        options={options}
        value={value}
        onChange={setValue}
        helpHref="#"
      />
    </div>
  );
}

const meta: Meta<typeof VariantPicker> = {
  title: "UI/VariantPicker",
  component: VariantPicker,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof VariantPicker>;

/**
 * XL est épuisé : il reste AFFICHÉ, barré et désactivé. Le masquer laisserait
 * croire que l'article n'existe pas dans cette taille.
 */
export const Default: Story = {
  render: () => <Demo options={tailles} />,
};

/** Stock bas sur plusieurs tailles — le compte s'annonce sous la grille. */
export const StockBas: Story = {
  render: () => (
    <Demo
      options={[
        { id: "s", label: "S", available: 1 },
        { id: "m", label: "M", available: 2 },
        { id: "l", label: "L", available: 3 },
      ]}
    />
  ),
};

/** Tout est épuisé. L'article reste consultable, la commande non. */
export const ToutEpuise: Story = {
  render: () => (
    <Demo
      options={[
        { id: "s", label: "S", available: 0 },
        { id: "m", label: "M", available: 0 },
        { id: "l", label: "L", available: 0 },
      ]}
    />
  ),
};

/** Couleurs plutôt que tailles : la dimension est un paramètre. */
export const Couleurs: Story = {
  render: () => {
    const couleurs: VariantOption[] = [
      { id: "noir", label: "Noir", available: 6 },
      { id: "ecru", label: "Écru", available: 0 },
      { id: "marine", label: "Bleu marine", available: 4 },
    ];
    return <Demo options={couleurs} />;
  },
};
