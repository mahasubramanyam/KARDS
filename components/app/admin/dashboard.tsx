"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Users,
  HeartHandshake,
  Building2,
  ArrowUpRight,
  Clock3,
  Scale,
  KeyRound,
  ScrollText,
  TrendingUp,
} from "lucide-react";
import { StatCard } from "@/components/app/stat-card";
import { Section } from "@/components/app/section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { KardsBarChart } from "@/components/ui/chart";
import { verificationQueue, disputes, auditLog, ngos } from "@/lib/data";

const weekly = [
  { week: "W1", submissions: 42, verified: 31 },
  { week: "W2", submissions: 55, verified: 40 },
  { week: "W3", submissions: 48, verified: 44 },
  { week: "W4", submissions: 62, verified: 51 },
  { week: "W5", submissions: 58, verified: 49 },
  { week: "W6", submissions: 71, verified: 58 },
];

export function AdminDashboard() {
  const pending = verificationQueue.filter((v) => v.status === "pending").length;
  const openDisputes = disputes.filter((d) => d.status === "open").length;

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Pending verification" value={pending} icon={Clock3} tone="warning" delta={{ value: "+3 today", positive: false }} />
        <StatCard label="NGOs verified (total)" value={ngos.length * 1000 + 120} format={(n) => `${n.toLocaleString("en-IN")}+`} icon={ShieldCheck} tone="success" />
        <StatCard label="Active companies" value={86} icon={Building2} tone="primary" />
        <StatCard label="Open disputes" value={openDisputes} icon={Scale} tone="destructive" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-5">
        {/* Verification throughput */}
        <Card className="lg:col-span-3">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Verification throughput</CardTitle>
              <CardDescription>Submissions vs verified · last 6 weeks</CardDescription>
            </div>
            <Badge variant="success" className="gap-1">
              <TrendingUp className="size-3" /> +18% vs last period
            </Badge>
          </CardHeader>
          <CardContent>
            <KardsBarChart
              data={weekly}
              xKey="week"
              bars={[
                { key: "submissions", name: "Submissions", color: "hsl(var(--muted-foreground))" },
                { key: "verified", name: "Verified", color: "hsl(var(--primary))" },
              ]}
              height={240}
            />
          </CardContent>
        </Card>

        {/* Queue snapshot */}
        <div className="lg:col-span-2">
          <Section title="Priority queue" subtitle="Top items needing review">
            <div className="space-y-2.5">
              {verificationQueue
                .filter((v) => v.status === "pending")
                .slice(0, 3)
                .map((v, i) => (
                  <motion.div
                    key={v.id}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.05 }}
                    className="flex items-center gap-3 rounded-xl border border-border bg-card p-3.5"
                  >
                    <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-xs font-bold">
                      {v.ngoName.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{v.ngoName}</p>
                      <p className="truncate text-xs text-muted-foreground">{v.location} · {v.docCount} docs</p>
                    </div>
                    <Badge variant={v.risk === "high" ? "destructive" : v.risk === "medium" ? "warning" : "success"}>
                      {v.risk} risk
                    </Badge>
                  </motion.div>
                ))}
              <Link href="/app/admin/verification">
                <Button variant="outline" className="w-full" size="sm">
                  Open verification queue <ArrowUpRight className="size-3.5" />
                </Button>
              </Link>
            </div>
          </Section>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Recent audit */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2">
              <ScrollText className="size-4 text-muted-foreground" /> Recent audit log
            </CardTitle>
            <Link href="/app/admin/audit" className="text-xs font-medium text-primary hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {auditLog.slice(0, 4).map((a) => (
              <div key={a.id} className="flex items-start gap-3 rounded-xl border border-border/70 p-3">
                <span
                  className={
                    a.severity === "critical"
                      ? "mt-1 size-2 shrink-0 rounded-full bg-destructive"
                      : a.severity === "warning"
                        ? "mt-1 size-2 shrink-0 rounded-full bg-warning"
                        : "mt-1 size-2 shrink-0 rounded-full bg-success"
                  }
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{a.action}</p>
                  <p className="truncate text-xs text-muted-foreground">{a.target}</p>
                </div>
                <span className="shrink-0 text-[10px] text-muted-foreground">{a.at.slice(0, 10)}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Quick actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
            <CardDescription>Admin actions are always logged immutably.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {[
              { icon: ShieldCheck, label: "Review verification queue", href: "/app/admin/verification", desc: `${pending} pending submissions` },
              { icon: Scale, label: "Resolve disputes", href: "/app/admin/disputes", desc: `${openDisputes} open disputes` },
              { icon: KeyRound, label: "Manage API keys", href: "/app/admin/api", desc: "White-label partner access" },
              { icon: Users, label: "Platform activity", href: "/app/admin/audit", desc: "Append-only audit trail" },
            ].map((a) => (
              <Link
                key={a.label}
                href={a.href}
                className="group flex items-center gap-3.5 rounded-xl border border-border p-3.5 transition-all hover:border-primary/40 hover:bg-primary/5"
              >
                <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <a.icon className="size-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{a.label}</p>
                  <p className="text-xs text-muted-foreground">{a.desc}</p>
                </div>
                <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" />
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
