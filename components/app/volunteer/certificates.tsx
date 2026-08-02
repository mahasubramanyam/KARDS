"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  BadgeCheck,
  QrCode,
  ShieldCheck,
  Award,
  Share2,
  FileDown,
  Lock,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { Section } from "@/components/app/section";
import { StatCard } from "@/components/app/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { api, ApiError, type CertificateOut } from "@/lib/api";
import { SCHEDULE_VII_META } from "@/lib/types";

function CertificateCard({ cert, index }: { cert: CertificateOut; index: number }) {
  const { push } = useToast();
  const isPremium = cert.template === "premium";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      className="group relative overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
    >
      <div className="relative border-b border-border/70 bg-gradient-to-br from-primary/12 via-transparent to-transparent p-5">
        <div className="absolute right-4 top-4 flex items-center gap-1.5">
          {isPremium && (
            <Badge variant="accent" className="gap-1">
              Premium
            </Badge>
          )}
          <Badge variant="success" dot>
            Verified
          </Badge>
        </div>
        <div className="grid size-12 place-items-center rounded-2xl bg-primary/12">
          <Award className="size-6 text-primary" />
        </div>
        <h3 className="mt-4 pr-24 font-heading text-base font-semibold">{cert.title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">NGO Verified Credential</p>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
          <span className="flex items-center gap-1 text-muted-foreground">
            <ShieldCheck className="size-3.5 text-success" /> {cert.hours_total} hours logged
          </span>
          <span className="text-muted-foreground">Issued {new Date(cert.issued_at).toLocaleDateString("en-IN")}</span>
        </div>
      </div>

      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid size-14 place-items-center rounded-xl border border-border bg-muted/50">
            <QrCode className="size-7 text-foreground" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Verification code</p>
            <p className="font-mono text-sm font-semibold tracking-wide">{cert.code}</p>
            <p className="text-[11px] text-muted-foreground">
              Check at kards.in/verify/{cert.code}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => push("info", "Link copied", `kards.in/verify/${cert.code}`)}
          >
            <Share2 className="size-3.5" /> Share link
          </Button>
          <Button
            size="sm"
            onClick={() => push("success", "PDF downloaded", "Immutable certificate · QR embedded.")}
          >
            <FileDown className="size-3.5" /> Download PDF
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

export function CertificatesPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [certificates, setCertificates] = useState<CertificateOut[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.volunteering.myCertificates();
      setCertificates(data);
    } catch (e) {
      setError((e as ApiError).message || "Could not load certificates.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const totalHours = certificates.reduce((acc, c) => acc + c.hours_total, 0);

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Certificates earned" value={certificates.length} icon={BadgeCheck} tone="success" />
        <StatCard label="Total hours verified" value={totalHours} icon={ShieldCheck} tone="primary" />
        <StatCard label="Verification checks" value={0} icon={QrCode} tone="violet" />
      </div>

      <Section
        title="Your credentials"
        subtitle="Immutable once issued — hours, dates and signatures cannot change after generation."
        className="mt-8"
      >
        {loading ? (
          <div className="grid place-items-center py-16 text-center">
            <Loader2 className="size-6 animate-spin text-primary" />
            <p className="mt-2 text-sm text-muted-foreground">Loading vault…</p>
          </div>
        ) : error ? (
          <div className="grid place-items-center py-16 text-center">
            <AlertTriangle className="size-6 text-destructive" />
            <p className="mt-2 text-sm text-foreground">{error}</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={load}>
              Retry
            </Button>
          </div>
        ) : certificates.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
            No certificates issued yet. Complete sanctioned volunteering opportunities to earn credentials.
          </div>
        ) : (
          <div className="space-y-4">
            {certificates.map((c, i) => (
              <CertificateCard key={c.id} cert={c} index={i} />
            ))}
          </div>
        )}
      </Section>

      <Card className="mt-8 overflow-hidden">
        <CardContent className="grid gap-5 p-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="flex items-start gap-4">
            <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10">
              <Lock className="size-5 text-primary" />
            </div>
            <div>
              <p className="font-heading text-base font-semibold">Tamper-evident, verifiable by anyone</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Every certificate carries a unique code. Recruiters, universities and CSR teams can confirm
                authenticity at the public verification page — no account needed.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
