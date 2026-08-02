"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  FileCheck2,
  Globe2,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { i18n } from "@/lib/i18n";
import { Language } from "@/lib/types";
import { HeroMockup } from "./hero-mockup";

export function Hero({ lang }: { lang: Language }) {
  const t = i18n[lang];
  return (
    <section className="relative overflow-hidden pt-32 pb-16 sm:pt-40 sm:pb-24">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 grid-bg opacity-40 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black,transparent)]" />
        <div className="absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-primary/15 blur-[120px]" />
        <div className="animate-aurora absolute top-24 right-[-10%] h-80 w-80 rounded-full bg-[hsl(285,80%,55%)]/20 blur-[100px]" />
        <div className="animate-aurora absolute left-[-8%] top-64 h-72 w-72 rounded-full bg-accent/15 blur-[100px] [animation-delay:4s]" />
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge
              variant="outline"
              className="mb-6 gap-2 rounded-full px-4 py-1.5 text-[13px] font-medium"
            >
              <span className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
                <span className="relative inline-flex size-2 rounded-full bg-success" />
              </span>
              <span className="text-foreground">{t.hero_badge}</span>
              <Sparkles className="size-3.5 text-accent" />
            </Badge>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.08 }}
            className="max-w-4xl text-balance text-4xl font-bold leading-[1.05] sm:text-6xl md:text-7xl"
          >
            {t.hero_title_1}{" "}
            <span className="text-gradient">{t.hero_title_2}</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.16 }}
            className="mt-6 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg"
          >
            {t.hero_sub}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.24 }}
            className="mt-8 flex flex-col items-center gap-3 sm:flex-row"
          >
            <Link href="/auth/register">
              <Button size="lg" className="group w-full gap-2 px-8 text-base shadow-glow sm:w-auto">
                {t.hero_cta}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </Link>
            <a href="#how">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                {t.hero_secondary}
              </Button>
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.34 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground"
          >
            <span className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-success" /> DPDP-compliant
            </span>
            <span className="flex items-center gap-2">
              <Globe2 className="size-4 text-primary" /> English · हिन्दी · தமிழ்
            </span>
            <span className="flex items-center gap-2">
              <FileCheck2 className="size-4 text-accent" /> Schedule VII mapped
            </span>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="mt-16 sm:mt-20"
        >
          <HeroMockup />
        </motion.div>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground">
          <span className="text-xs uppercase tracking-widest text-muted-foreground/70">Trusted by</span>
          <div className="flex -space-x-2">
            {["Meera Joshi", "Rohit Menon", "Lakshmi Venkat", "Vikram Singh", "Aditi Sharma"].map((n) => (
              <div
                key={n}
                className="grid size-8 place-items-center rounded-full bg-gradient-to-br from-primary to-[hsl(285,70%,55%)] text-[10px] font-semibold text-primary-foreground ring-2 ring-card"
              >
                {n.split(" ").map((p) => p[0]).join("")}
              </div>
            ))}
          </div>
          <span className="font-medium text-foreground">{t.hero_trust}</span>
          <BadgeCheck className="size-4 text-primary" />
        </div>
      </div>
    </section>
  );
}
