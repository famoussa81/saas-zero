"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export interface TimelineStep {
  phase: number;
  title: string;
  desc: string;
  duration: string;
  icon: string;
}

interface PipelineTimelineProps {
  steps: TimelineStep[];
}

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * Scroll-linked continuation of the hero terminal: the connecting line
 * draws downward as the reader scrolls, and each phase's icon lights up
 * when it crosses the trigger point — same "watching the pipeline run"
 * language as PipelineHero, now tied to the reader's own scroll instead
 * of a timed loop.
 */
export function PipelineTimeline({ steps }: PipelineTimelineProps) {
  const root = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const iconRefs = useRef<(HTMLDivElement | null)[]>([]);

  useGSAP(
    () => {
      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      if (prefersReducedMotion) {
        iconRefs.current.forEach((el) => el?.classList.add("is-reached"));
        return;
      }

      if (lineRef.current) {
        gsap.set(lineRef.current, { scaleY: 0, transformOrigin: "top" });
        gsap.to(lineRef.current, {
          scaleY: 1,
          ease: "none",
          scrollTrigger: {
            trigger: root.current,
            start: "top 70%",
            end: "bottom 60%",
            scrub: 0.5,
          },
        });
      }

      iconRefs.current.forEach((el) => {
        if (!el) return;
        ScrollTrigger.create({
          trigger: el,
          start: "top 75%",
          onEnter: () => el.classList.add("is-reached"),
          onLeaveBack: () => el.classList.remove("is-reached"),
        });
      });
    },
    { scope: root },
  );

  return (
    <div ref={root} className="relative">
      <div
        ref={lineRef}
        className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-primary to-accent -translate-x-1/2"
      />

      <div className="space-y-12">
        {steps.map((step, index) => (
          <div
            key={step.phase}
            className="scroll-reveal scroll-reveal-delay-1 relative lg:w-1/2 lg:pr-12 lg:pl-0 md:pl-16"
            style={{ transitionDelay: `${index * 100}ms` }}
          >
            <div className="relative z-10">
              <div className="flex items-start gap-4">
                <div
                  ref={(el) => {
                    iconRefs.current[index] = el;
                  }}
                  className="pipeline-timeline-icon relative z-10 flex-shrink-0 w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-2xl transition-all duration-300 [&.is-reached]:bg-primary/20 [&.is-reached]:border-primary [&.is-reached]:scale-110"
                >
                  {step.icon}
                </div>
                <div className="relative">
                  <div className="absolute left-[7px] top-14 bottom-0 w-px bg-border/50 lg:hidden" />
                  <div className="bg-card border border-border/50 rounded-2xl p-6 glass hover-lift transition-all">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="font-display font-bold text-lg text-primary">
                        Phase {step.phase}
                      </span>
                      <span className="text-sm font-medium text-muted-foreground px-2 py-1 rounded-full bg-muted">
                        {step.duration}
                      </span>
                    </div>
                    <h3 className="font-display font-bold text-xl text-foreground mb-2">
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
