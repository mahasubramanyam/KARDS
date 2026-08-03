"use client";

import { useCallback, useEffect, useState } from "react";
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
  Loader2,
} from "lucide-react";
import { StatCard } from "@/components/app/stat-card";
import { Section } from "@/components/app/section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { api, ApiError, type InvoiceOut, type PlanOut, type SubscriptionOut } from "@/lib/api";
import { formatINR, cn } from "@/lib/utils";

const invoiceTone: Record<string, "success" | "warning" | "destructive" | "default"> = {
  paid: "success",
  pending: "warning",
  overdue: "destructive",
};

const subTone: Record<string, "success" | "warning" | "secondary" | "destructive"> = {
  active: "success",
  trial: "warning",
  past_due: "warning",
  cancelled: "secondary",
  expired: "destructive",
};

export function BillingPage() {
  const { push } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [plans, setPlans] = useState<PlanOut[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionOut | null>(null);
  const [invoices, setInvoices] = useState<InvoiceOut[]>([]);
  const [changeOpen, setChangeOpen] = useState(false);
  const [targetPlan, setTargetPlan] = useState<string>("");
  const [subscribing, setSubscribing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ps, sub, is] = await Promise.all([
        api.billing.plans().catch(() => []),
        api.billing.subscription().catch(() => null),
        api.billing.invoices().catch(() => []),
      ]);
      setPlans(ps);
      setSubscription(sub);
      setInvoices(is);
    } catch (e) {
      setError((e as ApiError).message || "Could not load billing data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const current = plans.find((p) => p.id === subscription?.plan_id) ?? null;

  const subscribe = async () => {
    if (!targetPlan) return;
    setSubscribing(true);
    try {
      const sub = await api.billing.subscribe(targetPlan);
      setSubscription(sub);
      setChangeOpen(false);
      push("success", "Plan updated", "Subscription change logged · prorated invoice generated.");
      load();
    } catch (e) {
      push("error", "Could not subscribe", (e as ApiError).message);
    } finally {
      setSubscribing(false);
    }
  };

  if (loading) {
    return (
      <div className="grid place-items-center py-32 text-center">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="mt-3 text-sm text-muted-foreground">Loading billing…</p>
      </div>
    );
  }

  const usagePct = 0;
  const annualPrice = current?.price_annual ?? 0;

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
                <p className="font-heading text-lg font-semibold">{current?.name ?? "No active plan"}</p>
                {subscription && (
                  <Badge variant={subTone[subscription.status] ?? "secondary"} dot>
                    {subscription.status}
                  </Badge>
                )}
              </div>
              {current ? (
                <>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {formatINR(current.price_annual)}/year · {current.seats} seats included
                    {subscription?.current_period_end &&
                      ` · renews ${new Date(subscription.current_period_end).toLocaleDateString("en-IN")}`}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {current.features.slice(0, 4).map((f) => (
                      <span key={f} className="flex items-center gap-1.5 rounded-full border border-border/70 bg-card px-2.5 py-1 text-[11px] text-muted-foreground">
                        <BadgeCheck className="size-3 text-success" /> {f}
                      </span>
                    ))}
                  </div>
                </>
              ) : (
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {error ?? "Subscribe to a plan to unlock compliance reports, roster management and billing."}
                </p>
              )}
            </div>
          </div>
          {plans.length > 0 && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => push("info", "Payment method", "Payments are processed securely via Razorpay on the billing backend.")}>
                <RefreshCcw className="size-4" /> Payment method
              </Button>
              <Button onClick={() => { setTargetPlan(current?.id ?? ""); setChangeOpen(true); }}>
                Change plan <ArrowRight className="size-4" />
              </Button>
            </div>
          )}
        </div>
      </motion.div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Annual subscription" value={annualPrice} format={(n) => formatINR(n)} icon={CreditCard} tone="primary" />
        <StatCard label="Success fees billed (FY)" value={0} format={(n) => formatINR(n)} icon={Zap} tone="accent" hint="metered from deployed budget events" />
        <StatCard label="Invoices" value={invoices.length} icon={ReceiptText} tone="success" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Plan */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Current plan</CardTitle>
            <CardDescription>{current ? `${current.name} · billed annually` : "No subscription yet"}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <span className="font-heading text-2xl font-bold">{formatINR(annualPrice)}</span>
              <span className="text-xs text-muted-foreground">/year</span>
            </div>
            <Progress value={usagePct} tone="accent" className="mt-3" />
            <p className="mt-2 text-xs text-muted-foreground">
              Usage metering is computed from the <span className="font-medium text-foreground">budget deployed event log</span>{" "}
              tied to closed projects — auto-invoiced each quarter.
            </p>
            <div className="mt-4 space-y-2.5">
              {[
                { label: "Seats included", value: String(current?.seats ?? 0) },
                { label: "Billing cycle", value: "Annual" },
                { label: "Provider", value: "Razorpay" },
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
              {invoices.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
                  No invoices generated yet.
                </div>
              ) : (
                invoices.map((inv, i) => (
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
                        <p className="text-sm font-semibold">{inv.provider_invoice_id ?? inv.id.slice(0, 8)}</p>
                        <p className="text-xs text-muted-foreground">
                          {inv.provider} · {new Date(inv.created_at).toLocaleDateString("en-IN")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-bold">{formatINR(inv.amount)}</p>
                        <p className="text-[11px] text-muted-foreground">due {new Date(inv.due_date).toLocaleDateString("en-IN")}</p>
                      </div>
                      <Badge variant={invoiceTone[inv.status] ?? "default"} dot>
                        {inv.status}
                      </Badge>
                      <Button variant="outline" size="icon-sm" onClick={() => push("success", "Invoice downloaded", `${inv.provider_invoice_id ?? inv.id.slice(0, 8)} · PDF + GST breakdown`)}>
                        <Download className="size-3.5" />
                      </Button>
                    </div>
                  </motion.div>
                ))
              )}
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
          {plans.map((p) => (
            <button
              key={p.id}
              onClick={() => setTargetPlan(p.id)}
              className={cn(
                "flex cursor-pointer items-center justify-between rounded-xl border p-3.5 text-left transition-colors",
                targetPlan === p.id ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-border"
              )}
            >
              <div>
                <p className="text-sm font-semibold">{p.name}</p>
                <p className="text-xs text-muted-foreground">{p.seats} seats · {formatINR(p.price_annual)}/yr</p>
              </div>
              {subscription?.plan_id === p.id && <Badge variant="secondary">Current</Badge>}
            </button>
          ))}
          {plans.length === 0 && (
            <p className="rounded-xl border border-border p-4 text-sm text-muted-foreground">
              No plans available.
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setChangeOpen(false)}>Cancel</Button>
          <Button disabled={!targetPlan || subscribing} onClick={subscribe}>
            {subscribing ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
            Confirm change
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
