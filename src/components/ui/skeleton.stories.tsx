import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  Skeleton,
  SkeletonGroup,
  SkeletonKpiCard,
  SkeletonTable,
  SkeletonText,
} from "./skeleton";

const meta: Meta<typeof Skeleton> = {
  title: "UI/Skeleton",
  component: Skeleton,
  tags: ["autodocs"],
  argTypes: {
    shape: {
      control: "select",
      options: ["block", "text", "circle", "surface"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Skeleton>;

export const Default: Story = {
  args: { className: "h-8 w-48" },
};

export const Shapes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Skeleton shape="circle" className="size-12" />
      <Skeleton shape="block" className="h-8 w-40" />
      <Skeleton shape="surface" className="h-20 w-40" />
    </div>
  ),
};

export const Text: Story = {
  render: () => (
    <div className="max-w-md">
      <SkeletonText lines={4} />
    </div>
  ),
};

export const KpiRow: Story = {
  render: () => (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <SkeletonKpiCard />
      <SkeletonKpiCard />
      <SkeletonKpiCard />
      <SkeletonKpiCard />
    </div>
  ),
};

export const Table: Story = {
  render: () => <SkeletonTable rows={4} />,
};

/**
 * L'usage réel : un `SkeletonGroup` enveloppe l'écran entier et porte l'unique
 * annonce aux lecteurs d'écran, les formes à l'intérieur sont `aria-hidden`.
 */
export const FullScreen: Story = {
  render: () => (
    <SkeletonGroup className="space-y-8" label="Chargement du tableau de bord…">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-full max-w-md md:w-80" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SkeletonKpiCard />
        <SkeletonKpiCard />
        <SkeletonKpiCard />
      </div>
      <div className="rounded-xl border border-border bg-card p-4 md:p-6">
        <Skeleton className="mb-4 h-5 w-56" />
        <Skeleton shape="surface" className="h-44 w-full" />
      </div>
      <SkeletonTable rows={3} />
    </SkeletonGroup>
  ),
};
