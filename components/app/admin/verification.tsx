"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  X,
  ScanLine,
  Eye,
  FileText,
  ShieldCheck,
  AlertTriangle,
  Clock3,
  RotateCcw,
  ZoomIn,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { verificationQueue, ngos } from "@/lib/data";
import { cn } from "@/lib/utils";

function DocumentPreview({ label }: { label: string }) {
  return (
    <div className="relative mx-auto aspect-[210/297] max-w-[340px] overflow-hidden rounded-lg border border-border bg-white p-6 text-[11px] leading-relaxed text-slate-700 shadow-inner">
      <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, #000 2px, #000 3px)" }} />
      <div className="flex items-center justify-between border-b border-slate-300 pb-3">
        <span className="font-serif text-base font-bold tracking-wide text-slate-900">केंद्रीय आयकर विभाग</span>
        <span className="rounded bg-slate-200 px-2 py-0.5 font-mono text-[9px]">GOVT. OF INDIA</span>
      </div>
      <div className="mt-4 flex items-center gap-2">
        <ShieldCheck className="size-4 text-slate-500" />
        <span className="font-serif text-sm font-semibold">{label}</span>
      </div>
      <div className="mt-3 space-y-1.5 text-[10px] text-slate-600">
        <p>Registration No: <span className="font-mono font-semibold text-slate-900">AAC-12A/2022/1147</span></p>
        <p>Name of Trust: <span className="font-semibold text-slate-900">Siksha Setu Foundation</span></p>
        <p>Address: Pune, Maharashtra — 411038</p>
        <p>Section 12A: Registration for exemption</p>
        <p>Date of Registration: <span className="font-semibold">12 Mar 2022</span></p>
        <p>Validity: <span className="font-semibold">Permanent</span></p>
        <div className="mt-3 rounded border border-slate-300 p-2.5">
          <p className="font-bold text-slate-900">RO / CIT — Pune</p>
          <p className="mt-1 font-mono text-[9px]">Digitally signed · CID 7712094 · ✓ Valid</p>
        </div>
      </div>
      <div className="absolute bottom-3 left-6 right-6 flex items-center justify-between border-t border-slate-200 pt-2 text-[9px] text-slate-400">
        <span>OCR · Kards first-pass</span>
        <span className="rounded bg-emerald-100 px-1.5 text-emerald-700">FIELDS EXTRACTED ✓</span>
      </div>
    </div>
  );
}

export function AdminVerification() {
  const { push } = useToast();
  const [queue, setQueue] = useState(verificationQueue);
  const [activeId, setActiveId] = useState(queue[0].id);
  const [decision, setDecision] = useState<"approve" | "reject" | null>(null);
  const [reason, setReason] = useState("");
  const [zoom, setZoom] = useState(false);

  const active = queue.find((v) => v.id === activeId) ?? queue[0];
  const ngoMeta = ngos.find((n) => n.name.includes(active.ngoName.split(" ")[0]) || active.ngoName.includes(n.name.split(" ")[0]));

  const decide = (outcome: "approve" | "reject") => {
    setQueue((q) => q.map((v) => (v.id === activeId ? { ...v, status: outcome === "approve" ? "verified" : "rejected" } : v)));
    push(
      outcome === "approve" ? "success" : "error",
      outcome === "approve" ? "NGO verified" : "NGO rejected",
      outcome === "approve"
        ? `${active.ngoName} is now CSR-ready. Score computed & logged.`
        : `Rejection logged with reason. ${active.ngoName} notified.`
    );
    setDecision(null);
    setReason("");
  };

  const remaining = queue.filter((v) => v.status === "pending");

  return (
    <div>
      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        {/* Queue */}
        <div className="space-y-2 self-start lg:sticky lg:top-20">
          <p className="px-1 text-xs font-semibold text-muted-foreground">
            Queue · {remaining.length} pending
          </p>
          <AnimatePresence>
            {queue.map((v) => (
              <motion.button
                key={v.id}
                layout
                onClick={() => setActiveId(v.id)}
                className={cn(
                  "flex w-full cursor-pointer items-start gap-3 rounded-xl border p-3.5 text-left transition-all",
                  v.id === activeId ? "border-primary/40 bg-primary/5 ring-2 ring-primary/15" : "border-border bg-card hover:border-primary/20"
                )}
              >
                <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-xs font-bold">
                  {v.ngoName.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{v.ngoName}</p>
                  <p className="truncate text-[11px] text-muted-foreground">{v.location}</p>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <Badge variant={v.risk === "high" ? "destructive" : v.risk === "medium" ? "warning" : "success"}>
                      {v.risk}
                    </Badge>
                    {v.status !== "pending" && (
                      <Badge variant={v.status === "verified" ? "success" : "destructive"} dot>
                        {v.status}
                      </Badge>
                    )}
                    <span className="ml-auto text-[10px] text-muted-foreground">{v.submittedAt}</span>
                  </div>
                </div>
              </motion.button>
            ))}
          </AnimatePresence>
        </div>

        {/* Reviewer */}
        <div>
          <div className="rounded-2xl border border-border bg-card">
            <div className="flex flex-col gap-3 border-b border-border/70 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-heading text-base font-semibold">{active.ngoName}</h3>
                <p className="text-xs text-muted-foreground">
                  Submitted {active.submittedAt} · {active.docCount} documents · priority {active.priority}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {active.status === "pending" ? (
                  <>
                    <Button variant="outline" className="text-destructive hover:bg-destructive/5" onClick={() => setDecision("reject")}>
                      <X className="size-4" /> Reject
                    </Button>
                    <Button onClick={() => setDecision("approve")}>
                      <Check className="size-4" /> Approve & verify
                    </Button>
                  </>
                ) : (
                  <Badge variant={active.status === "verified" ? "success" : "destructive"} dot>
                    {active.status}
                  </Badge>
                )}
              </div>
            </div>

            <div className="grid gap-4 p-4 md:grid-cols-2">
              {/* Document viewer */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                    <Eye className="size-3.5" /> Original document
                  </p>
                  <button className="flex cursor-pointer items-center gap-1 text-xs text-primary hover:underline" onClick={() => setZoom(true)}>
                    <ZoomIn className="size-3.5" /> Focus view
                  </button>
                </div>
                <DocumentPreview label={active.docCount >= 3 ? "12A Registration" : "80G Deduction"} />
              </div>

              {/* OCR + checks */}
              <div className="space-y-4">
                <div>
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                    <ScanLine className="size-3.5" /> OCR extraction
                  </p>
                  <div className="space-y-2 rounded-xl border border-border/70 bg-background/50 p-3 text-sm">
                    {[
                      { k: "Trust name", v: active.ngoName },
                      { k: "Registration no.", v: "AAC-12A/2022/1147", ok: true },
                      { k: "Section", v: "12A · exemption", ok: true },
                      { k: "Validity", v: active.risk === "high" ? "EXPIRED 31 Mar 2023" : "Permanent", ok: active.risk !== "high" },
                    ].map((row) => (
                      <div key={row.k} className="flex items-center justify-between gap-2">
                        <span className="text-muted-foreground">{row.k}</span>
                        <span className={cn("flex items-center gap-1.5 font-medium", row.ok ? "text-foreground" : "text-destructive")}>
                          {row.ok ? <Check className="size-3 text-success" /> : <X className="size-3" />}
                          {row.v}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                    <ShieldCheck className="size-3.5" /> Compliance checks
                  </p>
                  <div className="space-y-2">
                    {[
                      { label: "12A on file & valid", ok: true },
                      { label: "80G on file & valid", ok: active.docCount >= 2 },
                      { label: "FCRA on file", ok: active.docCount >= 3 },
                      { label: "NITI Aayog registration", ok: active.docCount >= 3 },
                      { label: "Signed documents (no photos)", ok: true },
                      { label: "Reg numbers cross-check", ok: active.risk !== "high" },
                    ].map((c) => (
                      <div key={c.label} className="flex items-center justify-between rounded-lg border border-border/70 px-3 py-2 text-xs">
                        <span>{c.label}</span>
                        {c.ok ? (
                          <span className="flex items-center gap-1 font-medium text-success">
                            <Check className="size-3.5" strokeWidth={3} /> Pass
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 font-medium text-warning">
                            <Clock3 className="size-3.5" /> Pending
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {active.risk === "high" && (
                  <div className="flex items-start gap-2.5 rounded-xl border border-warning/25 bg-warning/8 p-3 text-xs">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
                    <p className="leading-relaxed text-muted-foreground">
                      Flagged: <span className="font-semibold text-foreground">expired 80G</span> in submission.
                      Reject until a renewed certificate is uploaded.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Admin decisions never bypass normal validation rules · every action is written to the append-only audit log.
          </p>
        </div>
      </div>

      {/* Decision dialog */}
      <Dialog open={!!decision} onOpenChange={(o) => !o && setDecision(null)}>
        <DialogHeader>
          <DialogTitle>
            {decision === "approve" ? "Approve & verify" : "Reject verification"} — {active.ngoName}
          </DialogTitle>
          <DialogDescription>
            {decision === "approve"
              ? "This computes the CSR-Ready Score, marks the NGO verified, and notifies them."
              : "A reason is required — it's logged to the audit trail and shared with the NGO."}
          </DialogDescription>
        </DialogHeader>
        {decision === "reject" && (
          <Textarea
            placeholder="Reason for rejection (e.g. expired 80G, unreadable scan)…"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setDecision(null)}>Cancel</Button>
          <Button
            variant={decision === "reject" ? "destructive" : "default"}
            disabled={decision === "reject" && !reason.trim()}
            onClick={() => decision && decide(decision)}
          >
            {decision === "approve" ? <ShieldCheck className="size-4" /> : <X className="size-4" />}
            {decision === "approve" ? "Verify NGO" : "Reject"}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Zoom */}
      <Dialog open={zoom} onOpenChange={setZoom}>
        <DialogHeader>
          <DialogTitle>Document focus view</DialogTitle>
          <DialogDescription>Side-by-side original scan · OCR overlay toggleable</DialogDescription>
        </DialogHeader>
        <div className="flex justify-center">
          <DocumentPreview label="12A Registration" />
        </div>
        <DialogFooter>
          <Button onClick={() => setZoom(false)}>Close</Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
