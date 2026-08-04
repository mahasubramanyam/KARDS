"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { SlidersHorizontal, Search, RotateCcw, Loader2, AlertTriangle } from "lucide-react";
import { OpportunityCard } from "@/components/app/opportunity-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import { api, ApiError } from "@/lib/api";
import { toOpportunity } from "@/lib/mappers";
import { Opportunity, ScheduleVII, SCHEDULE_VII_META } from "@/lib/types";
import { cn } from "@/lib/utils";

const categoryOptions = (Object.keys(SCHEDULE_VII_META) as ScheduleVII[]).map((c) => ({
  value: c,
  label: SCHEDULE_VII_META[c].label,
}));

export function OpportunitiesPage() {
  const { push } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [type, setType] = useState("all");
  const [location, setLocation] = useState("all");
  const [sort, setSort] = useState("recent");
  const [tab, setTab] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [page, apps] = await Promise.all([
        api.public.opportunities({ skip: 0, limit: 50 }),
        api.volunteering.myApplications({ limit: 100 }).catch(() => ({ items: [], total: 0, page: 1, page_size: 100, has_more: false })),
      ]);
      setOpportunities(page.items.map(toOpportunity));
      setAppliedIds(new Set(apps.items.filter((a) => a.status !== "withdrawn" && a.status !== "rejected").map((a) => a.opportunity_id)));
    } catch (e) {
      setError((e as ApiError).message || "Could not load opportunities.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(
    () =>
      opportunities.filter((o) => {
        if (tab === "open" && o.lifecycle !== "published" && o.lifecycle !== "in_progress") return false;
        if (tab === "micro" && o.type !== "micro_task") return false;
        if (category !== "all" && o.category !== category) return false;
        if (type !== "all" && o.type !== type) return false;
        if (location === "remote" && !o.remote) return false;
        if (location === "local" && o.remote) return false;
        if (query) {
          const q = query.toLowerCase();
          if (!`${o.title} ${o.ngoName} ${o.description}`.toLowerCase().includes(q)) return false;
        }
        return true;
      }),
    [opportunities, tab, category, type, location, query]
  );

  const sorted = useMemo(() => {
    const arr = [...filtered];
    if (sort === "recent") arr.sort((a, b) => new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime());
    if (sort === "hours") arr.sort((a, b) => a.hours - b.hours);
    return arr;
  }, [filtered, sort]);

  const handleApply = async (opp: Opportunity) => {
    if (appliedIds.has(opp.id) || applyingId) return;
    setApplyingId(opp.id);
    try {
      const application = await api.volunteering.apply(opp.id);
      setAppliedIds((s) => new Set(s).add(opp.id));
      push("success", "Application submitted", `${opp.title} · the NGO will review within 48h.`);
      void application;
    } catch (e) {
      push("error", "Could not apply", (e as ApiError).message);
    } finally {
      setApplyingId(null);
    }
  };

  return (
    <div>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="open">Open</TabsTrigger>
            <TabsTrigger value="micro">Micro-tasks</TabsTrigger>
          </TabsList>
        </Tabs>
        <p className="text-sm text-muted-foreground">
          {loading ? "Loading…" : `${sorted.length} of ${opportunities.length} opportunities · live ledger`}
        </p>
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Filters */}
        <div className="space-y-5 self-start rounded-2xl border border-border bg-card p-5 lg:sticky lg:top-20">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <SlidersHorizontal className="size-4 text-primary" /> Filters
            </p>
            <button
              className="flex cursor-pointer items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => {
                setQuery("");
                setCategory("all");
                setType("all");
                setLocation("all");
              }}
            >
              <RotateCcw className="size-3" /> Reset
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search skills, causes…"
              className="pl-9"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Schedule VII category</label>
            <Select value={category} onValueChange={setCategory} options={[{ value: "all", label: "All categories" }, ...categoryOptions]} />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Project type</label>
            <Select
              value={type}
              onValueChange={setType}
              options={[
                { value: "all", label: "All types" },
                { value: "long_term", label: "Long-term (6+ hrs)" },
                { value: "micro_task", label: "Micro-task (≤5 hrs)" },
              ]}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Location</label>
            <Select
              value={location}
              onValueChange={setLocation}
              options={[
                { value: "all", label: "Anywhere" },
                { value: "remote", label: "Remote only" },
                { value: "local", label: "In-person" },
              ]}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Sort by</label>
            <Select
              value={sort}
              onValueChange={setSort}
              options={[
                { value: "recent", label: "Most recent" },
                { value: "hours", label: "Lowest hours" },
              ]}
            />
          </div>

          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 text-xs leading-relaxed text-muted-foreground">
            Matching uses skill overlap (50%) · location (30%) · availability (20%). Company-sponsored slots
            prioritize their own employees first.
          </div>
        </div>

        {/* Results */}
        <div>
          {error && (
            <div className="grid place-items-center rounded-2xl border border-destructive/30 bg-destructive/5 py-16 text-center">
              <div>
                <AlertTriangle className="mx-auto size-6 text-destructive" />
                <p className="mt-2 text-sm text-foreground">{error}</p>
                <Button variant="outline" size="sm" className="mt-4" onClick={load}>
                  Retry
                </Button>
              </div>
            </div>
          )}

          {loading && (
            <div className="grid place-items-center rounded-2xl border border-dashed border-border py-20 text-center">
              <Loader2 className="size-6 animate-spin text-primary" />
              <p className="mt-2 text-sm text-muted-foreground">Loading opportunities…</p>
            </div>
          )}

          {!loading && !error && sorted.length === 0 && (
            <div className="grid place-items-center rounded-2xl border border-dashed border-border py-20 text-center">
              <div className="text-sm text-muted-foreground">
                <p className="font-heading text-base font-semibold text-foreground">No opportunities yet</p>
                <p className="mt-1">
                  {opportunities.length === 0
                    ? "NGOs publish opportunities here once verified. Check back soon."
                    : "Try widening your filters."}
                </p>
              </div>
            </div>
          )}

          {!loading && !error && sorted.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2">
              {sorted.map((opp, i) => (
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

          {applyingId && (
            <p className={cn("mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground")}>
              <Loader2 className="size-3 animate-spin" /> Submitting application…
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
