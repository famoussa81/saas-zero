"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  OrderAdvanceButton,
  type OrderStatus,
} from "@/components/admin/order-status";
import { advanceOrderAction } from "@/lib/actions/boutique-admin";

/**
 * La partie cliente d'une ligne de commande.
 *
 * Elle existe pour la frontière RSC : la liste des commandes est un Server
 * Component qui lit la base avec la service-role. Y mettre `"use client"`
 * ferait entrer cette clé dans le bundle du navigateur — une fuite qui donne
 * accès à toutes les données de tous les clients.
 *
 * Ce composant ne connaît donc que trois valeurs sérialisables et une server
 * action. Il ne voit ni la clé, ni le client Supabase.
 *
 * `router.refresh()` après succès : sans lui, le statut change en base et
 * l'écran continue d'afficher l'ancien, ce qui pousse le commerçant à cliquer
 * deux fois.
 */
export function OrderRowActions({
  orderId,
  reference,
  status,
}: {
  orderId: string;
  reference: string;
  status: OrderStatus;
}) {
  const router = useRouter();
  const [erreur, setErreur] = React.useState<string | null>(null);

  async function avancer(next: OrderStatus) {
    setErreur(null);
    const res = await advanceOrderAction(orderId, next);
    if (res.ok) {
      router.refresh();
    } else {
      setErreur(res.error);
    }
  }

  return (
    <div className="flex flex-col gap-2 border-t border-border pt-4">
      <OrderAdvanceButton
        status={status}
        reference={reference}
        onAdvance={avancer}
      />
      {erreur ? (
        // role="alert" : l'échec doit être annoncé, pas seulement affiché.
        <p role="alert" className="text-sm font-medium text-destructive">
          {erreur}
        </p>
      ) : null}
    </div>
  );
}
