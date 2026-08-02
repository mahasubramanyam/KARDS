"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ShieldCheck, ScanSearch, ArrowRight, FileBadge, Lock, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/landing/logo";

export function VerifyCodeLookup() {
  const router = useRouter();
  const [code, setCode] = useState("");

  const go = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = code.trim().toUpperCase();
    if (clean) router.push(`/verify/${clean}`);
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-16">
      <div className="absolute inset-0 -z-10 grid-bg opacity-70" />
      <div className="absolute -top-40 left-1/2 -z-10 h-96 w-[720px] -translate-x-1/2 rounded-full bg-primary/15 blur-[120px]" />

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <a href="/" className="inline-flex items-center gap-2">
          <Logo />
        </a>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="mt-10 w-full max-w-xl text-center"
      >
        <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
          <ShieldCheck className="size-7" />
        </div>
        <h1 className="mt-5 font-heading text-3xl font-bold tracking-tight sm:text-4xl">
          Verify a volunteering certificate
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
          Enter the code printed on the certificate card. Each credential is hash-locked at issue and
          cannot be altered.
        </p>

        <form onSubmit={go} className="mt-7">
          <div className="flex flex-col gap-2.5 sm:flex-row">
            <div className="relative flex-1">
              <ScanSearch className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="KRD-XXXX-XXXX-XX"
                className="h-12 pl-10 font-mono uppercase tracking-wider"
                autoFocus
              />
            </div>
            <Button type="submit" className="h-12 px-6" disabled={!code.trim()}>
              Verify <ArrowRight className="size-4" />
            </Button>
          </div>
        </form>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <span className="rounded-full border border-border bg-card px-3 py-1.5 text-[11px] text-muted-foreground">
            Certificates are verified against the live Kards ledger.
          </span>
        </div>

        <div className="mt-10 grid grid-cols-3 gap-3 text-left">
          {[
            { icon: Lock, title: "Tamper-evident", desc: "Alter the card, and the hash breaks." },
            { icon: QrCode, title: "Scan anywhere", desc: "QR re-verifies instantly." },
            { icon: FileBadge, title: "Lifetime", desc: "Immutable, never expires." },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl border border-border bg-card p-4">
              <f.icon className="size-4 text-primary" />
              <p className="mt-2 text-xs font-semibold">{f.title}</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
