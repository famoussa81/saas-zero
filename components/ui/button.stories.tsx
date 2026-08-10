import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "./button";

const meta: Meta<typeof Button> = {
  title: "UI/Button",
  component: Button,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: [
        "default",
        "destructive",
        "outline",
        "secondary",
        "ghost",
        "link",
      ],
    },
    size: {
      control: "select",
      options: ["default", "sm", "lg", "xl", "icon"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Default: Story = {
  args: { children: "Bouton", variant: "default" },
};

export const Destructive: Story = {
  args: { children: "Supprimer", variant: "destructive" },
};

export const Outline: Story = {
  args: { children: "Annuler", variant: "outline" },
};

export const Disabled: Story = {
  args: { children: "Indisponible", disabled: true },
};
