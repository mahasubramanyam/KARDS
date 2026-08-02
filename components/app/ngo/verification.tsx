"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Check,
  FileText,
  ScanLine,
  ShieldCheck,
  UploadCloud,
  Eye,
  Clock3,
  X,
  ChevronRight,
  BadgeCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { ngos } from "@/lib/data";
import { cn } from "@/lib/utils";
import { DocType } from "@/lib/types";

const pipelineSteps = [
  { label: "Documents uploaded", done: true },
  { label: "OCR extraction", done: true },
  { label: "Admin manual review", done: true },
  { label: "Score computed", done: true },
  { label: "Verified & live", done: true },
];

const checklist: { type: DocType; label: string; note: string; state: "done" | "pending" | "action" }[] = [
  { type: "12A", label: "12A Registration", note: "Validated · reg number extracted by OCR", state: "done" },
  { type: "80G", label: "80G Deduction", note: "Validated · valid till 30 Jun 2028", state: "done" },
  { type: "FCRA", label: "FCRA Registration", note: "Renews 14 Sep 2026 · reminder set", state: "action" },
  { type: "NITI Aayog", label: "NITI Aayog (optional)", note: "Boosts discovery in your sector", state: "pending" },
];

export function NgoVerification() {
  const { push } = useToast();
  const ngo = ngos[0];
  const [uploaded, setUploaded] = useState<DocType[]>(["12A", "80G", "FCRA"]);

  const upload = (t: DocType, label: string) => {
    if (uploaded.includes(t)) return;
    setUploaded((u) => [...u, t]);
    push("success", "Document uploaded", `${label} queued for OCR extraction.`);
  };

  return (
    <div className="space-y-6">
      {/* Pipeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-success" /> Verification pipeline
          </CardTitle>
          <CardDescription>
            Every transition is written to an immutable audit log (who, when, why).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {pipelineSteps.map((s, i) => (
              <div key={s.label} className="flex flex-1 items-center gap-2">
                <div className="flex items-center gap-2.5">
                  <div
                    className={cn(
                      "grid size-8 shrink-0 place-items-center rounded-full",
                      s.done ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"
                    )}
                  >
                    {s.done ? <Check className="size-4" strokeWidth={3} /> : <Clock3 className="size-4" />}
                  </div>
                  <span className="whitespace-nowrap text-xs font-medium">{s.label}</span>
                </div>
                {i < pipelineSteps.length - 1 && (
                  <ChevronRight className="hidden size-4 shrink-0 text-muted-foreground/50 sm:block" />
                )}
              </div>
            ))}
          </div>
          <div className="mt-5 flex items-center gap-3 rounded-xl border border-success/25 bg-success/8 p-4">
            <BadgeCheck className="size-5 shrink-0 text-success" />
            <div className="text-sm">
              <p className="font-semibold text-foreground">Verification complete — score {ngo.csrReadyScore}/100</p>
              <p className="text-xs text-muted-foreground">
                Verified {ngo.verifiedDate} by admin@kards.app · visible to all corporate sponsors
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Document checklist */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Document checklist</CardTitle>
            <CardDescription>OCR first-pass + admin side-by-side review. Files encrypted at rest.</CardDescription>
          </div>
          <Badge variant="success">{uploaded.length}/4 submitted</Badge>
        </CardHeader>
        <CardContent>
          <div className="space-y-2.5">
            {checklist.map((c) => {
              const isUploaded = uploaded.includes(c.type);
              return (
                <div
                  key={c.type}
                  className={cn(
                    "flex items-center gap-4 rounded-xl border p-3.5 transition-colors",
                    isUploaded ? "border-border bg-card" : "border-dashed border-border/80 bg-muted/30"
                  )}
                >
                  <div
                    className={cn(
                      "grid size-10 shrink-0 place-items-center rounded-xl",
                      isUploaded ? "bg-success/12 text-success" : "bg-muted text-muted-foreground"
                    )}
                  >
                    {isUploaded ? <Check className="size-5" strokeWidth={3} /> : <FileText className="size-5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">
                      {c.label}
                      {isUploaded && <span className="ml-2 text-xs font-normal text-success">verified</span>}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                      {isUploaded ? (
                        <>
                          <ScanLine className="size-3.5" /> OCR extracted · {c.note}
                        </>
                      ) : (
                        c.note
                      )}
                    </p>
                  </div>
                  {isUploaded ? (
                    <Badge variant="outline" className="gap-1">
                      <Eye className="size-3" /> View
                    </Badge>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => upload(c.type, c.label)}>
                      <UploadCloud className="size-3.5" /> Upload
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Re-verification + audit */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Re-verification timeline</CardTitle>
            <CardDescription>Automated reminders keep your compliance continuous.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { doc: "FCRA Registration", date: "14 Sep 2026", days: 224, tone: "warning" as const },
              { doc: "80G Renewal", date: "30 Jun 2028", days: 863, tone: "success" as const },
            ].map((r) => (
              <div key={r.doc} className="flex items-center justify-between rounded-xl border border-border p-3.5">
                <div>
                  <p className="text-sm font-medium">{r.doc}</p>
                  <p className="text-xs text-muted-foreground">Renews {r.date}</p>
                </div>
                <Badge variant={r.tone} dot>
                  {r.days} days left
                </Badge>
              </div>
            ))}
            <p className="text-xs leading-relaxed text-muted-foreground">
              When a document approaches renewal, Kards flags it, pauses exposure to new corporate spend, and
              re-scores automatically — every recompute logged.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Score audit trail</CardTitle>
            <CardDescription>Append-only — never silently re-scored.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { who: "system", what: "Score recomputed after 80G upload", when: "12 Aug 2025", ok: true },
              { who: "admin@kards.app", what: "Documents verified after manual review", when: "02 Sep 2025", ok: true },
              { who: "system", what: "FCRA expiry flag · score frozen for new spend", when: "15 Feb 2026", ok: false },
            ].map((e, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className={cn("grid size-7 shrink-0 place-items-center rounded-full", e.ok ? "bg-success/12 text-success" : "bg-warning/15 text-warning")}>
                  {e.ok ? <Check className="size-3.5" strokeWidth={3} /> : <X className="size-3.5" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{e.what}</p>
                  <p className="text-xs text-muted-foreground">{e.who}</p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">{e.when}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
