"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, ShieldX, QrCode, CalendarDays, Clock3, Building2, BadgeCheck, ScanSearch, Info, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api, type CertificatePublic } from "@/lib/api";

const CODE_RE = /^[A-Z0-9]{3,4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{2,4}$/;

export function VerifyCertificate({ code }: { code: string }) {
  const clean = code.trim().toUpperCase();
  const [result, setResult] = useState<CertificatePublic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      if (!CODE_RE.test(clean)) {
        setLoading(false);
        setResult(null);
        return;
      }
      try {
        const data = await api.public.verifyCertificate(clean);
        if (!cancelled) setResult(data);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Verification failed");
          setResult(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    setLoading(true);
    setResult(null);
    setError(null);
    check();
    return () => {
      cancelled = true;
    };
  }, [clean]);

  const valid = result?.valid ?? false;

  if (loading) {
    return (
      <div className="mx-auto grid max-w-3xl place-items-center py-32 text-center">
        <div>
          <Loader2 className="mx-auto size-8 animate-spin text-primary" />
          <p className="mt-3 text-sm text-muted-foreground">Checking the credential ledger…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6 flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs text-muted-foreground"
      >
        <ScanSearch className="size-3.5 text-primary" /> kards.in/verify — tamper-evident certificate validation
      </motion.div>

      {!valid && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="rounded-3xl border border-destructive/25 bg-destructive/5 p-8 text-center"
        >
          <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-destructive/10 text-destructive">
            <ShieldX className="size-8" />
          </div>
          <h1 className="mt-4 font-heading text-2xl font-bold">Certificate not found</h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
            {error
              ? error
              : `We couldn't verify ${clean || "this code"}. The code may be mistyped, the certificate revoked, or it never existed. Certificates are immutable — any alteration breaks the validation hash.`}
          </p>
          <Link href="/verify">
            <Button className="mt-6">
              <ScanSearch className="size-4" /> Try another code
            </Button>
          </Link>
        </motion.div>
      )}

      {valid && result && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="flex items-center gap-2 rounded-2xl border border-success/25 bg-success/8 p-3.5 text-sm">
            <BadgeCheck className="size-5 shrink-0 text-success" />
            <p>
              <span className="font-semibold text-foreground">Verified credential.</span>{" "}
              <span className="text-muted-foreground">
                Issued by Kards Verified Credentials ·{" "}
                {result.content_hash_verified === false ? "hash mismatch flagged" : "hash intact"}.
              </span>
            </p>
          </div>

          {/* Certificate card */}
          <div className="mt-5 overflow-hidden rounded-3xl border border-border bg-card shadow-xl shadow-primary/5">
            <div className="grid md:grid-cols-[1fr_auto]">
              <div className="relative p-7 sm:p-8">
                <div className="pointer-events-none absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "repeating-linear-gradient(45deg, #7C3AED 0, #7C3AED 1px, transparent 1px, transparent 12px)" }} />
                <div className="relative">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">Kards · Verified</span>
                    <Badge variant="success" dot>Verified {result.issued_at ? new Date(result.issued_at).toLocaleDateString("en-IN") : ""}</Badge>
                  </div>
                  <p className="mt-5 text-xs font-medium uppercase tracking-wider text-muted-foreground">Certificate of volunteering</p>
                  <h2 className="mt-1 font-heading text-3xl font-bold tracking-tight">{result.volunteer_name ?? "Volunteer"}</h2>
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    Volunteered for
                  </p>
                  <p className="font-heading text-lg font-semibold leading-snug text-foreground">"{result.opportunity_title ?? "Volunteering activity"}"</p>

                  <div className="mt-6 grid grid-cols-3 gap-3">
                    <div className="rounded-xl border border-border/70 bg-background/60 p-3">
                      <Clock3 className="size-4 text-primary" />
                      <p className="mt-1.5 font-heading text-lg font-bold">{result.hours_total ?? 0} hrs</p>
                      <p className="text-[11px] text-muted-foreground">Verified hours</p>
                    </div>
                    <div className="rounded-xl border border-border/70 bg-background/60 p-3">
                      <Building2 className="size-4 text-primary" />
                      <p className="mt-1.5 font-heading text-lg font-bold capitalize">{result.status ?? "issued"}</p>
                      <p className="text-[11px] text-muted-foreground">Ledger status</p>
                    </div>
                    <div className="rounded-xl border border-border/70 bg-background/60 p-3">
                      <CalendarDays className="size-4 text-primary" />
                      <p className="mt-1.5 font-heading text-lg font-bold">
                        {result.issued_at ? new Date(result.issued_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "—"}
                      </p>
                      <p className="text-[11px] text-muted-foreground">Issued date</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tamper strip + QR */}
              <div className="flex flex-col items-center justify-between gap-4 border-t border-dashed border-border/70 p-6 md:border-l md:border-t-0">
                <div className="rounded-2xl bg-white p-3.5 shadow-inner ring-1 ring-border/60">
                  <div className="grid h-24 w-24 grid-cols-7 gap-1">
                    {Array.from({ length: 49 }).map((_, i) => {
                      const on = [0, 3, 5, 6, 8, 11, 12, 13, 14, 19, 20, 22, 24, 25, 26, 27, 29, 31, 33, 36, 37, 38, 40, 42, 44, 46, 48].includes(i);
                      return <span key={i} className={on ? "rounded-[2px] bg-slate-900" : ""} />;
                    })}
                  </div>
                </div>
                <div className="text-center">
                  <QrCode className="mx-auto size-5 text-muted-foreground" />
                  <p className="mt-1.5 font-mono text-xs font-bold text-foreground">{result.code}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">Scan to re-verify</p>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-success">
                  <ShieldCheck className="size-3.5" /> Tamper-proof
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 flex items-start gap-2.5 rounded-2xl border border-border bg-card p-4 text-xs leading-relaxed text-muted-foreground">
            <Info className="mt-0.5 size-4 shrink-0 text-primary" />
            <p>
              This certificate's code and details are locked on the Kards ledger at issuance. If the card above is
              printed and edited, this page will fail validation. Need the original? Ask the volunteer to open it from{" "}
              <span className="font-medium text-foreground">their Kards certificate vault</span>.
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
