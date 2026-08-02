"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  FileText,
  Clock3,
  Users,
  IndianRupee,
  AlertTriangle,
  BadgeCheck,
  CheckCircle2,
  UploadCloud,
  Loader2,
  RefreshCcw,
} from "lucide-react";
import { StatCard } from "@/components/app/stat-card";
import { Section } from "@/components/app/section";
import { CircularProgress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { api, ApiError, type DocumentOut, type VerificationRequestOut, type CsrScoreBreakdownApi } from "@/lib/api";
import { cn } from "@/lib/utils";

export function NgoDashboard() {
  const { push } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusReq, setStatusReq] = useState<VerificationRequestOut | null>(null);
  const [score, setScore] = useState<CsrScoreBreakdownApi | null>(null);
  const [documents, setDocuments] = useState<DocumentOut[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [st, sc, docs] = await Promise.all([
        api.verification.status().catch(() => null),
        api.verification.score().catch(() => null),
        api.verification.documents().catch(() => []),
      ]);
      setStatusReq(st);
      setScore(sc);
      setDocuments(docs);
    } catch (e) {
      setError((e as ApiError).message || "Could not load NGO data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="grid place-items-center py-32 text-center">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="mt-3 text-sm text-muted-foreground">Loading NGO verification & dashboard…</p>
      </div>
    );
  }

  const isVerified = statusReq?.status === "verified";
  const scoreTotal = score?.total ?? 0;

  return (
    <div>
      {/* Verification status banner */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={cn(
          "flex flex-col gap-4 rounded-2xl border p-5 sm:flex-row sm:items-center sm:justify-between",
          isVerified
            ? "border-success/30 bg-gradient-to-r from-success/10 to-transparent"
            : "border-warning/30 bg-gradient-to-r from-warning/10 to-transparent"
        )}
      >
        <div className="flex items-center gap-4">
          <div
            className={cn(
              "grid size-12 shrink-0 place-items-center rounded-2xl",
              isVerified ? "bg-success/15 text-success" : "bg-warning/15 text-warning"
            )}
          >
            {isVerified ? <BadgeCheck className="size-6" /> : <Clock3 className="size-6" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-heading text-lg font-semibold">
                {isVerified ? "Verified & CSR-ready" : statusReq?.status ? `Verification ${statusReq.status}` : "Unverified"}
              </p>
              {isVerified && (
                <Badge variant="success" dot>
                  Score {Math.round(scoreTotal)}/100
                </Badge>
              )}
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {isVerified
                ? "Your NGO profile is verified and visible to corporate sponsors."
                : "Upload compliance documents and submit for verification to unlock corporate visibility."}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href="/app/ngo/verification">
            <Button variant="outline">
              <ShieldCheck className="size-4" /> Manage verification
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="CSR funding" value={0} format={(n) => `₹${n}`} icon={IndianRupee} tone="success" />
        <StatCard label="Volunteers hosted" value={0} icon={Users} tone="primary" />
        <StatCard label="Projects active" value={0} icon={FileText} tone="accent" />
        <StatCard label="Beneficiaries" value={0} icon={CheckCircle2} tone="violet" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* CSR-Ready Score */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>CSR-Ready Score</CardTitle>
            <CardDescription>Weighted formula computed from live documents and history.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center py-2">
              <CircularProgress
                value={scoreTotal}
                size={170}
                stroke={12}
                tone="success"
                label={
                  <div className="text-center">
                    <p className="font-heading text-4xl font-bold">{Math.round(scoreTotal)}</p>
                    <p className="text-xs text-muted-foreground">/ 100</p>
                  </div>
                }
              />
            </div>
            {score && (
              <div className="mt-4 space-y-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Documents (40)</span>
                  <span className="font-semibold">{score.documents_weight}/40</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Operations (30)</span>
                  <span className="font-semibold">{score.operations_weight}/30</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Past performance (20)</span>
                  <span className="font-semibold">{score.past_performance_weight}/20</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Governance (10)</span>
                  <span className="font-semibold">{score.governance_weight}/10</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Documents */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Compliance documents</CardTitle>
              <CardDescription>Encrypted at rest · OCR first-pass · reviewed by admins</CardDescription>
            </div>
            <Link href="/app/ngo/verification">
              <Button size="sm" variant="outline">
                <UploadCloud className="size-4" /> Manage documents
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {documents.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
                No documents uploaded yet. Go to verification pipeline to upload 12A, 80G and FCRA.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/70 text-left text-xs text-muted-foreground">
                      <th className="pb-2.5 pr-4 font-medium">File name</th>
                      <th className="pb-2.5 pr-4 font-medium">Type</th>
                      <th className="pb-2.5 pr-4 font-medium">Status</th>
                      <th className="pb-2.5 font-medium">Uploaded</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents.map((d) => (
                      <tr key={d.id} className="border-b border-border/50 last:border-0">
                        <td className="py-3 pr-4 font-medium">{d.file_name}</td>
                        <td className="py-3 pr-4 font-mono text-xs uppercase">{d.doc_type ?? "other"}</td>
                        <td className="py-3 pr-4">
                          <Badge variant={d.validation_status === "valid" ? "success" : "outline"} dot>
                            {d.validation_status ?? "pending"}
                          </Badge>
                        </td>
                        <td className="py-3 text-xs text-muted-foreground">
                          {new Date(d.created_at).toLocaleDateString("en-IN")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
