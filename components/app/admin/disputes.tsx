"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquareQuote, CheckCircle2, ArrowRight, Clock3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { disputes } from "@/lib/data";
import { cn } from "@/lib/utils";

export function AdminDisputes() {
  const { push } = useToast();
  const [list, setList] = useState(disputes);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [outcome, setOutcome] = useState("in-volunteer-favour");

  const active = list.find((d) => d.id === activeId) ?? null;

  const resolve = () => {
    if (!active) return;
    setList((l) => l.map((d) => (d.id === active.id ? { ...d, status: "resolved", summary: `Resolved — ${outcome.replace(/-/g, " ")}` } : d)));
    push("success", "Dispute resolved", `Decision logged: ${outcome.replace(/-/g, " ")}. Both parties notified.`);
    setActiveId(null);
  };

  const open = list.filter((d) => d.status === "open");
  const resolved = list.filter((d) => d.status === "resolved");

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Open disputes", value: open.length, tone: "bg-warning/10 text-warning" },
          { label: "Resolved", value: resolved.length, tone: "bg-success/10 text-success" },
          { label: "Avg. resolution time", value: "2.4 days", tone: "bg-primary/10 text-primary" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-5">
              <p className="text-xs font-medium text-muted-foreground">{s.label}</p>
              <p className={cn("mt-1.5 font-heading text-2xl font-bold", s.tone)}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        <AnimatePresence initial={false}>
          {list.map((d, i) => (
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
                  <p className="text-sm font-semibold">{d.title}</p>
                  <Badge variant={d.status === "open" ? "warning" : "success"} dot>
                    {d.status}
                  </Badge>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {d.from} · {d.at} {d.opportunityId && <>· opp-{d.opportunityId.replace("opp-", "")}</>}
                </p>
                <p className="mt-1.5 text-sm text-muted-foreground">{d.summary}</p>
              </div>
              {d.status === "open" && (
                <Button size="sm" onClick={() => setActiveId(d.id)}>
                  Review <ArrowRight className="size-3.5" />
                </Button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {open.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 px-5 py-14 text-center">
              <CheckCircle2 className="size-8 text-success/70" />
              <p className="text-sm font-semibold">No open disputes</p>
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
              <DialogTitle>{active.title}</DialogTitle>
              <DialogDescription>
                Filed by {active.from} on {active.at}
              </DialogDescription>
            </DialogHeader>
            <div className="rounded-xl border border-border bg-background/50 p-4 text-sm leading-relaxed text-muted-foreground">
              {active.summary}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock3 className="size-3.5" /> Open for 3 days — auto-escalates to senior admin after 7.
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-muted-foreground">Decision</p>
              <Select
                value={outcome}
                onValueChange={setOutcome}
                options={[
                  { value: "in-volunteer-favour", label: "In volunteer's favour — issue corrected certificate" },
                  { value: "in-ngo-favour", label: "In NGO's favour — hours upheld as logged" },
                  { value: "split", label: "Split — partial correction applied" },
                ]}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setActiveId(null)}>Escalate to senior admin</Button>
              <Button onClick={resolve}>
                <CheckCircle2 className="size-4" /> Resolve dispute
              </Button>
            </DialogFooter>
          </>
        )}
      </Dialog>
    </div>
  );
}
