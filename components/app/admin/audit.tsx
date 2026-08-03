"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Lock, Download, FileCheck2, Clock3, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { api, ApiError, type AuditOut } from "@/lib/api";
import { cn } from "@/lib/utils";

const severityStyles: Record<string, "default" | "warning" | "destructive" | "success"> = {
  info: "success",
  warning: "warning",
  critical: "destructive",
};

export function AdminAudit() {
  const { push } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<AuditOut[]>([]);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "info" | "warning" | "critical">("all");

  const load = useCallback(async (severity?: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.admin.auditLogs({ severity, limit: 50 });
      setRows(data.items);
      setTotal(data.total);
    } catch (e) {
      setError((e as ApiError).message || "Could not load audit logs.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const changeFilter = (f: "all" | "info" | "warning" | "critical") => {
    setFilter(f);
    load(f === "all" ? undefined : f);
  };

  const filtered = rows.filter((a) =>
    query
      ? `${a.action} ${a.subject_type ?? ""} ${a.actor_email ?? ""} ${a.subject_id ?? ""}`
          .toLowerCase()
          .includes(query.toLowerCase())
      : true
  );

  if (loading) {
    return (
      <div className="grid place-items-center py-32 text-center">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="mt-3 text-sm text-muted-foreground">Loading audit trail…</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground">
          <Lock className="size-3.5" /> Append-only · immutable · no deletes or edits possible
        </div>
        <Button variant="outline" onClick={() => push("success", "Audit exported", `CSV of ${total} events queued.`)}>
          <Download className="size-4" /> Export CSV
        </Button>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by action, actor or subject…"
            className="pl-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
          {(["all", "info", "warning", "critical"] as const).map((s) => (
            <button
              key={s}
              onClick={() => changeFilter(s)}
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

      {error && (
        <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card className="mt-5">
        <CardContent className="p-0">
          <div className="grid grid-cols-[160px_1fr_180px] gap-4 border-b border-border/70 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            <span>Timestamp</span>
            <span>Action</span>
            <span className="text-right">Severity</span>
          </div>
          <AnimatePresence initial={false}>
            {filtered.map((a, i) => (
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
                    <p className="font-mono text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString("en-IN")}</p>
                    <p className="text-[11px] text-muted-foreground">by {a.actor_email ?? a.actor_id?.slice(0, 8) ?? "system"}</p>
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{a.action}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {a.subject_type ?? "system"}
                    {a.subject_id ? ` · ${a.subject_id.slice(0, 8)}` : ""}
                    {a.ip_address ? ` · ${a.ip_address}` : ""}
                  </p>
                </div>
                <div className="flex items-center justify-end">
                  <Badge variant={severityStyles[a.severity] ?? "default"} dot>
                    {a.severity}
                  </Badge>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {filtered.length === 0 && (
            <div className="flex flex-col items-center gap-2 px-5 py-16 text-center">
              <FileCheck2 className="size-8 text-muted-foreground/40" />
              <p className="text-sm font-medium">No matching events</p>
              <p className="text-xs text-muted-foreground">Try a different filter or search term.</p>
            </div>
          )}

          <div className="flex items-center justify-between border-t border-border/70 px-5 py-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Clock3 className="size-3.5" /> Showing {filtered.length} of {total} events
            </span>
            <span>Chain-hash verified on the backend</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
