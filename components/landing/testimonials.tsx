"use client";

import { motion } from "framer-motion";
import { Quote, TrendingUp } from "lucide-react";
import { SectionHeading } from "./section-heading";
import { testimonials } from "@/lib/data";
import { Avatar } from "@/components/ui/avatar";

export function Testimonials() {
  return (
    <section className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Proof"
          title={
            <>
              Impact that <span className="text-gradient">speaks in metrics</span>
            </>
          }
          subtitle="NGOs who got found, companies who got audited, and volunteers who got certified."
        />

        <div className="grid gap-5 sm:grid-cols-2">
          {testimonials.map((t, i) => (
            <motion.figure
              key={t.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.55, delay: (i % 2) * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="group relative flex flex-col rounded-3xl border border-border bg-card p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
            >
              <Quote className="absolute right-6 top-6 size-8 text-primary/10" />
              <div className="mb-4 inline-flex w-fit items-center gap-1.5 rounded-full border border-success/25 bg-success/10 px-3 py-1 text-xs font-semibold text-[hsl(152,60%,32%)] dark:text-[hsl(152,60%,68%)]">
                <TrendingUp className="size-3.5" />
                {t.metric}
              </div>
              <blockquote className="flex-1 text-[15px] leading-relaxed text-foreground/90">
                “{t.quote}”
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <Avatar name={t.name} size="md" />
                <div>
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.org}</p>
                </div>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}
