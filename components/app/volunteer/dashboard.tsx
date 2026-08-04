"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Clock3,
  BadgeCheck,
  FolderKanban,
  Users,
  Sparkles,
  Zap,
  ArrowUpRight,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { StatCard } from "@/components/app/stat-card";
import { Section } from "@/components/app/section";
import { OpportunityCard } from "@/components/app/opportunity-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/toast";
import { api, ApiError, type ApplicationOut, type OpportunityOut } from "@/lib/api";
import { toOpportunity } from "@/lib/mappers";
import { Opportunity } from "@/lib/types";

export function VolunteerDashboard() {
  const { push } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [applications, setApplications] = useState<ApplicationOut[]>([]);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const [applyingId, setApplyingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [oppPage, appPage] = await Promise.all([
        api.public.opportunities({ skip: 0, limit: 20 }),
        api.volunteering.myApplications({ limit: 10 }).catch(() => ({ items: [], total: 0, page: 1, page_size: 10, has_more: false })),
      ]);
      const mapped = oppPage.items.map(toOpportunity);
      setOpportunities(mapped);
      setApplications(appPage.items);
      setAppliedIds(
        new Set(
          appPage.items
            .filter((a) => a.status !== "withdrawn" && a.status !== "rejected")
            .map((a) => a.opportunity_id)
        )
      );
    } catch (e) {
      setError((e as ApiError).message || "Could not load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const recommended = opportunities.slice(0, 3);
  const microTasks = opportunities.filter((o) => o.type === "micro_task").slice(0, 2);

  const handleApply = async (opp: Opportunity) => {
    if (appliedIds.has(opp.id) || applyingId) return;
    setApplyingId(opp.id);
    try {
      await api.volunteering.apply(opp.id);
      setAppliedIds((s) => new Set(s).add(opp.id));
      push("success", "Application submitted", `${opp.title} · NGO will review within 48h.`);
      const appPage = await api.volunteering.myApplications({ limit: 10 });
      setApplications(appPage.items);
    } catch (e) {
      push("error", "Could not apply", (e as ApiError).message);
    } finally {
      setApplyingId(null);
    }
  };

  if (loading) {
    return (
      <div className="grid place-items-center py-32 text-center">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="mt-3 text-sm text-muted-foreground">Loading your dashboard…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid place-items-center py-20 text-center">
        <AlertTriangle className="size-8 text-destructive" />
        <p className="mt-2 text-sm text-foreground">{error}</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={load}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div>
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col gap-4 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/8 to-transparent p-5 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-primary to-[hsl(285,70%,52%)] font-heading text-lg font-bold text-primary-foreground shadow-glow">
              VS
            </div>
            <span className="absolute -bottom-1 -right-1 grid size-5 place-items-center rounded-full bg-success text-white ring-2 ring-card">
              <BadgeCheck className="size-3" />
            </span>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">
              {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
            </p>
            <h2 className="font-heading text-xl font-bold">Namaste, Volunteer 👋</h2>
            <p className="text-sm text-muted-foreground">Live CSR volunteering workspace</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="glow" onClick={load}>
            Refresh
          </Button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Hours logged" value={0} icon={Clock3} tone="primary" hint="Pending approved logs" />
        <StatCard label="Certificates" value={0} icon={BadgeCheck} tone="success" hint="Check vault" />
        <StatCard label="Active applications" value={applications.length} icon={FolderKanban} tone="accent" />
        <StatCard label="People helped" value={0} icon={Users} tone="violet" hint="Across projects" />
      </div>

      {/* Recommended */}
      <Section
        title="Opportunities for you"
        subtitle="Sanctioned tier-2/3 NGO projects mapped to Schedule VII"
        action="View all opportunities"
        actionHref="/app/volunteer/opportunities"
      >
        {recommended.length === 0 ? (
          <p className="text-sm text-muted-foreground">No opportunities currently published.</p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-3">
            {recommended.map((opp, i) => (
              <OpportunityCard
                key={opp.id}
                opp={opp}
                index={i}
                applied={appliedIds.has(opp.id)}
                onApply={handleApply}
              />
            ))}
          </div>
        )}
      </Section>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Micro tasks */}
        <Section
          title="Micro-volunteering"
          subtitle="Bite-size remote impact tasks"
          action="Task board"
          actionHref="/app/volunteer/opportunities"
          className="lg:col-span-2"
        >
          {microTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No micro-tasks currently available.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {microTasks.map((opp, i) => (
                <motion.div
                  key={opp.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.06 }}
                  className="group flex cursor-pointer flex-col rounded-2xl border border-border bg-card p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-lift"
                  onClick={() => handleApply(opp)}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-2.5 py-1 text-[11px] font-semibold text-[hsl(32,90%,32%)] dark:text-[hsl(38,92%,72%)]">
                      <Zap className="size-3" /> {opp.hours}h · Micro-task
                    </span>
                    <ArrowUpRight className="size-4 text-muted-foreground transition-colors group-hover:text-accent" />
                  </div>
                  <h3 className="text-sm font-semibold leading-snug">{opp.title}</h3>
                  <p className="mt-1 line-clamp-2 flex-1 text-xs leading-relaxed text-muted-foreground">
                    {opp.description}
                  </p>
                  <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-3">
                    <span className="text-[11px] text-muted-foreground">{opp.ngoName}</span>
                    <Badge variant="secondary">Open</Badge>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </Section>

        {/* Applications */}
        <Section title="My applications" subtitle="Track your sign-ups">
          <Card>
            <CardContent className="p-3">
              {applications.length === 0 ? (
                <p className="py-6 text-center text-xs text-muted-foreground">No applications submitted yet.</p>
              ) : (
                applications.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-muted/60"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">Application #{a.id.slice(0, 8)}</p>
                      <p className="truncate text-xs text-muted-foreground">Status: {a.status}</p>
                    </div>
                    <Badge
                      variant={
                        a.status === "accepted"
                          ? "success"
                          : a.status === "completed"
                            ? "secondary"
                            : "warning"
                      }
                      dot
                    >
                      {a.status.replace("_", " ")}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </Section>
      </div>
    </div>
  );
}
