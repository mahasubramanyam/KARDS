"use client";

import { motion } from "framer-motion";
import {
  BadgeCheck,
  FileText,
  Zap,
  BadgePercent,
  Languages,
  Webhook,
  ShieldCheck,
  BellRing,
} from "lucide-react";
import { SectionHeading } from "./section-heading";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const bento = [
  {
    icon: BadgeCheck,
    title: "NGO Verification Engine",
    body: "Document upload, OCR first-pass, admin review, and an auto-recomputed CSR-Ready Score — every transition on an immutable audit log.",
    className: "lg:col-span-4",
    visual: "score",
  },
  {
    icon: FileText,
    title: "Board-ready compliance reports",
    body: "Quarterly PDF/XLSX reports mapped to Schedule VII, reconciled to the last rupee and hour.",
    className: "lg:col-span-4",
    visual: "report",
  },
  {
    icon: Zap,
    title: "Micro-volunteering",
    body: "Bite-sized 2–5 hour remote tasks alongside long-term roles keep engagement high.",
    className: "lg:col-span-2",
    visual: null,
  },
  {
    icon: BadgePercent,
    title: "Verifiable certificates",
    body: "Tamper-evident, QR-checkable credentials for every volunteer hour.",
    className: "lg:col-span-2",
    visual: "cert",
  },
  {
    icon: Languages,
    title: "English · हिन्दी · தமிழ்",
    body: "Regional language support so tier-2/3 NGOs can actually use the platform.",
    className: "lg:col-span-2",
    visual: null,
  },
  {
    icon: Webhook,
    title: "White-label API",
    body: "API-key scoped public REST access for CSR consultancies to embed Kards as their backend.",
    className: "lg:col-span-2",
    visual: null,
  },
  {
    icon: ShieldCheck,
    title: "DPDP & security by default",
    body: "Encrypted-at-rest documents, soft-delete + right-to-erasure, RBAC enforced server-side.",
    className: "lg:col-span-2",
    visual: null,
  },
  {
    icon: BellRing,
    title: "Smart notifications",
    body: "Template-based, digest-friendly alerts: verification, applications, reports, renewals.",
    className: "lg:col-span-2",
    visual: null,
  },
];

function ScoreVisual() {
  return (
    <div className="mt-5 space-y-2.5 rounded-xl border border-border/70 bg-background/60 p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">CSR-Ready Score</span>
        <Badge variant="success" dot>
          Verified
        </Badge>
      </div>
      {[
        { label: "Document completeness", w: 100, c: "bg-primary" },
        { label: "Document validity", w: 90, c: "bg-primary" },
        { label: "Impact track record", w: 85, c: "bg-accent" },
        { label: "Manual review", w: 80, c: "bg-success" },
      ].map((r) => (
        <div key={r.label} className="flex items-center gap-2.5">
          <span className="w-36 text-[11px] text-muted-foreground">{r.label}</span>
          <Progress value={r.w} className="h-1.5 flex-1" tone="primary" barClassName={r.c} />
          <span className="w-8 text-right text-[11px] font-medium tabular-nums">{r.w}</span>
        </div>
      ))}
    </div>
  );
}

function ReportVisual() {
  return (
    <div className="mt-5 space-y-2.5 rounded-xl border border-border/70 bg-background/60 p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Q1 FY 2026 · Schedule VII</span>
        <Badge variant="accent">PDF ready</Badge>
      </div>
      {[
        { label: "Education", w: 70, c: "bg-primary" },
        { label: "Health", w: 46, c: "bg-success" },
        { label: "Environment", w: 38, c: "bg-[hsl(120,45%,42%)]" },
        { label: "Livelihood", w: 30, c: "bg-accent" },
      ].map((r) => (
        <div key={r.label} className="flex items-center gap-2.5">
          <span className="w-24 text-[11px] text-muted-foreground">{r.label}</span>
          <Progress value={r.w} className="h-1.5 flex-1" tone="primary" barClassName={r.c} />
        </div>
      ))}
    </div>
  );
}

function CertVisual() {
  return (
    <div className="mt-5 flex items-center gap-3 rounded-xl border border-border/70 bg-background/60 p-4">
      <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-success/15">
        <BadgeCheck className="size-5 text-success" />
      </div>
      <div>
        <p className="text-xs font-semibold">Verified certificate</p>
        <p className="font-mono text-[10px] text-muted-foreground">KRD-7FX2-9QPT-44</p>
      </div>
    </div>
  );
}

export function Features() {
  return (
    <section className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="The platform"
          title={
            <>
              Everything the old platforms do — <span className="text-gradient">plus the revenue layer</span>
            </>
          }
          subtitle="Volunteer matching stays free at the top of the funnel. The paid core: verification, compliance reporting, billing and white-label access."
        />

        <div className="grid gap-4 lg:grid-cols-6">
          {bento.map((b, i) => (
            <motion.div
              key={b.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.55, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                "group relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lift",
                b.className
              )}
            >
              <div className="absolute -right-8 -top-8 size-24 rounded-full bg-primary/5 blur-2xl transition-colors group-hover:bg-primary/10" />
              <div className="flex items-start gap-3">
                <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <b.icon className="size-5" />
                </div>
                <div>
                  <h3 className="font-heading text-base font-semibold">{b.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{b.body}</p>
                </div>
              </div>
              {b.visual === "score" && <ScoreVisual />}
              {b.visual === "report" && <ReportVisual />}
              {b.visual === "cert" && <CertVisual />}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
