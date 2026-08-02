"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  IndianRupee,
  Clock3,
  Users,
  HeartHandshake,
  FileText,
  ArrowUpRight,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { StatCard } from "@/components/app/stat-card";
import { Section } from "@/components/app/section";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { api, ApiError, type BudgetOut, type ProjectOut, type InvoiceOut } from "@/lib/api";
import { formatINR } from "@/lib/utils";

export function CompanyDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [budgets, setBudgets] = useState<BudgetOut[]>([]);
  const [projects, setProjects] = useState<ProjectOut[]>([]);
  const [invoices, setInvoices] = useState<InvoiceOut[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [bs, ps, is] = await Promise.all([
        api.csr.budgets().catch(() => []),
        api.csr.projects({ limit: 10 }).then((p) => p.items).catch(() => []),
        api.billing.invoices().catch(() => []),
      ]);
      setBudgets(bs);
      setProjects(ps);
      setInvoices(is);
    } catch (e) {
      setError((e as ApiError).message || "Could not load company dashboard data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="grid place-items-center py-32 text-center">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="mt-3 text-sm text-muted-foreground">Loading CSR Command Center…</p>
      </div>
    );
  }

  const activeBudget = budgets[0];
  const totalBudget = activeBudget?.total_amount ?? 0;

  return (
    <div>
      {/* Budget banner */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="rounded-2xl border border-primary/25 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-5"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary/15">
              <IndianRupee className="size-6 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-heading text-lg font-semibold">
                  {activeBudget ? `FY ${activeBudget.fiscal_year} CSR budget` : "No CSR budget set"}
                </p>
                <Badge variant="success" dot>Active ledger</Badge>
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {activeBudget ? `Total allocated: ${formatINR(totalBudget)}` : "Set your annual budget to start tracking compliance."}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/app/company/reports">
              <Button>
                <FileText className="size-4" /> Generate report
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Hours logged (FY)" value={0} format={(n) => n.toLocaleString("en-IN")} icon={Clock3} tone="primary" />
        <StatCard label="Budget deployed" value={totalBudget} format={(n) => formatINR(n)} icon={IndianRupee} tone="success" />
        <StatCard label="Employee volunteers" value={0} icon={Users} tone="accent" />
        <StatCard label="NGOs engaged" value={projects.length} icon={HeartHandshake} tone="violet" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Section title="Active projects" subtitle="Live CSR projects deployed in PostgreSQL">
          {projects.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
              No projects created yet. Create a project and invite partner NGOs.
            </div>
          ) : (
            <div className="space-y-3">
              {projects.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
                  <div>
                    <p className="font-semibold">{p.title}</p>
                    <p className="text-xs text-muted-foreground capitalize">{p.category} · Budget: {formatINR(p.budget_amount)}</p>
                  </div>
                  <Badge variant={p.status === "active" ? "success" : "secondary"}>{p.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title="Billing & Invoices" subtitle="Razorpay & manual invoices">
          {invoices.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
              No invoices generated yet.
            </div>
          ) : (
            <div className="space-y-3">
              {invoices.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
                  <div>
                    <p className="font-semibold">{inv.provider_invoice_id ?? inv.id.slice(0, 8)}</p>
                    <p className="text-xs text-muted-foreground">Due: {inv.due_date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatINR(inv.amount)}</p>
                    <Badge variant={inv.status === "paid" ? "success" : "warning"}>{inv.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}
