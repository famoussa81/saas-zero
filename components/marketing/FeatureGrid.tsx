"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Check, Shield, Zap, BarChart3, Users, Globe } from "lucide-react";

// Icons can't cross the Server → Client Component boundary as component
// references (only plain serializable data can), so the page passes a
// string key and this map resolves it to the actual icon locally.
const ICONS = {
  shield: Shield,
  zap: Zap,
  barChart: BarChart3,
  users: Users,
  globe: Globe,
  check: Check,
} as const;

export interface Feature {
  icon: keyof typeof ICONS;
  title: string;
  description: string;
  benefit: string;
}

interface FeatureGridProps {
  features: Feature[];
}

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function FeatureGrid({ features }: FeatureGridProps) {
  const root = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLElement | null)[]>([]);

  useGSAP(
    () => {
      const cards = cardRefs.current.filter(Boolean);
      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      if (prefersReducedMotion) {
        gsap.set(cards, { opacity: 1, y: 0 });
        return;
      }

      gsap.set(cards, { opacity: 0, y: 28 });
      gsap.to(cards, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "power2.out",
        stagger: 0.08,
        scrollTrigger: {
          trigger: root.current,
          start: "top 80%",
        },
      });
    },
    { scope: root },
  );

  return (
    <div ref={root} className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {features.map((feature, index) => {
        const Icon = ICONS[feature.icon];
        return (
          <article
            key={feature.title}
            ref={(el) => {
              cardRefs.current[index] = el;
            }}
            className="group relative p-6 md:p-8 bg-card/50 border border-border/50 rounded-2xl hover-lift glass transition-all duration-300 hover:border-primary/20"
            data-testid={`feature-${index}`}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none" />
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="font-display font-bold text-xl text-foreground mb-3">
                {feature.title}
              </h3>
              <p className="text-muted-foreground mb-4 leading-relaxed">
                {feature.description}
              </p>
              <div className="flex items-center gap-2 text-sm font-medium text-primary">
                <Check className="w-4 h-4 shrink-0" />
                <span>{feature.benefit}</span>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
