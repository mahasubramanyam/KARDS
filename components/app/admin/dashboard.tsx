"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Users,
  Building2,
  ArrowUpRight,
  Clock3,
  Scale,
  KeyRound,
  ScrollText,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { StatCard } from "@/components/app/stat-card";
import { Section } from "@/components/app/section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { api, ApiError, type AuditOut, type VerificationRequestOut } from "@/lib/api";

export function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditOut[]>([]);
  const [queue, setQueue] = useState<VerificationRequestOut[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [auditPage, queuePage] = await Promise.all([
        api.admin.auditLogs({ limit: 10 }).catch(() => ({ items: [], total: 0 })),
        api.verification.queue({ limit: 10 }).catch(() => ({ items: [], total: 0 })),
      ]);
      setAuditLogs(auditPage.items);
      setQueue(queuePage.items);
    } catch (e) {
      setError((e as ApiError).message || "Could not load admin console data.");
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
        <p className="mt-3 text-sm text-muted-foreground">Loading Admin Console…</p>
      </div>
    );
  }

  const pendingCount = queue.filter((q) => q.status === "pending").length;

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Pending verification" value={pendingCount} icon={Clock3} tone="warning" />
        <StatCard label="NGOs verified (total)" value={0} icon={ShieldCheck} tone="success" />
        <StatCard label="Active companies" value={0} icon={Building2} tone="primary" />
        <StatCard label="Open disputes" value={0} icon={Scale} tone="destructive" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Verification queue snapshot */}
        <Section title="Verification Queue" subtitle="NGO document submissions awaiting review">
          {queue.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
              No pending verification requests in queue.
            </div>
          ) : (
            <div className="space-y-3">
              {queue.map((q) => (
                <div key={q.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
                  <div>
                    <p className="font-semibold font-mono text-xs">Request {q.id.slice(0, 8)}</p>
                    <p className="text-xs text-muted-foreground">Submitted: {new Date(q.submitted_at).toLocaleDateString("en-IN")}</p>
                  </div>
                  <Badge variant={q.status === "pending" ? "warning" : "success"}>{q.status}</Badge>
                </div>
              ))}
              <Link href="/app/admin/verification">
                <Button variant="outline" className="w-full" size="sm">
                  Open full queue <ArrowUpRight className="size-3.5" />
                </Button>
              </Link>
            </div>
          )}
        </Section>

        {/* Audit Log */}
        <Section title="Audit Log" subtitle="Append-only immutable event trail">
          {auditLogs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
              No audit logs recorded yet.
            </div>
          ) : (
            <div className="space-y-3">
              {auditLogs.map((a) => (
                <div key={a.id} className="flex items-start gap-3 rounded-xl border border-border bg-card p-3.5">
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
                    <p className="truncate text-xs text-muted-foreground">Actor: {a.actor_email ?? a.actor_id ?? "system"}</p>
                  </div>
                  <span className="shrink-0 text-[10px] text-muted-foreground">{a.created_at.slice(0, 10)}</span>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}
