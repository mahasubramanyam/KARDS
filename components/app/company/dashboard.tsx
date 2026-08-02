"use client";

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
} from "lucide-react";
import { StatCard } from "@/components/app/stat-card";
import { Section } from "@/components/app/section";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { KardsAreaChart } from "@/components/ui/chart";
import { companies, hoursTrend, scheduleVIIAllocation } from "@/lib/data";
import { SCHEDULE_VII_META, ScheduleVII } from "@/lib/types";
import { formatINR, cn } from "@/lib/utils";

export function CompanyDashboard() {
  const co = companies[0];
  const usedPct = Math.round((co.budgetCommitted / co.csrBudgetAnnual) * 100);

  const allocationRows = (Object.keys(scheduleVIIAllocation) as ScheduleVII[])
    .filter((c) => scheduleVIIAllocation[c].committed > 0)
    .map((c) => {
      const a = scheduleVIIAllocation[c];
      return { category: c, ...a, pct: Math.round((a.utilized / a.committed) * 100) };
    })
    .sort((a, b) => b.committed - a.committed);

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
                <p className="font-heading text-lg font-semibold">FY 2026-27 CSR budget</p>
                <Badge variant={usedPct > 75 ? "warning" : "success"} dot>
                  {usedPct}% utilized
                </Badge>
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {formatINR(co.budgetCommitted)} committed of {formatINR(co.csrBudgetAnnual)} ·{" "}
                {formatINR(co.csrBudgetAnnual - co.budgetCommitted)} remaining
              </p>
              <div className="mt-2.5 max-w-md">
                <Progress value={usedPct} tone={usedPct > 75 ? "warning" : "accent"} className="h-2" />
              </div>
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
        <StatCard label="Hours logged (FY)" value={4860} format={(n) => n.toLocaleString("en-IN")} icon={Clock3} tone="primary" delta={{ value: "+18% vs Q1", positive: true }} />
        <StatCard label="Budget deployed" value={12400000} format={(n) => `₹${(n / 10000000).toFixed(2)} Cr`} icon={IndianRupee} tone="success" delta={{ value: "+12%", positive: true }} />
        <StatCard label="Employee volunteers" value={342} icon={Users} tone="accent" delta={{ value: "+64 this quarter", positive: true }} />
        <StatCard label="NGOs engaged" value={6} icon={HeartHandshake} tone="violet" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-5">
        {/* Trend chart */}
        <Card className="lg:col-span-3">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Deployment trend</CardTitle>
              <CardDescription>Hours logged & budget deployed · last 11 months</CardDescription>
            </div>
            <div className="flex gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-primary" /> Hours
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-accent" /> Budget
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <KardsAreaChart
              data={hoursTrend}
              xKey="month"
              series={[
                { key: "hours", name: "Hours", color: "hsl(var(--primary))" },
                { key: "budget", name: "Budget (₹)", color: "hsl(var(--accent))", formatter: (v) => formatINR(v) },
              ]}
              height={260}
            />
          </CardContent>
        </Card>

        {/* Schedule VII allocation */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Schedule VII allocation</CardTitle>
            <CardDescription>Legal categories · committed vs utilized</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {allocationRows.slice(0, 5).map((r) => {
              const meta = SCHEDULE_VII_META[r.category];
              return (
                <div key={r.category}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 font-medium">
                      <span className="size-2 rounded-full" style={{ background: meta.color }} />
                      {meta.label}
                    </span>
                    <span className="text-muted-foreground">
                      {formatINR(r.utilized)} / {formatINR(r.committed)}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${r.pct}%` }}
                      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                      className="h-full rounded-full"
                      style={{ background: meta.color }}
                    />
                  </div>
                </div>
              );
            })}
            <Link href="/app/company/roster" className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
              Manage allocation <ArrowUpRight className="size-3" />
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Department targets + compliance status */}
      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <Section title="Department hour targets" subtitle="Roster-level CSR targets" className="lg:col-span-3">
          <Card>
            <CardContent className="p-5">
              <div className="space-y-4">
                {co.deptTargets.map((d, i) => {
                  const pct = Math.min(100, Math.round((d.hoursDone / d.hoursTarget) * 100));
                  return (
                    <div key={d.department}>
                      <div className="mb-1.5 flex items-center justify-between text-sm">
                        <span className="font-medium">{d.department}</span>
                        <span className="text-xs text-muted-foreground">
                          <span className="font-semibold text-foreground">{d.hoursDone.toLocaleString()}</span> /{" "}
                          {d.hoursTarget.toLocaleString()} hrs · {formatINR(d.budget)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Progress value={pct} className="h-2 flex-1" tone={pct >= 100 ? "success" : pct >= 60 ? "primary" : "warning"} />
                        <span className={cn("w-10 text-right text-xs font-semibold", pct >= 100 ? "text-success" : "text-muted-foreground")}>
                          {pct}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </Section>

        <div className="lg:col-span-2">
          <Section title="Compliance health">
            <div className="space-y-3">
              {[
                { icon: CheckCircle2, tone: "text-success", title: "Schedule VII tagging 100%", desc: "Every project mapped at creation", ok: true },
                { icon: CheckCircle2, tone: "text-success", title: "Certificates reconciled", desc: "Hours match applications exactly", ok: true },
                { icon: AlertTriangle, tone: "text-warning", title: "FCRA renewal pending", desc: "Siksha Setu · renews 14 Sep 2026", ok: false },
                { icon: CheckCircle2, tone: "text-success", title: "Q1 report accepted", desc: "0 audit queries from board", ok: true },
              ].map((c) => (
                <div key={c.title} className="flex items-start gap-3 rounded-xl border border-border bg-card p-3.5">
                  <c.icon className={cn("mt-0.5 size-4 shrink-0", c.tone)} />
                  <div>
                    <p className="text-sm font-medium">{c.title}</p>
                    <p className="text-xs text-muted-foreground">{c.desc}</p>
                  </div>
                </div>
              ))}
              <div className="flex items-start gap-3 rounded-xl bg-gradient-to-br from-accent/12 to-transparent border border-accent/25 p-3.5">
                <Sparkles className="mt-0.5 size-4 shrink-0 text-accent" />
                <div>
                  <p className="text-sm font-medium">Benchmarking add-on available</p>
                  <p className="text-xs text-muted-foreground">Compare your deployment against 86 anonymized companies.</p>
                </div>
              </div>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}
