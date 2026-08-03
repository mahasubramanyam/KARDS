"use client";

import { useCallback, useEffect, useState } from "react";
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
  Layers,
  Loader2,
  Globe2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import { api, ApiError, type OpportunityOut } from "@/lib/api";
import { SCHEDULE_VII_META, type ScheduleVII } from "@/lib/types";
import { cn } from "@/lib/utils";

const lifecycleFlow = ["draft", "published", "in_progress", "completed", "closed"] as const;
const lifecycleLabels: Record<string, string> = {
  draft: "Draft",
  published: "Published",
  in_progress: "In progress",
  completed: "Completed",
  closed: "Closed",
};

const badgeVariant: Record<string, "success" | "outline" | "secondary" | "warning" | "default"> = {
  draft: "outline",
  published: "success",
  in_progress: "warning",
  completed: "secondary",
  closed: "secondary",
};

export function NgoProjects() {
  const { push } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<OpportunityOut[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    category: "education",
    description: "",
    location: "",
    is_remote: false,
    slots_total: "10",
    hours_estimate: "10",
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.csr.opportunities({ limit: 50 });
      setProjects(data.items);
    } catch (e) {
      setError((e as ApiError).message || "Could not load projects.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const create = async () => {
    try {
      const opp = await api.csr.createOpportunity({
        title: form.title.trim() || "Untitled project",
        description: form.description || undefined,
        category: form.category,
        location: form.location || undefined,
        is_remote: form.is_remote,
        slots_total: Number(form.slots_total) || 1,
        hours_estimate: Number(form.hours_estimate) || 0,
      });
      setProjects((ps) => [opp, ...ps]);
      setCreateOpen(false);
      setForm({ title: "", category: "education", description: "", location: "", is_remote: false, slots_total: "10", hours_estimate: "10" });
      push("success", "Draft created", "Publish once the Schedule VII category and budget are set.");
    } catch (e) {
      push("error", "Could not create project", (e as ApiError).message);
    }
  };

  const publish = async (id: string) => {
    setBusyId(id);
    try {
      const opp = await api.csr.publishOpportunity(id);
      setProjects((ps) => ps.map((p) => (p.id === id ? opp : p)));
      push("success", "Published", "Schedule VII category + capacity validated.");
    } catch (e) {
      push("error", "Could not publish", (e as ApiError).message);
    } finally {
      setBusyId(null);
    }
  };

  const complete = async (id: string) => {
    setBusyId(id);
    try {
      const opp = await api.volunteering.completeOpportunity(id);
      setProjects((ps) => ps.map((p) => (p.id === id ? opp : p)));
      push("success", "Completed", "Certificates issued to accepted volunteers · logged to the audit trail.");
    } catch (e) {
      push("error", "Could not complete", (e as ApiError).message);
    } finally {
      setBusyId(null);
    }
  };

  const close = async (id: string) => {
    setBusyId(id);
    try {
      const opp = await api.csr.closeOpportunity(id);
      setProjects((ps) => ps.map((p) => (p.id === id ? opp : p)));
      push("success", "Closed", "Opportunity closed to new applications.");
    } catch (e) {
      push("error", "Could not close", (e as ApiError).message);
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="grid place-items-center py-32 text-center">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="mt-3 text-sm text-muted-foreground">Loading projects…</p>
      </div>
    );
  }

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

      {error && (
        <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {projects.length === 0 && !error ? (
        <div className="mt-6 rounded-2xl border border-dashed border-border py-20 text-center text-sm text-muted-foreground">
          No projects created yet. Create a draft and publish it to open volunteer applications.
        </div>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <AnimatePresence>
            {projects.map((p, i) => {
              const meta = SCHEDULE_VII_META[p.category as ScheduleVII] ?? SCHEDULE_VII_META.other;
              const idx = lifecycleFlow.indexOf(p.status as (typeof lifecycleFlow)[number]);
              const busy = busyId === p.id;
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
                        {p.is_remote && (
                          <Badge variant="secondary">
                            <Globe2 className="size-3" /> Remote
                          </Badge>
                        )}
                      </div>
                      <h3 className="mt-2 font-heading text-[15px] font-semibold leading-snug">{p.title}</h3>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {p.description ?? "Awaiting description."}
                      </p>
                    </div>
                    <Badge variant={badgeVariant[p.status] ?? "default"} dot>
                      {lifecycleLabels[p.status] ?? p.status}
                    </Badge>
                  </div>

                  <div className="mt-4 flex items-center gap-1">
                    {lifecycleFlow.map((l, j) => (
                      <div key={l} className="flex flex-1 items-center">
                        <div className={cn("h-1.5 flex-1 rounded-full", j <= idx ? "bg-primary" : "bg-muted")} />
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
                    <span>
                      {p.slots_filled}/{p.slots_total} slots
                    </span>
                    <span>
                      {p.hours_estimate}h · {p.location ?? (p.is_remote ? "Remote" : "—")}
                    </span>
                    <span>{new Date(p.created_at).toLocaleDateString("en-IN")}</span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2 border-t border-border/70 pt-4">
                    <Button size="sm" variant="outline" disabled={busy} onClick={() => push("info", "Edit project", "Edits to published projects are versioned for compliance review.")}>
                      <Pencil className="size-3.5" /> Edit
                    </Button>
                    {p.status === "draft" && (
                      <Button size="sm" variant="accent" disabled={busy} onClick={() => publish(p.id)}>
                        {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Rocket className="size-3.5" />} Publish
                      </Button>
                    )}
                    {p.status === "published" && (
                      <Button size="sm" disabled={busy} onClick={() => push("info", "Mark in progress", "In-progress is set server-side once volunteer applications are accepted and work begins.")}>
                        <CircleStop className="size-3.5" /> Mark in progress
                      </Button>
                    )}
                    {p.status === "in_progress" && (
                      <Button size="sm" variant="outline" disabled={busy} onClick={() => complete(p.id)}>
                        {busy ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCircle2 className="size-3.5" />} Complete & issue certificates
                      </Button>
                    )}
                    {(p.status === "draft" || p.status === "published" || p.status === "in_progress") && (
                      <Button size="sm" variant="ghost" disabled={busy} onClick={() => close(p.id)}>
                        <CircleStop className="size-3.5" /> Close
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
      )}

      <Card className="mt-6">
        <CardContent className="flex items-start gap-3 p-5">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
          <div className="text-sm">
            <p className="font-semibold">Capacity validation on publish</p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              Publishing an opportunity opens it to volunteer applications; slots are capped at application time,
              not just display. State transitions are validated against the server-side state machine.
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
              <Select
                value={form.category}
                onValueChange={(v) => setForm({ ...form, category: v })}
                options={(Object.keys(SCHEDULE_VII_META) as ScheduleVII[]).map((c) => ({ value: c, label: SCHEDULE_VII_META[c].label }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Input placeholder="Pune" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-border p-3.5">
            <div>
              <p className="text-sm font-medium">Remote opportunity</p>
              <p className="text-xs text-muted-foreground">Volunteers can contribute remotely</p>
            </div>
            <Switch checked={form.is_remote} onCheckedChange={(v) => setForm({ ...form, is_remote: v })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Slots</Label>
              <Input type="number" min={1} value={form.slots_total} onChange={(e) => setForm({ ...form, slots_total: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Est. hours / volunteer</Label>
              <Input type="number" min={0} value={form.hours_estimate} onChange={(e) => setForm({ ...form, hours_estimate: e.target.value })} />
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
    </div>
  );
}
