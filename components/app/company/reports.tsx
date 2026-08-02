"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Download,
  Loader2,
  CheckCircle2,
  Lock,
  FileSpreadsheet,
  ArrowUpRight,
  History,
  Layers,
  AlertTriangle,
} from "lucide-react";
import { StatCard } from "@/components/app/stat-card";
import { Section } from "@/components/app/section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { reports } from "@/lib/data";
import { SCHEDULE_VII_META, ScheduleVII, Report } from "@/lib/types";
import { formatINR, cn } from "@/lib/utils";

export function ReportsPage() {
  const { push } = useToast();
  const [list, setList] = useState<Report[]>(reports);
  const [period, setPeriod] = useState("Q2 FY 2026");
  const [scope, setScope] = useState("company");
  const [generating, setGenerating] = useState(false);
  const [job, setJob] = useState<{ id: string; phase: "queued" | "extracting" | "rendering" | "done" } | null>(null);
  const [finalDialog, setFinalDialog] = useState<string | null>(null);

  const startGeneration = () => {
    setGenerating(true);
    setJob({ id: "job_q2_2026", phase: "queued" });
    setTimeout(() => setJob({ id: "job_q2_2026", phase: "extracting" }), 900);
    setTimeout(() => setJob({ id: "job_q2_2026", phase: "rendering" }), 1800);
    setTimeout(() => {
      setJob({ id: "job_q2_2026", phase: "done" });
      setList((l) => [
        {
          id: "rep-new",
          period,
          status: "ready",
          totalHours: 5420,
          totalBudgetDeployed: 13800000,
          volunteers: 389,
          ngoCount: 7,
          scheduleVIIBreakdown: [],
          deptBreakdown: [],
          generatedAt: new Date().toISOString().slice(0, 10),
          downloaded: 0,
        },
        ...l.filter((r) => r.id !== "rep-2"),
      ]);
      setGenerating(false);
      setTimeout(() => setJob(null), 800);
      push("success", "Report ready", `${period} compliance report generated asynchronously.`);
    }, 2700);
  };

  const phases: { key: string; label: string }[] = [
    { key: "queued", label: "Queued" },
    { key: "extracting", label: "Reconciling 5,420 records" },
    { key: "rendering", label: "Rendering PDF/XLSX" },
    { key: "done", label: "Ready" },
  ];

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
              Board-ready PDF (WeasyPrint) and XLSX for finance. Aggregates reconcile exactly against Application
              &amp; Certificate records — auditors can verify every total. Runs asynchronously in batches for
              companies with 10,000+ hour-records.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Period</label>
                <Select value={period} onValueChange={setPeriod} options={["Q1 FY 2026", "Q2 FY 2026", "Q3 FY 2026", "Full FY 2026-27", "Custom range"].map((v) => ({ value: v, label: v }))} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Scope</label>
                <Select value={scope} onValueChange={setScope} options={[{ value: "company", label: "Whole company" }, { value: "department", label: "By department" }, { value: "schedule7", label: "By Schedule VII" }].map((v) => ({ value: v.value, label: v.label }))} />
              </div>
            </div>
          </div>
          <Button size="lg" variant="glow" onClick={startGeneration} disabled={generating}>
            {generating ? <Loader2 className="size-4 animate-spin" /> : <FileText className="size-4" />}
            {generating ? "Generating…" : `Generate ${period}`}
          </Button>
        </div>

        {/* Job progress */}
        <AnimatePresence>
          {job && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-4">
                <span className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
                  <Loader2 className="size-3.5 animate-spin text-primary" /> job_{job.id}
                </span>
                <div className="flex flex-1 flex-wrap items-center gap-2">
                  {phases.map((p, i) => {
                    const activeIdx = phases.findIndex((x) => x.key === job.phase);
                    const state = i < activeIdx ? "done" : i === activeIdx ? "active" : "idle";
                    return (
                      <div key={p.key} className="flex items-center gap-2">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium",
                            state === "done" && "bg-success/12 text-success",
                            state === "active" && "bg-primary/10 text-primary",
                            state === "idle" && "bg-muted text-muted-foreground"
                          )}
                        >
                          {state === "done" && <CheckCircle2 className="size-3" />}
                          {state === "active" && <Loader2 className="size-3 animate-spin" />}
                          {p.label}
                        </span>
                        {i < phases.length - 1 && <span className="text-muted-foreground/40">→</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Stats */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Reports generated" value={14} icon={FileText} tone="primary" />
        <StatCard label="Report downloads" value={38} icon={Download} tone="accent" />
        <StatCard label="Audit queries received" value={0} icon={CheckCircle2} tone="success" hint="zero follow-ups in FY26" />
      </div>

      {/* Report list */}
      <Section title="Your reports" subtitle="Regeneration is idempotent — never double-counts. Final reports snapshot their source data.">
        <div className="space-y-4">
          {list.map((r, i) => (
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
                      <p className="font-heading text-base font-semibold">{r.period}</p>
                      {r.status === "generating" && <Badge variant="warning" dot>Generating</Badge>}
                      {r.status === "ready" && <Badge variant="success" dot>Ready</Badge>}
                      {r.status === "final" && <Badge variant="accent" dot>Final · snapshot locked</Badge>}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {r.id === "rep-new"
                        ? "Generated just now · reconciled to the last rupee"
                        : `Generated ${r.generatedAt} · downloaded ${r.downloaded}×`}
                    </p>
                  </div>
                </div>

                {r.status === "ready" && (
                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => push("success", "PDF downloaded", `${r.period} · board-ready format`)}>
                      <FileText className="size-3.5" /> PDF
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => push("success", "XLSX downloaded", `${r.period} · for finance teams`)}>
                      <FileSpreadsheet className="size-3.5" /> XLSX
                    </Button>
                    <Button size="sm" variant="accent" onClick={() => setFinalDialog(r.id)}>
                      <Lock className="size-3.5" /> Mark final
                    </Button>
                  </div>
                )}
              </div>

              {r.scheduleVIIBreakdown.length > 0 && (
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {r.scheduleVIIBreakdown.map((b) => {
                    const meta = SCHEDULE_VII_META[b.category];
                    return (
                      <div key={b.category} className="rounded-xl border border-border/70 bg-background/50 p-3">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-xs font-medium">
                            <span className="size-2 rounded-full" style={{ background: meta.color }} />
                            {meta.label}
                          </span>
                          <span className="text-xs font-semibold">{formatINR(b.budget)}</span>
                        </div>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          {b.hours.toLocaleString()} hrs · {b.volunteers} volunteers
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}

              {r.status === "ready" && r.totalHours > 0 && (
                <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t border-border/60 pt-4 text-xs text-muted-foreground">
                  <span><span className="font-semibold text-foreground">{r.totalHours.toLocaleString()}</span> hours</span>
                  <span><span className="font-semibold text-foreground">{formatINR(r.totalBudgetDeployed)}</span> budget</span>
                  <span><span className="font-semibold text-foreground">{r.volunteers}</span> volunteers</span>
                  <span><span className="font-semibold text-foreground">{r.ngoCount}</span> NGOs</span>
                  <span className="flex items-center gap-1"><Layers className="size-3" /> Schedule VII breakdown included</span>
                </div>
              )}
            </motion.div>
          ))}
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
          <Button
            onClick={() => {
              setList((l) => l.map((r) => (r.id === finalDialog ? { ...r, status: "final" as const } : r)));
              setFinalDialog(null);
              push("success", "Report finalized", "Snapshot locked · logged to audit trail.");
            }}
          >
            <Lock className="size-4" /> Finalize & snapshot
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
