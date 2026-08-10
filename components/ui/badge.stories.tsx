import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Badge } from "./badge";

const meta: Meta<typeof Badge> = {
  title: "UI/Badge",
  component: Badge,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: [
        "default",
        "secondary",
        "destructive",
        "outline",
        "success",
        "warning",
      ],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Default: Story = {
  args: { children: "Nouveau", variant: "default" },
};
export const Success: Story = {
  args: { children: "Actif", variant: "success" },
};
export const Warning: Story = {
  args: { children: "En attente", variant: "warning" },
};
export const Destructive: Story = {
  args: { children: "Suspendu", variant: "destructive" },
};
