"use client";

import { motion } from "framer-motion";
import {
  Building2,
  Clock,
  MapPin,
  Users,
  Wifi,
  BadgeCheck,
  ArrowUpRight,
  CalendarDays,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Opportunity, SCHEDULE_VII_META } from "@/lib/types";
import { cn } from "@/lib/utils";

const lifecycleLabels: Record<string, string> = {
  draft: "Draft",
  published: "Open",
  in_progress: "In progress",
  reported: "Reported",
  completed: "Completed",
  closed: "Closed",
};

export function OpportunityCard({
  opp,
  index = 0,
  showApply = true,
  applied,
  onApply,
}: {
  opp: Opportunity;
  index?: number;
  showApply?: boolean;
  applied?: boolean;
  onApply?: (opp: Opportunity) => void;
}) {
  const meta = SCHEDULE_VII_META[opp.category];
  const fill = opp.slots.total > 0 ? Math.round((opp.slots.filled / opp.slots.total) * 100) : 0;
  const full = opp.slots.filled >= opp.slots.total;

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      className="group relative flex flex-col rounded-2xl border border-border bg-card p-5 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lift"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className="grid size-10 shrink-0 place-items-center rounded-xl text-[11px] font-bold"
            style={{ background: meta.soft, color: meta.color }}
          >
            {opp.ngoName.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h3 className="font-heading text-[15px] font-semibold leading-snug">{opp.title}</h3>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
              <BadgeCheck className="size-3.5 text-success" />
              {opp.ngoName}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <Badge style={{ background: meta.soft, color: meta.color }}>{meta.label}</Badge>
          {opp.sponsored && (
            <Badge variant="secondary" className="gap-1">
              <Building2 className="size-3" /> {opp.companyName}
            </Badge>
          )}
        </div>
      </div>

      <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{opp.description}</p>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Clock className="size-3.5" /> {opp.duration}
        </span>
        <span className="flex items-center gap-1.5">
          <MapPin className="size-3.5" /> {opp.location}
        </span>
        <span className="flex items-center gap-1.5">
          <CalendarDays className="size-3.5" /> {opp.hours}h total
        </span>
        {opp.remote && (
          <span className="flex items-center gap-1.5 text-primary">
            <Wifi className="size-3.5" /> Remote
          </span>
        )}
        {opp.budget !== undefined && (
          <span className="flex items-center gap-1.5 font-medium text-foreground">
            ₹{(opp.budget / 100000).toFixed(1)}L budget
          </span>
        )}
      </div>

      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Users className="size-3.5" />
            {opp.slots.filled}/{opp.slots.total} slots filled
          </span>
          <Badge variant={full ? "destructive" : opp.lifecycle === "published" ? "success" : "outline"}>
            {full ? "Full" : lifecycleLabels[opp.lifecycle]}
          </Badge>
        </div>
        <Progress value={fill} tone={full ? "destructive" : "primary"} className="h-1.5" />
      </div>

      {opp.matchReasons && opp.recommendedScore !== undefined && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {opp.matchReasons.map((r) => (
            <span
              key={r}
              className="inline-flex items-center rounded-full bg-primary/8 px-2.5 py-1 text-[11px] font-medium text-primary"
            >
              {r}
            </span>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-border/70 pt-4">
        <div className="flex items-center gap-2">
          {opp.recommendedScore !== undefined && (
            <div
              className={cn(
                "grid size-9 place-items-center rounded-lg text-xs font-bold",
                opp.recommendedScore >= 80
                  ? "bg-success/12 text-[hsl(152,60%,35%)] dark:text-[hsl(152,60%,68%)]"
                  : opp.recommendedScore >= 60
                    ? "bg-accent/15 text-[hsl(32,90%,35%)] dark:text-[hsl(38,92%,72%)]"
                    : "bg-muted text-muted-foreground"
              )}
            >
              {opp.recommendedScore}%
            </div>
          )}
          <div className="text-[11px] leading-tight">
            <p className="font-medium text-foreground">Match score</p>
            <p className="text-muted-foreground">skill · location · availability</p>
          </div>
        </div>
        {showApply && onApply && (
          <Button
            size="sm"
            variant={applied ? "secondary" : full ? "outline" : "default"}
            disabled={applied || full || opp.lifecycle === "closed" || opp.lifecycle === "draft"}
            onClick={() => onApply(opp)}
            className="group/btn"
          >
            {applied ? (
              "Applied"
            ) : full ? (
              "Full"
            ) : (
              <>
                Apply <ArrowUpRight className="size-3.5 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
              </>
            )}
          </Button>
        )}
      </div>
    </motion.article>
  );
}
