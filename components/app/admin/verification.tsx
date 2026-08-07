"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  X,
  ShieldCheck,
  Clock3,
  Loader2,
  FileText,
  ScrollText,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { api, ApiError, type VerificationRequestOut } from "@/lib/api";
import { cn } from "@/lib/utils";

const statusMeta: Record<string, { label: string; variant: "warning" | "success" | "destructive" | "outline" }> = {
  pending: { label: "Pending", variant: "warning" },
  verified: { label: "Verified", variant: "success" },
  rejected: { label: "Rejected", variant: "destructive" },
};

export function AdminVerification() {
  const { push } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [queue, setQueue] = useState<VerificationRequestOut[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [decision, setDecision] = useState<"approve" | "reject" | null>(null);
  const [reason, setReason] = useState("");
  const [reviewing, setReviewing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.verification.queue({ limit: 50 });
      setQueue(data.items);
      setActiveId((prev) => prev ?? data.items[0]?.id ?? null);
    } catch {
      setQueue([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const active = queue.find((v) => v.id === activeId) ?? queue[0] ?? null;
  const pending = queue.filter((v) => v.status === "pending").length;

  const decide = async () => {
    if (!active || !decision) return;
    if (decision === "reject" && !reason.trim()) return;
    setReviewing(true);
    try {
      const updated = await api.verification.review(active.id, decision === "approve", reason.trim());
      setQueue((q) => q.map((v) => (v.id === updated.id ? updated : v)));
      push(
        decision === "approve" ? "success" : "error",
        decision === "approve" ? "NGO verified" : "NGO rejected",
        decision === "approve"
          ? "CSR-ready score computed and logged."
          : "Rejection logged with reason · NGO notified."
      );
      setDecision(null);
      setReason("");
    } catch (e) {
      push("error", "Could not review", (e as ApiError).message);
    } finally {
      setReviewing(false);
    }
  };

  if (loading) {
    return (
      <div className="grid place-items-center py-32 text-center">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="mt-3 text-sm text-muted-foreground">Loading verification queue…</p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        {/* Queue */}
        <div className="space-y-2 self-start lg:sticky lg:top-20">
          <p className="px-1 text-xs font-semibold text-muted-foreground">
            Queue · {pending} pending
          </p>
          {error && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
              {error}
            </div>
          )}
          {queue.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-xs text-muted-foreground">
              No verification requests in the queue.
            </div>
          ) : (
            <AnimatePresence>
              {queue.map((v) => {
                const meta = statusMeta[v.status] ?? { label: v.status, variant: "outline" as const };
                return (
                  <motion.button
                    key={v.id}
                    layout
                    onClick={() => setActiveId(v.id)}
                    className={cn(
                      "flex w-full cursor-pointer items-start gap-3 rounded-xl border p-3.5 text-left transition-all",
                      v.id === active?.id ? "border-primary/40 bg-primary/5 ring-2 ring-primary/15" : "border-border bg-card hover:border-primary/20"
                    )}
                  >
                    <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted font-mono text-[10px] font-bold text-muted-foreground">
                      {v.ngo_user_id.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-mono text-[11px] font-medium">{v.ngo_user_id}</p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        Submitted {new Date(v.submitted_at).toLocaleDateString("en-IN")}
                      </p>
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <Badge variant={meta.variant} dot>
                          {meta.label}
                        </Badge>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </AnimatePresence>
          )}
        </div>

        {/* Reviewer */}
        <div>
          {active ? (
            <div className="rounded-2xl border border-border bg-card">
              <div className="flex flex-col gap-3 border-b border-border/70 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-mono font-heading text-sm font-semibold">NGO {active.ngo_user_id.slice(0, 8)}</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Requested {new Date(active.submitted_at).toLocaleString("en-IN")}
                    {active.reviewed_at && ` · reviewed ${new Date(active.reviewed_at).toLocaleString("en-IN")}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {active.status === "pending" ? (
                    <>
                      <Button variant="outline" className="text-destructive hover:bg-destructive/5" onClick={() => setDecision("reject")} disabled={reviewing}>
                        <X className="size-4" /> Reject
                      </Button>
                      <Button onClick={() => setDecision("approve")} disabled={reviewing}>
                        <Check className="size-4" /> Approve & verify
                      </Button>
                    </>
                  ) : (
                    <Badge variant={statusMeta[active.status]?.variant ?? "outline"} dot>
                      {statusMeta[active.status]?.label ?? active.status}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="grid gap-4 p-4 md:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                      <FileText className="size-3.5" /> Submission
                    </p>
                    <div className="space-y-2 rounded-xl border border-border/70 bg-background/50 p-3 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-muted-foreground">Status</span>
                        <span className="font-medium">{statusMeta[active.status]?.label ?? active.status}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-muted-foreground">Requested</span>
                        <span className="font-medium">{new Date(active.submitted_at).toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-muted-foreground">Created</span>
                        <span className="font-medium">{new Date(active.created_at).toLocaleString("en-IN")}</span>
                      </div>
                      {active.decision_reason && (
                        <div className="rounded-lg border border-border/70 bg-background/50 p-2.5 text-xs">
                          <span className="font-medium text-foreground">Decision reason:</span> {active.decision_reason}
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    The NGO's uploaded documents are OCR-extracted and validated server-side. Approving computes the
                    CSR-Ready Score, marks the NGO verified, and notifies them. Rejection requires a reason.
                  </p>
                </div>

                <div>
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                    <ScrollText className="size-3.5" /> Admin decision
                  </p>
                  <div className="rounded-xl border border-border/70 bg-background/50 p-4 text-sm leading-relaxed text-muted-foreground">
                    Every decision is written to the append-only audit log with the acting admin, reason and a
                    timestamp. Admin decisions never bypass normal validation rules.
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid place-items-center rounded-2xl border border-dashed border-border py-24 text-center text-sm text-muted-foreground">
              <ShieldCheck className="mb-3 size-8 text-muted-foreground/40" />
              No active verification request.
            </div>
          )}

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Admin decisions never bypass normal validation rules · every action is written to the append-only audit log.
          </p>
        </div>
      </div>

      {/* Decision dialog */}
      <Dialog open={!!decision} onOpenChange={(o) => !o && setDecision(null)}>
        <DialogHeader>
          <DialogTitle>
            {decision === "approve" ? "Approve & verify" : "Reject verification"} — NGO {active?.ngo_user_id.slice(0, 8)}
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
            disabled={decision === "reject" && !reason.trim() || reviewing}
            onClick={decide}
          >
            {reviewing ? <Loader2 className="size-4 animate-spin" /> : decision === "approve" ? <ShieldCheck className="size-4" /> : <X className="size-4" />}
            {decision === "approve" ? "Verify NGO" : "Reject"}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
