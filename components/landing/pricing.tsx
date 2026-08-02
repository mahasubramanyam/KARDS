"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Sparkles, ArrowRight } from "lucide-react";
import { SectionHeading } from "./section-heading";
import { Button } from "@/components/ui/button";
import { PLANS } from "@/lib/types";
import { formatINR } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function Pricing() {
  return (
    <section id="nav_companies" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Pricing"
          title={
            <>
              Free for volunteers &amp; NGOs.{" "}
              <span className="text-gradient">Priced for companies that must comply.</span>
            </>
          }
          subtitle="Corporate subscriptions gate the paid engine — compliance reports, billing, roster management and white-label access. All plans billed annually."
        />

        <div className="grid gap-6 lg:grid-cols-3">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.tier}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                "relative flex flex-col rounded-3xl border p-7 transition-all duration-300",
                plan.highlighted
                  ? "border-primary/40 bg-gradient-to-b from-primary/8 to-card shadow-glow lg:-translate-y-3"
                  : "border-border bg-card hover:-translate-y-1 hover:shadow-lift"
              )}
            >
              {plan.highlighted && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-accent px-3.5 py-1 text-xs font-semibold text-accent-foreground shadow-sm">
                    <Sparkles className="size-3" /> Most popular
                  </span>
                </div>
              )}
              <div className="mb-1 flex items-center justify-between">
                <h3 className="font-heading text-lg font-bold">{plan.name}</h3>
                <span className="text-xs font-medium text-muted-foreground">{plan.seats} seats</span>
              </div>
              <p className="text-sm text-muted-foreground">{plan.tagline}</p>

              <div className="mt-6 flex items-baseline gap-1.5">
                <span className="font-heading text-4xl font-bold tracking-tight">
                  {formatINR(plan.priceAnnual)}
                </span>
                <span className="text-sm text-muted-foreground">/year</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                ≈ {formatINR(plan.priceMonthly)}/mo billed annually · GST extra
              </p>

              <ul className="mt-6 flex-1 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <span
                      className={cn(
                        "mt-0.5 grid size-4.5 shrink-0 place-items-center rounded-full",
                        plan.highlighted ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                      )}
                    >
                      <Check className="size-3" strokeWidth={3} />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>

              <Link href="/auth/register" className="mt-7 block">
                <Button
                  variant={plan.highlighted ? "glow" : "outline"}
                  size="lg"
                  className="group w-full"
                >
                  Start with {plan.name}
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          className="mt-10 flex flex-col items-center gap-3 text-center"
        >
          <p className="text-sm text-muted-foreground">
            Success fee: a small <span className="font-semibold text-foreground">% of CSR budget deployed</span>{" "}
            through the platform. NGO fast-track verification and premium volunteer certificates are optional paid add-ons.
          </p>
          <p className="text-sm text-muted-foreground">
            White-label &amp; API licensing for consultancies —{" "}
            <Link href="/auth/register" className="font-semibold text-primary underline-offset-4 hover:underline">
              talk to sales
            </Link>
            .
          </p>
        </motion.div>
      </div>
    </section>
  );
}
