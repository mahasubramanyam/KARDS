"use client";

import { motion } from "framer-motion";
import { Lock, PackageX, FileSearch, MapPin } from "lucide-react";
import { SectionHeading } from "./section-heading";
import { staggerContainer, fadeUp } from "@/lib/motion";

const ngoProblems = [
  {
    icon: FileSearch,
    title: "Missing compliance paperwork",
    body: "No 12A / 80G / FCRA on file means tier-2/3 NGOs are invisible to CSR budgets — not because they lack impact, but documentation.",
  },
  {
    icon: PackageX,
    title: "Metro-first gatekeeping",
    body: "Incumbent platforms are built for large, already-compliant NGOs in metros. The majority of India's NGOs are locked out entirely.",
  },
  {
    icon: MapPin,
    title: "No corporate-facing profile",
    body: "Small NGOs have impact stories but zero presentation layer that a CSR committee or board will take seriously.",
  },
];

const corporateProblems = [
  {
    icon: Lock,
    title: "Proof that survives the boardroom",
    body: "Companies must deploy 2% of net profit under the Companies Act — and prove it. Spreadsheet archaeology isn't audit-ready.",
  },
  {
    icon: FileSearch,
    title: "Schedule VII mapping done by hand",
    body: "Every rupee needs to map to a legal CSR category. Teams hand-reconcile hours and budgets every quarter.",
  },
  {
    icon: MapPin,
    title: "No trusted NGO pipeline",
    body: "CSR managers can't tell which tier-2/3 NGOs are legitimate and compliant, so they default to a handful of large players.",
  },
];

export function Problem() {
  return (
    <section id="how" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="The problem"
          title={
            <>
              Two linked failures keep CSR money <span className="text-gradient">stuck at the top</span>
            </>
          }
          subtitle="India's Companies Act mandates CSR spend, yet the NGOs who need it most can't access it — and the companies who must prove it can't do it cheaply."
        />

        <div className="grid gap-8 lg:grid-cols-2">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="rounded-3xl border border-border bg-card p-7 sm:p-8"
          >
            <h3 className="mb-6 flex items-center gap-2.5 font-heading text-lg font-semibold">
              <span className="grid size-8 place-items-center rounded-lg bg-destructive/10">
                <span className="size-2 rounded-full bg-destructive" />
              </span>
              On the NGO side
            </h3>
            <div className="space-y-6">
              {ngoProblems.map((p) => (
                <motion.div key={p.title} variants={fadeUp} className="flex gap-4">
                  <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-destructive/10">
                    <p.icon className="size-5 text-destructive" />
                  </div>
                  <div>
                    <p className="font-medium">{p.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="rounded-3xl border border-border bg-card p-7 sm:p-8"
          >
            <h3 className="mb-6 flex items-center gap-2.5 font-heading text-lg font-semibold">
              <span className="grid size-8 place-items-center rounded-lg bg-primary/10">
                <span className="size-2 rounded-full bg-primary" />
              </span>
              On the corporate side
            </h3>
            <div className="space-y-6">
              {corporateProblems.map((p) => (
                <motion.div key={p.title} variants={fadeUp} className="flex gap-4">
                  <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10">
                    <p.icon className="size-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{p.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
