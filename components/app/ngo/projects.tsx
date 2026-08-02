"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  ArrowRight,
  History,
  AlertTriangle,
  CheckCircle2,
  Pencil,
  Rocket,
  CircleStop,
  FileBarChart,
  Layers,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { opportunities } from "@/lib/data";
import { Opportunity, SCHEDULE_VII_META, Lifecycle } from "@/lib/types";
import { cn } from "@/lib/utils";

const lifecycleFlow: Lifecycle[] = ["draft", "published", "in_progress", "reported", "closed"];
const lifecycleLabels: Record<Lifecycle, string> = {
  draft: "Draft",
  published: "Published",
  in_progress: "In progress",
  reported: "Reported",
  closed: "Closed",
};

export function NgoProjects() {
  const { push } = useToast();
  const [projects, setProjects] = useState(opportunities.filter((o) => o.ngoId === "ngo-siksha"));
  const [createOpen, setCreateOpen] = useState(false);
  const [advance, setAdvance] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    category: "education",
    type: "long_term",
    hours: "10",
    budget: "500000",
    description: "",
  });

  const advanceProject = (id: string) => {
    setProjects((ps) =>
      ps.map((p) => {
        if (p.id !== id) return p;
        const idx = lifecycleFlow.indexOf(p.lifecycle);
        const next = lifecycleFlow[Math.min(idx + 1, lifecycleFlow.length - 1)];
        return { ...p, lifecycle: next };
      })
    );
    setAdvance(null);
    push("success", "Lifecycle updated", "Transition logged to the compliance audit trail.");
  };

  const create = () => {
    const newOpp: Opportunity = {
      id: `opp-new-${Date.now()}`,
      title: form.title || "Untitled project",
      ngoName: "Siksha Setu Foundation",
      ngoId: "ngo-siksha",
      category: form.category as Opportunity["category"],
      type: form.type as Opportunity["type"],
      duration: form.type === "micro_task" ? "remote, 2–5 hrs" : "10 weeks",
      location: "Pune",
      remote: form.type === "micro_task",
      slots: { total: 12, filled: 0 },
      hours: Number(form.hours) || 10,
      skills: [],
      description: form.description || "Awaiting description.",
      lifecycle: "draft",
      sponsored: false,
      postedDate: new Date().toISOString().slice(0, 10),
    };
    setProjects((ps) => [newOpp, ...ps]);
    setCreateOpen(false);
    push("success", "Draft created", "Publish once the Schedule VII category and budget are set.");
  };

  const canPublish = (p: Opportunity) => p.lifecycle === "draft";
  const canAdvance = (p: Opportunity) => p.lifecycle !== "closed";

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            Lifecycle is enforced server-side — projects can't skip states.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {lifecycleFlow.map((l, i) => (
              <div key={l} className="flex items-center gap-1.5">
                <span className="rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                  {lifecycleLabels[l]}
                </span>
                {i < lifecycleFlow.length - 1 && <ArrowRight className="size-3 text-muted-foreground/50" />}
              </div>
            ))}
          </div>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" /> New project
        </Button>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <AnimatePresence>
          {projects.map((p, i) => {
            const meta = SCHEDULE_VII_META[p.category];
            const idx = lifecycleFlow.indexOf(p.lifecycle);
            return (
              <motion.div
                key={p.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col rounded-2xl border border-border bg-card p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge style={{ background: meta.soft, color: meta.color }}>{meta.label}</Badge>
                      <Badge variant="secondary">{p.type === "micro_task" ? "Micro-task" : "Long-term"}</Badge>
                    </div>
                    <h3 className="mt-2 font-heading text-[15px] font-semibold leading-snug">{p.title}</h3>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.description}</p>
                  </div>
                  <Badge variant={p.lifecycle === "published" ? "success" : p.lifecycle === "draft" ? "outline" : p.lifecycle === "closed" ? "secondary" : "warning"} dot>
                    {lifecycleLabels[p.lifecycle]}
                  </Badge>
                </div>

                {/* lifecycle stepper */}
                <div className="mt-4 flex items-center gap-1">
                  {lifecycleFlow.map((l, j) => (
                    <div key={l} className="flex flex-1 items-center">
                      <div
                        className={cn(
                          "h-1.5 flex-1 rounded-full",
                          j <= idx ? "bg-primary" : "bg-muted"
                        )}
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
                  <span>{p.slots.filled}/{p.slots.total} slots</span>
                  <span>{p.hours}h · {p.location}</span>
                  {p.budget !== undefined && <span>₹{(p.budget / 100000).toFixed(1)}L</span>}
                </div>

                <div className="mt-4 flex flex-wrap gap-2 border-t border-border/70 pt-4">
                  <Button size="sm" variant="outline" onClick={() => push("info", "Edit project", "Edits to published projects are versioned for compliance review.")}>
                    <Pencil className="size-3.5" /> Edit
                  </Button>
                  {canPublish(p) && (
                    <Button size="sm" variant="accent" onClick={() => { setProjects((ps) => ps.map((x) => x.id === p.id ? { ...x, lifecycle: "published" } : x)); push("success", "Published", "Schedule VII category + budget validated."); }}>
                      <Rocket className="size-3.5" /> Publish
                    </Button>
                  )}
                  {canAdvance(p) && p.lifecycle !== "published" && (
                    <Button size="sm" onClick={() => setAdvance(p.id)}>
                      <ArrowRight className="size-3.5" /> Advance state
                    </Button>
                  )}
                  {p.lifecycle === "published" && (
                    <Button size="sm" variant="outline" onClick={() => setAdvance(p.id)}>
                      <CircleStop className="size-3.5" /> Mark in progress
                    </Button>
                  )}
                  {p.lifecycle === "in_progress" && (
                    <Button size="sm" variant="outline" onClick={() => setAdvance(p.id)}>
                      <FileBarChart className="size-3.5" /> Mark reported
                    </Button>
                  )}
                  <button className="ml-auto flex cursor-pointer items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                    <History className="size-3.5" /> Version history
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <Card className="mt-6">
        <CardContent className="flex items-start gap-3 p-5">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
          <div className="text-sm">
            <p className="font-semibold">Budget validation on publish</p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              Publishing a sponsored project is blocked if <span className="font-mono">budget_allocated</span>{" "}
              exceeds the sponsoring company's remaining CSR budget for the period. Volunteer slots are capped at
              application time, not just display.
            </p>
          </div>
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogHeader>
          <DialogTitle>Create a new project</DialogTitle>
          <DialogDescription>
            Schedule VII category is required at creation — validated against the legal list.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input placeholder="After-school STEM club" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Schedule VII</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })} options={(Object.keys(SCHEDULE_VII_META) as Opportunity["category"][]).map((c) => ({ value: c, label: SCHEDULE_VII_META[c].label }))} />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })} options={[{ value: "long_term", label: "Long-term" }, { value: "micro_task", label: "Micro-task" }]} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Est. hours</Label>
              <Input type="number" value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Budget (₹)</Label>
              <Input type="number" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea placeholder="What will volunteers do?" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button onClick={create}>
            <Layers className="size-4" /> Save as draft
          </Button>
        </DialogFooter>
      </Dialog>

      <Dialog open={!!advance} onOpenChange={(o) => !o && setAdvance(null)}>
        <DialogHeader>
          <DialogTitle>Advance lifecycle state</DialogTitle>
          <DialogDescription>
            Transitions are validated against the state machine — skipping states is not allowed.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setAdvance(null)}>Cancel</Button>
          <Button onClick={() => advanceProject(advance!)}>
            <CheckCircle2 className="size-4" /> Confirm transition
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
