"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { stats } from "@/lib/data";
import { AnimatedNumber } from "@/components/ui/animated-number";

export function CtaBanner() {
  return (
    <section className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-[2rem] border border-primary/25 bg-gradient-to-br from-primary via-[hsl(270,70%,50%)] to-[hsl(285,70%,48%)] px-6 py-16 text-center text-primary-foreground sm:px-16"
        >
          <div className="absolute inset-0 grid-bg opacity-15 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
          <div className="animate-aurora absolute -right-20 -top-24 h-72 w-72 rounded-full bg-white/10 blur-[90px]" />
          <div className="animate-aurora absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-accent/25 blur-[90px] [animation-delay:5s]" />

          <div className="relative">
            <div className="mb-6 flex justify-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider backdrop-blur">
                <Sparkles className="size-3.5 text-accent" /> Free for NGOs &amp; volunteers
              </span>
            </div>
            <h2 className="mx-auto max-w-3xl text-balance text-3xl font-bold leading-tight sm:text-5xl">
              Get verified. Get funded. Get certified — before your next board meeting.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-pretty text-base text-primary-foreground/80">
              Join the NGO that doubled its CSR funding and the company that went from spreadsheet chaos to a
              zero-query audit.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/auth/register">
                <Button
                  size="xl"
                  variant="secondary"
                  className="w-full bg-white text-primary hover:bg-white/90 sm:w-auto"
                >
                  Create your free account
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button
                  size="xl"
                  variant="ghost"
                  className="w-full border border-white/30 text-primary-foreground hover:bg-white/10 sm:w-auto"
                >
                  Sign in
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="flex flex-col items-center text-center"
            >
              <span className="font-heading text-3xl font-bold text-foreground sm:text-4xl">
                <AnimatedNumber value={s.value} format={(n) => n.toLocaleString("en-IN")} />
                {s.suffix}
              </span>
              <span className="mt-1.5 text-sm text-muted-foreground">{s.label}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
