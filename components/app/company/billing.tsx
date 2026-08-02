"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  CreditCard,
  ReceiptText,
  Zap,
  Download,
  ShieldCheck,
  ArrowRight,
  BadgeCheck,
  RefreshCcw,
} from "lucide-react";
import { StatCard } from "@/components/app/stat-card";
import { Section } from "@/components/app/section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { companies, invoices } from "@/lib/data";
import { PLANS } from "@/lib/types";
import { formatINR, cn } from "@/lib/utils";

const invoiceTone = { paid: "success", pending: "warning", overdue: "destructive" } as const;

export function BillingPage() {
  const { push } = useToast();
  const co = companies[0];
  const current = PLANS.find((p) => p.tier === co.planTier)!;
  const [changeOpen, setChangeOpen] = useState(false);
  const [targetPlan, setTargetPlan] = useState(current.name);
  const [grace, setGrace] = useState(false);

  const successFee = 186000;
  const budgetDeployed = 12400000;
  const usagePct = Math.round((successFee / (budgetDeployed * 0.015)) * 100);

  return (
    <div>
      {/* Current plan */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-5"
      >
        <div className="absolute -right-10 -top-10 size-40 rounded-full bg-primary/10 blur-3xl" />
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary/15">
              <CreditCard className="size-6 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-heading text-lg font-semibold">Growth plan</p>
                <Badge variant="accent">Active</Badge>
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {formatINR(current.priceAnnual)}/year · {co.seatsIncluded} seats included · renews{" "}
                {co.renewalDate} · paid via Razorpay (GST invoice included)
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {current.features.slice(0, 4).map((f) => (
                  <span key={f} className="flex items-center gap-1.5 rounded-full border border-border/70 bg-card px-2.5 py-1 text-[11px] text-muted-foreground">
                    <BadgeCheck className="size-3 text-success" /> {f}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setGrace(true)}>
              <RefreshCcw className="size-4" /> Payment method
            </Button>
            <Button onClick={() => setChangeOpen(true)}>
              Change plan <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      </motion.div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Annual subscription" value={current.priceAnnual} format={(n) => formatINR(n)} icon={CreditCard} tone="primary" />
        <StatCard label="Success fees billed (FY)" value={278000} format={(n) => formatINR(n)} icon={Zap} tone="accent" hint="1.5% of deployed budget" />
        <StatCard label="Invoices" value={3} icon={ReceiptText} tone="success" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Usage metering */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Success fee metering</CardTitle>
            <CardDescription>1.5% of budget deployed through Kards</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <span className="font-heading text-2xl font-bold">{formatINR(successFee)}</span>
              <span className="text-xs text-muted-foreground">Q3 FY 2026</span>
            </div>
            <Progress value={usagePct} tone="accent" className="mt-3" />
            <p className="mt-2 text-xs text-muted-foreground">
              Metered from the <span className="font-medium text-foreground">budget deployed event log</span>{" "}
              tied to closed projects — auto-invoiced each quarter.
            </p>
            <div className="mt-4 space-y-2.5">
              {[
                { label: "Budget deployed (Q3)", value: formatINR(budgetDeployed) },
                { label: "Rate", value: "1.5%" },
                { label: "Fee accrued", value: formatINR(successFee) },
              ].map((r) => (
                <div key={r.label} className="flex items-center justify-between border-b border-border/60 pb-2 text-sm last:border-0">
                  <span className="text-muted-foreground">{r.label}</span>
                  <span className="font-semibold">{r.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Invoices */}
        <div className="lg:col-span-2">
          <Section title="Invoices" subtitle="GST-compliant, reconciled against Razorpay webhooks.">
            <div className="space-y-3">
              {invoices.map((inv, i) => (
                <motion.div
                  key={inv.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.06 }}
                  className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted">
                      <ReceiptText className="size-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{inv.number}</p>
                      <p className="text-xs text-muted-foreground">{inv.period}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-bold">{formatINR(inv.amount)}</p>
                      <p className="text-[11px] text-muted-foreground">due {inv.dueDate}</p>
                    </div>
                    <Badge variant={invoiceTone[inv.status]} dot>
                      {inv.status}
                    </Badge>
                    <Button variant="outline" size="icon-sm" onClick={() => push("success", "Invoice downloaded", `${inv.number} · PDF + GST breakdown`)}>
                      <Download className="size-3.5" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </Section>
        </div>
      </div>

      {/* Reliability note */}
      <Card className="mt-6">
        <CardContent className="flex items-start gap-3 p-5">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-success" />
          <div className="text-sm">
            <p className="font-semibold">Billing reliability</p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              Webhook handlers are <span className="font-medium text-foreground">idempotent (deduped on event ID)</span>.
              Failed renewals get a <span className="font-medium text-foreground">grace period</span> before any
              feature lockout — never an instant cutoff. Upgrades/downgrades are prorated correctly.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Change plan dialog */}
      <Dialog open={changeOpen} onOpenChange={setChangeOpen}>
        <DialogHeader>
          <DialogTitle>Change your plan</DialogTitle>
          <DialogDescription>Prorated on change · billed annually · GST extra</DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          {PLANS.map((p) => (
            <button
              key={p.tier}
              onClick={() => setTargetPlan(p.name)}
              className={cn(
                "flex cursor-pointer items-center justify-between rounded-xl border p-3.5 text-left transition-colors",
                targetPlan === p.name ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-border"
              )}
            >
              <div>
                <p className="text-sm font-semibold">{p.name}</p>
                <p className="text-xs text-muted-foreground">{p.seats} seats · {formatINR(p.priceAnnual)}/yr</p>
              </div>
              {p.tier === co.planTier && <Badge variant="secondary">Current</Badge>}
            </button>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setChangeOpen(false)}>Cancel</Button>
          <Button
            onClick={() => {
              setChangeOpen(false);
              push("success", "Plan change requested", `${targetPlan} · prorated invoice generated.`);
            }}
          >
            Confirm change
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Grace period dialog */}
      <Dialog open={grace} onOpenChange={setGrace}>
        <DialogHeader>
          <DialogTitle>Payment method</DialogTitle>
          <DialogDescription>Managed securely via Razorpay.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-xl border border-border p-3.5">
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary font-semibold">RZP</span>
              <div>
                <p className="text-sm font-medium">HDFC Bank ·••• 4281</p>
                <p className="text-xs text-muted-foreground">Expires 08/29 · UPI linked</p>
              </div>
            </div>
            <Badge variant="success" dot>Primary</Badge>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            If a renewal payment fails, features stay active during a <span className="font-medium text-foreground">7-day grace period</span>.
            Webhook reconciliation keeps Kards and Razorpay in sync as source of truth.
          </p>
        </div>
        <DialogFooter>
          <Button onClick={() => setGrace(false)}>Close</Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
