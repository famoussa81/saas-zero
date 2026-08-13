import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Stepper — l'avancement d'un parcours en plusieurs écrans.
 *
 * Deux usages qui reviennent : l'onboarding d'un SaaS et le tunnel de
 * commande d'une boutique. Dans les deux cas, connaître le nombre d'étapes
 * restantes réduit l'abandon — un formulaire dont on ne voit pas la fin
 * paraît toujours plus long qu'il ne l'est.
 *
 * Rendu en `<ol>` : un parcours est une liste ORDONNÉE, et c'est ce qui fait
 * annoncer « étape 2 sur 4 » plutôt qu'une suite de cercles décoratifs. Le
 * repère visuel courant porte `aria-current="step"`.
 *
 * Composant serveur : aucune interactivité, donc aucun `"use client"`. Il ne
 * fait pas naviguer — la navigation appartient au parcours qui l'utilise.
 */
export interface StepperStep {
  /** Libellé court. « Livraison », pas « Renseignez votre adresse ». */
  label: string;
  /** Précision facultative, affichée sous le libellé sur grand écran. */
  description?: string;
}

export interface StepperProps extends React.HTMLAttributes<HTMLElement> {
  steps: StepperStep[];
  /** Index de l'étape en cours, à partir de 0. */
  current: number;
  /** Description du parcours pour les lecteurs d'écran. */
  label: string;
}

export function Stepper({
  steps,
  current,
  label,
  className,
  ...props
}: StepperProps) {
  return (
    <nav aria-label={label} className={className} {...props}>
      <ol className="flex items-start gap-2">
        {steps.map((step, index) => {
          const done = index < current;
          const active = index === current;
          return (
            <li
              key={step.label}
              className="flex min-w-0 flex-1 flex-col items-center gap-2"
              aria-current={active ? "step" : undefined}
            >
              <div className="flex w-full items-center gap-2">
                {/* Trait de liaison, sauf avant la première étape. */}
                {index > 0 ? (
                  <span
                    aria-hidden="true"
                    className={cn(
                      "h-px flex-1",
                      done || active ? "bg-primary" : "bg-border",
                    )}
                  />
                ) : (
                  <span aria-hidden="true" className="flex-1" />
                )}
                <span
                  aria-hidden="true"
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold tabular-nums transition-colors",
                    done && "border-primary bg-primary text-primary-foreground",
                    active && "border-primary bg-background text-primary",
                    !done &&
                      !active &&
                      "border-border bg-background text-muted-foreground",
                  )}
                >
                  {/* Une coche pour ce qui est fait, le numéro sinon : la
                      forme distingue les états, pas seulement la couleur. */}
                  {done ? <Check className="h-4 w-4" /> : index + 1}
                </span>
                {index < steps.length - 1 ? (
                  <span
                    aria-hidden="true"
                    className={cn(
                      "h-px flex-1",
                      done ? "bg-primary" : "bg-border",
                    )}
                  />
                ) : (
                  <span aria-hidden="true" className="flex-1" />
                )}
              </div>
              <div className="min-w-0 text-center">
                <p
                  className={cn(
                    "truncate text-sm",
                    active
                      ? "font-semibold text-foreground"
                      : "font-medium text-muted-foreground",
                  )}
                >
                  {/* Le texte porte l'état, pour qui n'a que le texte. */}
                  <span className="sr-only">
                    {done
                      ? "Terminée : "
                      : active
                        ? "Étape en cours : "
                        : "À venir : "}
                  </span>
                  {step.label}
                </p>
                {step.description ? (
                  <p className="hidden truncate text-xs text-muted-foreground sm:block">
                    {step.description}
                  </p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
