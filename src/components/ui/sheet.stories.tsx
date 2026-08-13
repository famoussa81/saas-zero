import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./sheet";
import { Button } from "./button";

const meta: Meta<typeof SheetContent> = {
  title: "UI/Sheet",
  component: SheetContent,
  tags: ["autodocs"],
  argTypes: {
    side: { control: "select", options: ["top", "right", "bottom", "left"] },
  },
};

export default meta;
type Story = StoryObj<typeof SheetContent>;

/** Le panier d'une boutique : en-tête fixe, corps qui défile, pied collé. */
export const Panier: Story = {
  render: (args) => (
    <Sheet>
      <SheetTrigger asChild>
        <Button>Ouvrir le panier</Button>
      </SheetTrigger>
      <SheetContent {...args}>
        <SheetHeader>
          <SheetTitle>Votre panier</SheetTitle>
          <SheetDescription>2 articles</SheetDescription>
        </SheetHeader>
        <SheetBody className="space-y-4">
          {[
            {
              nom: "T-shirt coton bio",
              variante: "M / Noir",
              prix: "15 000 F",
            },
            { nom: "Chemise en lin", variante: "M", prix: "32 000 F" },
          ].map((a) => (
            <div
              key={a.nom}
              className="flex items-start justify-between gap-4 border-b border-border pb-4 last:border-0"
            >
              <div>
                <p className="font-medium text-foreground">{a.nom}</p>
                <p className="text-sm text-muted-foreground">{a.variante}</p>
              </div>
              <p className="tabular-nums text-sm font-medium">{a.prix}</p>
            </div>
          ))}
        </SheetBody>
        <SheetFooter>
          <SheetClose asChild>
            <Button variant="outline">Continuer mes achats</Button>
          </SheetClose>
          <Button>Passer la commande</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
  args: { side: "right" },
};

/** Navigation mobile de l'app protégée. */
export const NavigationMobile: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Menu</Button>
      </SheetTrigger>
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>Navigation</SheetTitle>
        </SheetHeader>
        <SheetBody>
          {/* Des boutons, pas des <a href="#"> : un lien sans destination
              réelle est annoncé comme navigable et ne mène nulle part. Dans un
              vrai projet ce seraient des <Link> next/link. */}
          <nav className="flex flex-col gap-1">
            {["Tableau de bord", "Commandes", "Produits", "Réglages"].map(
              (item, i) => (
                <button
                  key={item}
                  type="button"
                  aria-current={i === 0 ? "page" : undefined}
                  className="rounded-md px-3 py-2 text-left text-sm font-medium transition-colors hover:bg-muted aria-[current=page]:bg-muted aria-[current=page]:font-semibold"
                >
                  {item}
                </button>
              ),
            )}
          </nav>
        </SheetBody>
      </SheetContent>
    </Sheet>
  ),
};
