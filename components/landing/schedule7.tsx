"use client";

import { motion } from "framer-motion";
import {
  GraduationCap,
  HeartPulse,
  Leaf,
  Briefcase,
  LifeBuoy,
  Palette,
  Users2,
  Soup,
  Trophy,
} from "lucide-react";
import { SectionHeading } from "./section-heading";
import { SCHEDULE_VII_META, ScheduleVII } from "@/lib/types";

const rows: { category: ScheduleVII; icon: typeof Leaf; blurb: string }[] = [
  { category: "education", icon: GraduationCap, blurb: "Schooling, digital literacy, scholarships" },
  { category: "health", icon: HeartPulse, blurb: "Camps, nutrition, sanitation" },
  { category: "environment", icon: Leaf, blurb: "Watershed, afforestation, clean energy" },
  { category: "livelihood", icon: Briefcase, blurb: "Skill training, farmer producer orgs" },
  { category: "disaster_relief", icon: LifeBuoy, blurb: "Relief, rehabilitation, preparedness" },
  { category: "heritage", icon: Palette, blurb: "Arts, culture, heritage conservation" },
  { category: "gender", icon: Users2, blurb: "Women's empowerment, equal opportunity" },
  { category: "hunger", icon: Soup, blurb: "Mid-day meals, nutrition kits" },
  { category: "sports", icon: Trophy, blurb: "Grassroots sport and coaching" },
];

export function Schedule7() {
  return (
    <section className="relative overflow-hidden py-24 sm:py-32">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Compliance built-in"
          title={
            <>
              Every project mapped to the <span className="text-gradient-gold">Companies Act Schedule VII</span>
            </>
          }
          subtitle="Opportunity creation forces a legal category at the source — so every hour and rupee rolls up into a compliant report without manual re-tagging."
        />

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((r, i) => {
            const meta = SCHEDULE_VII_META[r.category];
            return (
              <motion.div
                key={r.category}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, delay: i * 0.04 }}
                className="group flex items-start gap-3.5 rounded-2xl border border-border bg-card p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift"
              >
                <div
                  className="grid size-11 shrink-0 place-items-center rounded-xl transition-transform duration-300 group-hover:scale-110"
                  style={{ background: meta.soft, color: meta.color }}
                >
                  <r.icon className="size-5" />
                </div>
                <div>
                  <p className="font-heading text-[15px] font-semibold">{meta.label}</p>
                  <p className="mt-0.5 text-[13px] leading-relaxed text-muted-foreground">{r.blurb}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-8 text-center text-sm text-muted-foreground"
        >
          Plus <span className="font-semibold text-foreground">other</span> — for activities covered under other
          heads of Schedule VII as notified from time to time.
        </motion.p>
      </div>
    </section>
  );
}
