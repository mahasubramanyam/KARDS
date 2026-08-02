"use client";

import { Building2, HandHeart, Landmark, Lightbulb, Sprout, Stethoscope } from "lucide-react";

const partners = [
  { name: "Nexora", icon: Building2 },
  { name: "Vaartha", icon: Landmark },
  { name: "Siksha Setu", icon: Lightbulb },
  { name: "Paani Mitra", icon: Sprout },
  { name: "Arogya Gram", icon: Stethoscope },
  { name: "Udaya Co-op", icon: HandHeart },
  { name: "Kisan Prerna", icon: Sprout },
  { name: "Aarogya Setu", icon: Stethoscope },
  { name: "Prakriti", icon: Sprout },
  { name: "Shiksharth", icon: Lightbulb },
];

export function LogosMarquee() {
  return (
    <section className="border-y border-border/60 bg-card/40 py-10">
      <p className="mb-6 text-center text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        NGOs verified · Companies deploying · Volunteers giving
      </p>
      <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
        <div className="animate-marquee flex w-max gap-4 pr-4">
          {[...partners, ...partners].map((p, i) => (
            <div
              key={`${p.name}-${i}`}
              className="flex items-center gap-2.5 rounded-full border border-border/70 bg-card px-5 py-2.5 text-sm font-medium text-muted-foreground"
            >
              <p.icon className="size-4 text-primary/70" />
              {p.name}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
