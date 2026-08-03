"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  Loader2,
  BadgeCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/lib/auth";
import { api, ApiError, type CsrScoreBreakdownApi, type DocumentOut, type VerificationRequestOut } from "@/lib/api";
import { cn } from "@/lib/utils";

const DOC_TYPES = [
  { value: "12a", label: "12A Registration", note: "Registration under Section 12A — tax exemption" },
  { value: "80g", label: "80G Deduction", note: "Donors claim 80G deduction benefits" },
  { value: "fcra", label: "FCRA Registration", note: "Foreign contribution regulation clearance" },
  { value: "niti_aayog", label: "NITI Aayog (optional)", note: "Boosts discovery in your sector" },
  { value: "pan", label: "PAN Card", note: "Organisation PAN for KYC" },
  { value: "other", label: "Other document", note: "Trust deed, registration certificate, etc." },
];

const statusMeta: Record<string, { label: string; variant: "warning" | "success" | "destructive" | "outline" }> = {
  unverified: { label: "Not submitted", variant: "outline" },
  pending: { label: "Under review", variant: "warning" },
  verified: { label: "Verified", variant: "success" },
  rejected: { label: "Rejected", variant: "destructive" },
};

export function NgoVerification() {
  const { push } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [docs, setDocs] = useState<DocumentOut[]>([]);
  const [request, setRequest] = useState<VerificationRequestOut | null>(null);
  const [score, setScore] = useState<CsrScoreBreakdownApi | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ds, req, sc] = await Promise.all([
        api.verification.documents().catch(() => []),
        api.verification.status().catch(() => null),
        api.verification.score().catch(() => null),
      ]);
      setDocs(ds);
      setRequest(req);
      setScore(sc);
    } catch (e) {
      setError((e as ApiError).message || "Could not load verification data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const upload = async (docType: string, label: string, file: File) => {
    if (!user) return;
    setUploading(docType);
    try {
      const doc = await api.verification.uploadDocument(file, user.id, docType);
      setDocs((d) => [doc, ...d]);
      push("success", "Document uploaded", `${label} queued for OCR extraction.`);
    } catch (e) {
      push("error", "Upload failed", (e as ApiError).message);
    } finally {
      setUploading(null);
      if (fileRefs.current[docType]) fileRefs.current[docType]!.value = "";
    }
  };

  const submit = async () => {
    const ids = docs.map((d) => d.id);
    if (ids.length === 0) return;
    setSubmitting(true);
    try {
      const req = await api.verification.submit(ids);
      setRequest(req);
      push("success", "Verification submitted", "Documents sent for admin review.");
      load();
    } catch (e) {
      push("error", "Could not submit", (e as ApiError).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="grid place-items-center py-32 text-center">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="mt-3 text-sm text-muted-foreground">Loading verification pipeline…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid place-items-center py-32 text-center">
        <p className="text-sm font-medium text-destructive">{error}</p>
      </div>
    );
  }

  const status = request?.status ?? "unverified";
  const uploadedCount = docs.length;
  const scoreTotal = score?.total ?? 0;

  return (
    <div className="space-y-6">
      {/* Pipeline status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-success" /> Verification pipeline
          </CardTitle>
          <CardDescription>
            Documents are OCR-extracted and reviewed by admins. Every transition is written to the immutable audit log.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-muted/30 p-4 text-sm">
            <Badge variant={statusMeta[status].variant} dot className="text-xs">
              {statusMeta[status].label}
            </Badge>
            {request ? (
              <p className="text-muted-foreground">
                Submitted {new Date(request.submitted_at).toLocaleDateString("en-IN")}
                {request.decision_reason && (
                  <span className="mt-0.5 block text-xs">{request.decision_reason}</span>
                )}
              </p>
            ) : (
              <p className="text-muted-foreground">
                No verification request yet — upload your documents below and submit for review.
              </p>
            )}
          </div>
          {scoreTotal > 0 && (
            <div className="mt-4 flex items-center gap-3 rounded-xl border border-success/25 bg-success/8 p-4">
              <BadgeCheck className="size-5 shrink-0 text-success" />
              <div className="text-sm">
                <p className="font-semibold text-foreground">CSR-Ready Score: {scoreTotal.toFixed(0)}/100</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {score && `Documents ${score.documents_weight.toFixed(0)} · Operations ${score.operations_weight.toFixed(0)} · Past performance ${score.past_performance_weight.toFixed(0)} · Governance ${score.governance_weight.toFixed(0)}`}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Document checklist */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Document checklist</CardTitle>
            <CardDescription>OCR first-pass + admin side-by-side review. Files encrypted at rest.</CardDescription>
          </div>
          <Badge variant="success">{uploadedCount}/{DOC_TYPES.length} submitted</Badge>
        </CardHeader>
        <CardContent>
          <div className="space-y-2.5">
            {DOC_TYPES.map((item) => {
              const doc = docs.find((d) => d.doc_type === item.value);
              const isUploaded = Boolean(doc);
              return (
                <div
                  key={item.value}
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
                      {item.label}
                      {isUploaded && doc!.validation_status === "valid" && (
                        <span className="ml-2 text-xs font-normal text-success">verified</span>
                      )}
                      {isUploaded && doc!.validation_status === "pending" && (
                        <span className="ml-2 text-xs font-normal text-warning">in OCR</span>
                      )}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                      {isUploaded ? (
                        <>
                          <ScanLine className="size-3.5" /> {doc!.file_name}
                        </>
                      ) : (
                        item.note
                      )}
                    </p>
                  </div>
                  <input
                    ref={(el) => {
                      fileRefs.current[item.value] = el;
                    }}
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) upload(item.value, item.label, f);
                    }}
                  />
                  {isUploaded ? (
                    <Badge variant="outline" className="gap-1">
                      <Eye className="size-3" /> {doc!.size_bytes > 0 ? `${(doc!.size_bytes / 1024).toFixed(0)}KB` : "View"}
                    </Badge>
                  ) : (
                    <Button size="sm" variant="outline" disabled={uploading === item.value} onClick={() => fileRefs.current[item.value]?.click()}>
                      {uploading === item.value ? <Loader2 className="size-3.5 animate-spin" /> : <UploadCloud className="size-3.5" />}
                      {uploading === item.value ? "Uploading…" : "Upload"}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <Card>
        <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm">
            <p className="font-semibold">Submit for verification</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {uploadedCount === 0
                ? "Upload at least one compliance document to start."
                : `${uploadedCount} document${uploadedCount > 1 ? "s" : ""} will be sent to the admin review queue.`}
            </p>
          </div>
          <Button
            onClick={submit}
            disabled={uploadedCount === 0 || submitting || request?.status === "pending" || request?.status === "verified"}
          >
            {submitting ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
            {request?.status === "pending" ? "Already under review" : request?.status === "verified" ? "Already verified" : "Submit for review"}
          </Button>
        </CardContent>
      </Card>

      {/* Re-verification + audit */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Renewal reminders</CardTitle>
            <CardDescription>Expiring registrations pause exposure to new corporate spend automatically.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {docs.length === 0 ? (
              <p className="text-xs leading-relaxed text-muted-foreground">
                Uploaded documents appear here with their OCR validation state. No documents uploaded yet.
              </p>
            ) : (
              docs.map((d) => (
                <div key={d.id} className="flex items-center justify-between rounded-xl border border-border p-3.5">
                  <div>
                    <p className="text-sm font-medium">{d.doc_type}</p>
                    <p className="text-xs text-muted-foreground">{d.file_name}</p>
                  </div>
                  <Badge
                    variant={d.validation_status === "valid" ? "success" : d.validation_status === "invalid" ? "destructive" : "warning"}
                    dot
                  >
                    {d.validation_status === "valid" ? "Valid" : d.validation_status === "invalid" ? "Rejected" : "Pending OCR"}
                  </Badge>
                </div>
              ))
            )}
            <p className="text-xs leading-relaxed text-muted-foreground">
              When a document approaches renewal, Kards flags it and re-scores automatically — every recompute logged.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Score audit trail</CardTitle>
            <CardDescription>Append-only — never silently re-scored.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {!request ? (
              <p className="text-xs leading-relaxed text-muted-foreground">
                Once you submit documents, every review decision and score computation appears here.
              </p>
            ) : (
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "grid size-7 shrink-0 place-items-center rounded-full",
                    request.status === "verified" ? "bg-success/12 text-success" : request.status === "rejected" ? "bg-warning/15 text-warning" : "bg-muted text-muted-foreground"
                  )}
                >
                  {request.status === "verified" ? <Check className="size-3.5" strokeWidth={3} /> : request.status === "rejected" ? <X className="size-3.5" /> : <Clock3 className="size-3.5" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {request.status === "verified" ? "Verified after admin review" : request.status === "rejected" ? "Rejected — see decision reason" : "Submitted for review"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {request.decision_reason ?? `Submitted ${new Date(request.submitted_at).toLocaleDateString("en-IN")}`}
                  </p>
                </div>
                {request.reviewed_at && (
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {new Date(request.reviewed_at).toLocaleDateString("en-IN")}
                  </span>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
