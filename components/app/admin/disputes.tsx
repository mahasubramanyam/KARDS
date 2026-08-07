"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquareQuote, CheckCircle2, ArrowRight, Clock3, Loader2, ScrollText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { api, ApiError, type DisputeOut } from "@/lib/api";
import { cn } from "@/lib/utils";

const statusMeta: Record<string, { label: string; variant: "warning" | "success" | "destructive" }> = {
  open: { label: "Open", variant: "warning" },
  resolved: { label: "Resolved", variant: "success" },
  escalated: { label: "Escalated", variant: "destructive" },
};

export function AdminDisputes() {
  const { push } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [list, setList] = useState<DisputeOut[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [decision, setDecision] = useState("");
  const [resolving, setResolving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.disputes.adminQueue({ limit: 50 });
      setList(data.items);
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const active = list.find((d) => d.id === activeId) ?? null;

  const resolve = async () => {
    if (!active || !decision.trim()) return;
    setResolving(true);
    try {
      const updated = await api.disputes.resolve(active.id, decision.trim());
      setList((l) => l.map((d) => (d.id === updated.id ? updated : d)));
      push("success", "Dispute resolved", "Decision logged · both parties notified.");
      setActiveId(null);
      setDecision("");
    } catch (e) {
      push("error", "Could not resolve", (e as ApiError).message);
    } finally {
      setResolving(false);
    }
  };

  if (loading) {
    return (
      <div className="grid place-items-center py-32 text-center">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="mt-3 text-sm text-muted-foreground">Loading disputes…</p>
      </div>
    );
  }

  const open = list.filter((d) => d.status === "open");
  const resolved = list.filter((d) => d.status === "resolved");

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Open disputes", value: open.length, tone: "bg-warning/10 text-warning" },
          { label: "Resolved", value: resolved.length, tone: "bg-success/10 text-success" },
          { label: "Total in queue", value: list.length, tone: "bg-primary/10 text-primary" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-5">
              <p className="text-xs font-medium text-muted-foreground">{s.label}</p>
              <p className={cn("mt-1.5 font-heading text-2xl font-bold", s.tone)}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="mt-6 space-y-3">
        <AnimatePresence initial={false}>
          {list.map((d, i) => {
            const meta = statusMeta[d.status] ?? { label: d.status, variant: "warning" as const };
            return (
              <motion.div
                key={d.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: i * 0.04 }}
                className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center"
              >
                <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  {d.status === "open" ? <MessageSquareQuote className="size-5" /> : <CheckCircle2 className="size-5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold capitalize">{d.subject_type} dispute</p>
                    <Badge variant={meta.variant} dot>
                      {meta.label}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {d.subject_id.slice(0, 8)} · filed {new Date(d.created_at).toLocaleString("en-IN")}
                    {d.against_user_id && <> · against {d.against_user_id.slice(0, 8)}</>}
                  </p>
                  <p className="mt-1.5 text-sm text-muted-foreground">{d.summary}</p>
                  {d.decision && <p className="mt-1 text-xs text-muted-foreground/80">Decision: {d.decision}</p>}
                </div>
                {d.status === "open" && (
                  <Button size="sm" onClick={() => setActiveId(d.id)}>
                    Review <ArrowRight className="size-3.5" />
                  </Button>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {list.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 px-5 py-14 text-center">
              <CheckCircle2 className="size-8 text-success/70" />
              <p className="text-sm font-semibold">No disputes in the queue</p>
              <p className="max-w-sm text-xs text-muted-foreground">
                Every dispute is resolved with a logged, appealable decision. New ones land here in real time.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={!!active} onOpenChange={(o) => !o && setActiveId(null)}>
        {active && (
          <>
            <DialogHeader>
              <DialogTitle className="capitalize">{active.subject_type} dispute</DialogTitle>
              <DialogDescription>
                Filed {new Date(active.created_at).toLocaleString("en-IN")} · {active.subject_id.slice(0, 8)}
              </DialogDescription>
            </DialogHeader>
            <div className="rounded-xl border border-border bg-background/50 p-4 text-sm leading-relaxed text-muted-foreground">
              {active.summary}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock3 className="size-3.5" /> Resolution is appealable — decisions are written to the audit log.
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-muted-foreground">Decision</p>
              <Textarea
                placeholder="e.g. Corrected certificate issued to volunteer; hours upheld."
                value={decision}
                onChange={(e) => setDecision(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setActiveId(null)}>Escalate to senior admin</Button>
              <Button disabled={!decision.trim() || resolving} onClick={resolve}>
                {resolving ? <Loader2 className="size-4 animate-spin" /> : <ScrollText className="size-4" />} Resolve dispute
              </Button>
            </DialogFooter>
          </>
        )}
      </Dialog>
    </div>
  );
}
