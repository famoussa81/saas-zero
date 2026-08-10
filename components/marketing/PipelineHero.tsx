"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { Check } from "lucide-react";

const PHASES = [
  { label: "Discovery", detail: "B2B/B2C, design, pricing" },
  { label: "Scaffold", detail: "repo, Supabase, env" },
  { label: "Design", detail: "tokens, composants" },
  { label: "Build", detail: "auth, billing, dashboard" },
  { label: "Verify", detail: "14 gates déterministes" },
  { label: "Deploy", detail: "Vercel, webhooks" },
] as const;

const COMMAND = '/ns-ship "mon-saas"';

/**
 * Signature hero moment: a terminal running the actual product it's selling
 * ( /ns-ship, phase by phase) instead of an abstract decorative graphic.
 * Loops on a GSAP timeline; respects prefers-reduced-motion by rendering
 * the end state statically (see useGSAP's reduced-motion check below).
 */
export function PipelineHero() {
  const root = useRef<HTMLDivElement>(null);
  const caretRef = useRef<HTMLSpanElement>(null);
  const commandRef = useRef<HTMLSpanElement>(null);
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const checkRefs = useRef<(SVGSVGElement | null)[]>([]);
  const barRefs = useRef<(HTMLDivElement | null)[]>([]);

  useGSAP(
    () => {
      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      if (prefersReducedMotion) {
        if (commandRef.current) commandRef.current.textContent = COMMAND;
        rowRefs.current.forEach((row) => row?.classList.add("is-done"));
        checkRefs.current.forEach((c) => c && gsap.set(c, { opacity: 1 }));
        barRefs.current.forEach((b) => b && gsap.set(b, { scaleX: 1 }));
        return;
      }

      gsap.set(checkRefs.current, { opacity: 0, scale: 0.5 });
      gsap.set(barRefs.current, { scaleX: 0 });
      rowRefs.current.forEach((row) =>
        row?.classList.remove("is-active", "is-done"),
      );

      const tl = gsap.timeline({ repeat: -1, repeatDelay: 1.4 });

      // Type the command
      tl.to(
        caretRef.current,
        { opacity: 0, repeat: 6, yoyo: true, duration: 0.25 },
        0,
      );
      tl.to(
        { chars: 0 },
        {
          chars: COMMAND.length,
          duration: 0.9,
          ease: "none",
          onUpdate: function () {
            if (commandRef.current) {
              commandRef.current.textContent = COMMAND.slice(
                0,
                Math.round(this.targets()[0].chars),
              );
            }
          },
        },
        0,
      );

      // Run each phase in sequence
      PHASES.forEach((_, i) => {
        const row = rowRefs.current[i];
        const bar = barRefs.current[i];
        const check = checkRefs.current[i];
        tl.call(() => row?.classList.add("is-active"))
          .to(bar, { scaleX: 1, duration: 0.55, ease: "power2.out" })
          .call(() => row?.classList.remove("is-active"))
          .call(() => row?.classList.add("is-done"))
          .to(
            check,
            { opacity: 1, scale: 1, duration: 0.25, ease: "back.out(3)" },
            "-=0.15",
          );
      });

      // Hold on the completed state, then reset for the loop
      tl.to({}, { duration: 1.2 });
      tl.call(() => {
        if (commandRef.current) commandRef.current.textContent = "";
        rowRefs.current.forEach((row) => row?.classList.remove("is-done"));
      });
      tl.set(checkRefs.current, { opacity: 0, scale: 0.5 });
      tl.set(barRefs.current, { scaleX: 0 });
    },
    { scope: root },
  );

  return (
    <div
      ref={root}
      className="relative mx-auto w-full max-w-md rounded-2xl border border-border/50 bg-card/80 glass shadow-xl overflow-hidden text-left"
      aria-hidden="true"
    >
      <div className="flex items-center gap-1.5 border-b border-border/50 px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
        <span className="h-2.5 w-2.5 rounded-full bg-accent/60" />
        <span className="h-2.5 w-2.5 rounded-full bg-primary/60" />
        <span className="ml-2 text-xs font-medium text-muted-foreground">
          terminal
        </span>
      </div>

      <div className="p-5 font-mono text-sm">
        <div className="flex items-center gap-2 text-foreground">
          <span className="text-primary">$</span>
          <span ref={commandRef} />
          <span ref={caretRef} className="inline-block h-4 w-2 bg-primary" />
        </div>

        <div className="mt-5 space-y-3">
          {PHASES.map((phase, i) => (
            <div
              key={phase.label}
              ref={(el) => {
                rowRefs.current[i] = el;
              }}
              className="pipeline-phase-row flex items-center gap-3 opacity-40 transition-opacity duration-300 [&.is-active]:opacity-100 [&.is-done]:opacity-100"
            >
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border">
                <Check
                  ref={(el) => {
                    checkRefs.current[i] = el;
                  }}
                  className="h-3 w-3 text-primary opacity-0"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-foreground">{phase.label}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {phase.detail}
                  </span>
                </div>
                <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    ref={(el) => {
                      barRefs.current[i] = el;
                    }}
                    className="h-full origin-left rounded-full bg-gradient-to-r from-primary to-accent"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
