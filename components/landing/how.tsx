"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { FileCheck2, Handshake, ScrollText, ClipboardCheck } from "lucide-react";
import { SectionHeading } from "./section-heading";
import { Button } from "@/components/ui/button";
import { fadeUp, staggerContainer } from "@/lib/motion";

const steps = [
  {
    icon: FileCheck2,
    step: "01",
    title: "Verify & CSR-ready",
    body: "NGOs upload 12A, 80G and FCRA documents. OCR + manual review produce a weighted CSR-Ready Score companies can trust.",
  },
  {
    icon: ClipboardCheck,
    step: "02",
    title: "Match & deploy",
    body: "Companies allocate CSR budget and hours to Schedule VII categories. Employees get skill-matched volunteering slots and micro-tasks.",
  },
  {
    icon: ScrollText,
    step: "03",
    title: "Track & reconcile",
    body: "Hours, budget and beneficiaries reconcile exactly against applications and certificates — auditors can verify every total.",
  },
  {
    icon: Handshake,
    step: "04",
    title: "Report & prove",
    body: "Quarterly, per-department, per-category reports generate automatically in board-ready PDF or XLSX — no spreadsheet archaeology.",
  },
];

export function HowItWorks() {
  return (
    <section className="relative overflow-hidden py-24 sm:py-32">
      <div className="absolute inset-x-0 top-1/2 -z-10 h-64 -translate-y-1/2 bg-primary/8 blur-[120px]" />
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="How it works"
          title="From unverified NGO to board-ready compliance, in one loop"
          subtitle="The four-stage engine that powers every Kards workflow — for NGOs, companies and volunteers alike."
        />

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
        >
          {steps.map((s, i) => (
            <motion.div
              key={s.step}
              variants={fadeUp}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
            >
              <div className="absolute right-4 top-4 font-heading text-5xl font-bold text-muted/80 transition-colors group-hover:text-primary/10">
                {s.step}
              </div>
              <div className="mb-5 grid size-11 place-items-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <s.icon className="size-5 text-primary transition-colors group-hover:text-primary-foreground" />
              </div>
              <h3 className="font-heading text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
              {i < steps.length - 1 && (
                <span className="absolute -right-3 top-1/2 hidden h-px w-6 -translate-y-1/2 bg-border lg:block" />
              )}
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
          className="mt-10 flex justify-center"
        >
          <Link href="/auth/register">
            <Button size="lg" className="shadow-glow">
              Start with a free NGO or volunteer account
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
