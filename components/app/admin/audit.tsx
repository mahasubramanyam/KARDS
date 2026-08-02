"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Lock, Download, FileCheck2, Clock3, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { auditLog } from "@/lib/data";
import { cn } from "@/lib/utils";

const severityStyles: Record<string, "default" | "warning" | "destructive" | "success"> = {
  info: "success",
  warning: "warning",
  critical: "destructive",
};

export function AdminAudit() {
  const { push } = useToast();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "info" | "warning" | "critical">("all");

  const rows = auditLog
    .filter((a) => (filter === "all" ? true : a.severity === filter))
    .filter((a) => (query ? `${a.action} ${a.target} ${a.actor}`.toLowerCase().includes(query.toLowerCase()) : true));

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground">
          <Lock className="size-3.5" /> Append-only · immutable · no deletes or edits possible
        </div>
        <Button
          variant="outline"
          onClick={() => push("success", "Audit exported", "CSV of all 1,284 events downloaded.")}
        >
          <Download className="size-4" /> Export CSV
        </Button>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by action, target or actor…"
            className="pl-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
          {(["all", "info", "warning", "critical"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={cn(
                "cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors",
                filter === s ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <Card className="mt-5">
        <CardContent className="p-0">
          <div className="grid grid-cols-[160px_1fr_180px] gap-4 border-b border-border/70 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            <span>Timestamp</span>
            <span>Action</span>
            <span className="text-right">Severity</span>
          </div>
          <AnimatePresence initial={false}>
            {rows.map((a, i) => (
              <motion.div
                key={a.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: i * 0.03 }}
                className="grid grid-cols-[160px_1fr_180px] gap-4 border-b border-border/50 px-5 py-3.5 transition-colors last:border-0 hover:bg-muted/30"
              >
                <div className="flex items-start gap-2.5">
                  <span
                    className={cn(
                      "mt-1 size-2 shrink-0 rounded-full",
                      a.severity === "critical" ? "bg-destructive" : a.severity === "warning" ? "bg-warning" : "bg-success"
                    )}
                  />
                  <div>
                    <p className="font-mono text-xs text-muted-foreground">{a.at.replace("T", " ").slice(0, 16)}</p>
                    <p className="text-[11px] text-muted-foreground">by {a.actor}</p>
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{a.action}</p>
                  <p className="truncate text-xs text-muted-foreground">{a.target}</p>
                  {a.reason && <p className="mt-1 text-xs text-muted-foreground/80">{a.reason}</p>}
                </div>
                <div className="flex items-center justify-end">
                  <Badge variant={severityStyles[a.severity]} dot>
                    {a.severity}
                  </Badge>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {rows.length === 0 && (
            <div className="flex flex-col items-center gap-2 px-5 py-16 text-center">
              <FileCheck2 className="size-8 text-muted-foreground/40" />
              <p className="text-sm font-medium">No matching events</p>
              <p className="text-xs text-muted-foreground">Try a different filter or search term.</p>
            </div>
          )}

          <div className="flex items-center justify-between border-t border-border/70 px-5 py-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Clock3 className="size-3.5" /> Showing {rows.length} of 1,284 events
            </span>
            <span>Chain hash verified: <span className="font-mono text-foreground">a91f…c4d2</span></span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
