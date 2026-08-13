import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import * as React from "react";
import { DataTable, type DataTableSort } from "./data-table";
import { EmptyState } from "./empty-state";

interface Commande {
  id: string;
  reference: string;
  client: string;
  articles: number;
  total: number;
}

const rows: Commande[] = [
  {
    id: "1",
    reference: "CMD-202608-1001",
    client: "A. Diallo",
    articles: 2,
    total: 49000,
  },
  {
    id: "2",
    reference: "CMD-202608-1002",
    client: "M. Traoré",
    articles: 1,
    total: 15000,
  },
  {
    id: "3",
    reference: "CMD-202608-1003",
    client: "K. Sissoko",
    articles: 5,
    total: 128500,
  },
];

const money = (cents: number) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
    maximumFractionDigits: 0,
  }).format(cents);

const columns = [
  {
    id: "reference",
    header: "Référence",
    sortable: true,
    cell: (r: Commande) => (
      <span className="font-mono text-sm">{r.reference}</span>
    ),
  },
  {
    id: "client",
    header: "Client",
    sortable: true,
    cell: (r: Commande) => r.client,
  },
  {
    id: "articles",
    header: "Articles",
    numeric: true,
    hideBelowMd: true,
    cell: (r: Commande) => r.articles,
  },
  {
    id: "total",
    header: "Total",
    numeric: true,
    sortable: true,
    cell: (r: Commande) => money(r.total),
  },
];

const meta: Meta<typeof DataTable<Commande>> = {
  title: "UI/DataTable",
  component: DataTable,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof DataTable<Commande>>;

export const Default: Story = {
  args: { columns, rows, rowKey: (r) => r.id, caption: "Commandes récentes" },
};

/**
 * Composant nommé plutôt qu'un `render` anonyme : les règles des hooks ne
 * s'appliquent qu'aux fonctions dont le nom commence par une majuscule.
 * Déclarer l'état dans `render` fonctionne par accident et casse au premier
 * re-rendu de Storybook.
 */
function SortableDemo() {
  const [sort, setSort] = React.useState<DataTableSort>({
    columnId: "total",
    direction: "desc",
  });
  const sorted = [...rows].sort((a, b) => {
    const dir = sort.direction === "asc" ? 1 : -1;
    if (sort.columnId === "total") return (a.total - b.total) * dir;
    if (sort.columnId === "client")
      return a.client.localeCompare(b.client) * dir;
    return a.reference.localeCompare(b.reference) * dir;
  });
  return (
    <DataTable
      columns={columns}
      rows={sorted}
      rowKey={(r) => r.id}
      caption="Commandes triables"
      sort={sort}
      onSortChange={setSort}
    />
  );
}

/** Le tri est contrôlé : le composant signale l'intention, l'appelant trie. */
export const Sortable: Story = {
  render: () => <SortableDemo />,
};

/** Squelette à la forme du contenu, pas un spinner. */
export const Loading: Story = {
  args: {
    columns,
    rows: [],
    rowKey: (r: Commande) => r.id,
    caption: "Commandes récentes",
    isLoading: true,
    skeletonRows: 4,
  },
};

/** Un état vide qui travaille : il explique et propose une action. */
export const Empty: Story = {
  args: {
    columns,
    rows: [],
    rowKey: (r: Commande) => r.id,
    caption: "Commandes récentes",
    empty: (
      <EmptyState
        title="Aucune commande pour l'instant"
        description="Les commandes passées sur la boutique s'afficheront ici, avec leur statut et leur montant."
      />
    ),
  },
};
