"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Download,
  Loader2,
  CheckCircle2,
  Lock,
  FileSpreadsheet,
  History,
  Layers,
  AlertTriangle,
  RefreshCcw,
  Clock3,
  XCircle,
} from "lucide-react";
import { StatCard } from "@/components/app/stat-card";
import { Section } from "@/components/app/section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { api, ApiError, type ReportOut } from "@/lib/api";
import { SCHEDULE_VII_META, type ScheduleVII } from "@/lib/types";
import { formatINR, cn } from "@/lib/utils";

const statusMeta: Record<string, { label: string; variant: "warning" | "success" | "destructive" | "secondary"; dot?: boolean }> = {
  queued: { label: "Queued", variant: "warning", dot: true },
  processing: { label: "Processing", variant: "warning", dot: true },
  ready: { label: "Ready", variant: "success", dot: true },
  failed: { label: "Failed", variant: "destructive", dot: true },
};

export function ReportsPage() {
  const { push } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [list, setList] = useState<ReportOut[]>([]);
  const [generating, setGenerating] = useState(false);
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [finalDialog, setFinalDialog] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await api.reports.list({ limit: 50 });
      setList(data.items);
    } catch (e) {
      setError((e as ApiError).message || "Could not load reports.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const inFlight = list.some((r) => r.status === "queued" || r.status === "processing");
    if (!inFlight) return;
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, [list, load]);

  const startGeneration = async () => {
    if (!periodStart || !periodEnd) {
      push("error", "Select a period", "Pick both a start and end date for the report.");
      return;
    }
    setGenerating(true);
    try {
      const report = await api.reports.create({
        kind: "compliance",
        period_start: periodStart,
        period_end: periodEnd,
      });
      setList((l) => [report, ...l]);
      setPeriodStart("");
      setPeriodEnd("");
      push("success", "Report queued", "Compliance report is generating asynchronously — it will refresh automatically.");
    } catch (e) {
      push("error", "Could not generate report", (e as ApiError).message);
    } finally {
      setGenerating(false);
    }
  };

  const finalize = async (id: string) => {
    const report = list.find((r) => r.id === id);
    if (!report) return;
    try {
      const updated = await api.reports.finalize(id, {
        period_start: report.period_start,
        period_end: report.period_end,
      });
      setList((l) => l.map((r) => (r.id === id ? updated : r)));
      setFinalDialog(null);
      push("success", "Report finalized", "Snapshot locked · logged to audit trail.");
    } catch (e) {
      push("error", "Could not finalize", (e as ApiError).message);
    }
  };

  const ready = list.filter((r) => r.status === "ready").length;
  const totalExpense = list.reduce((acc, r) => acc + (r.total_expense ?? 0), 0);

  if (loading) {
    return (
      <div className="grid place-items-center py-32 text-center">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="mt-3 text-sm text-muted-foreground">Loading compliance reports…</p>
      </div>
    );
  }

  return (
    <div>
      {/* Generate card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="rounded-2xl border border-primary/25 bg-gradient-to-r from-primary/10 to-transparent p-5"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <h2 className="font-heading text-lg font-semibold">Generate compliance report</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Board-ready PDF generated from approved volunteer hours and evidence. Aggregates reconcile exactly
              against Application &amp; Certificate records — auditors can verify every total.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">Period start</Label>
                <Input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">Period end</Label>
                <Input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={load} disabled={generating}>
              <RefreshCcw className="size-4" /> Refresh
            </Button>
            <Button size="lg" variant="glow" onClick={startGeneration} disabled={generating}>
              {generating ? <Loader2 className="size-4 animate-spin" /> : <FileText className="size-4" />}
              {generating ? "Queuing…" : "Generate report"}
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Reports" value={list.length} icon={FileText} tone="primary" />
        <StatCard label="Ready / finalized" value={ready} icon={CheckCircle2} tone="success" />
        <StatCard label="Expense entries logged" value={totalExpense} format={(n) => n.toLocaleString("en-IN")} icon={Layers} tone="accent" />
      </div>

      {/* Report list */}
      <Section title="Your reports" subtitle="Regeneration is idempotent — never double-counts. Final reports snapshot their source data.">
        {error && (
          <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {error}
          </div>
        )}
        <div className="space-y-4">
          {list.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
              No reports generated yet. Pick a period above to create your first compliance report.
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {list.map((r, i) => {
                const meta = statusMeta[r.status] ?? { label: r.status, variant: "secondary" as const };
                const breakdown = r.schedule_vii_breakdown as Record<string, { hours: number; volunteers: number }> | null;
                return (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.05 }}
                    className="rounded-2xl border border-border bg-card p-5"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex items-center gap-4">
                        <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10">
                          <FileText className="size-5 text-primary" />
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-heading text-base font-semibold">
                              {new Date(r.period_start).toLocaleDateString("en-IN", { month: "short", year: "numeric" })} –{" "}
                              {new Date(r.period_end).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                            </p>
                            <Badge variant={meta.variant} dot={meta.dot}>
                              {meta.label}
                            </Badge>
                            {r.is_final && (
                              <Badge variant="accent" dot>Final · snapshot locked</Badge>
                            )}
                          </div>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            Requested {new Date(r.created_at).toLocaleDateString("en-IN")}
                            {r.status === "failed" && r.error_message && (
                              <span className="ml-2 font-medium text-destructive">{r.error_message}</span>
                            )}
                          </p>
                        </div>
                      </div>

                      {r.status === "ready" && !r.is_final && (
                        <div className="flex flex-wrap items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => push("info", "Download", "Report files are served from secure storage. Download via the reports API endpoint.")}>
                            <FileText className="size-3.5" /> PDF
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => push("info", "XLSX export", "XLSX export for finance teams is available on paid plans.")}>
                            <FileSpreadsheet className="size-3.5" /> XLSX
                          </Button>
                          <Button size="sm" variant="accent" onClick={() => setFinalDialog(r.id)}>
                            <Lock className="size-3.5" /> Mark final
                          </Button>
                        </div>
                      )}
                    </div>

                    {breakdown && Object.keys(breakdown).length > 0 && (
                      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {Object.entries(breakdown).map(([cat, values]) => {
                          const metaCat = SCHEDULE_VII_META[cat as ScheduleVII] ?? SCHEDULE_VII_META.other;
                          return (
                            <div key={cat} className="rounded-xl border border-border/70 bg-background/50 p-3">
                              <div className="flex items-center justify-between">
                                <span className="flex items-center gap-1.5 text-xs font-medium">
                                  <span className="size-2 rounded-full" style={{ background: metaCat.color }} />
                                  {metaCat.label}
                                </span>
                                <span className="text-xs font-semibold">{(values?.hours ?? 0).toFixed(0)}h</span>
                              </div>
                              <p className="mt-1 text-[11px] text-muted-foreground">
                                {(values?.volunteers ?? 0).toLocaleString("en-IN")} volunteers
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {r.status === "ready" && (r.total_hours ?? 0) > 0 && (
                      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t border-border/60 pt-4 text-xs text-muted-foreground">
                        <span>
                          <span className="font-semibold text-foreground">{(r.total_hours ?? 0).toLocaleString("en-IN")}</span> hours
                        </span>
                        <span>
                          <span className="font-semibold text-foreground">{(r.total_volunteers ?? 0).toLocaleString("en-IN")}</span> volunteers
                        </span>
                        <span>
                          <span className="font-semibold text-foreground">{formatINR(r.total_expense ?? 0)}</span> expense logged
                        </span>
                        <span className="flex items-center gap-1">
                          <Layers className="size-3" /> Schedule VII breakdown included
                        </span>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </Section>

      <Card className="mt-6">
        <CardContent className="flex items-start gap-3 p-5">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
          <div className="text-sm">
            <p className="font-semibold">Reconciliation guarantee</p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              Report totals are derived from the same Application and Certificate records an auditor would pull.
              Marking a report <span className="font-medium text-foreground">final</span> snapshots the underlying
              data — later edits to source records won't silently change it. Regenerating is idempotent.
            </p>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!finalDialog} onOpenChange={(o) => !o && setFinalDialog(null)}>
        <DialogHeader>
          <DialogTitle>Mark report as final</DialogTitle>
          <DialogDescription>
            This snapshots the underlying application &amp; certificate data. Source edits after this point won't
            change the report. This action is logged to the audit trail.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setFinalDialog(null)}>Cancel</Button>
          <Button onClick={() => finalDialog && finalize(finalDialog)}>
            <Lock className="size-4" /> Finalize & snapshot
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
