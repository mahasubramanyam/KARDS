"use client";

import { motion } from "framer-motion";
import {
  ArrowUpRight,
  BadgeCheck,
  FileCheck2,
  TrendingUp,
  Building2,
  Users,
  IndianRupee,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function WindowDot({ color }: { color: string }) {
  return <span className={cn("size-2.5 rounded-full", color)} />;
}

function FloatingCard({
  className,
  children,
  delay = 0,
  x = 0,
}: {
  className?: string;
  children: React.ReactNode;
  delay?: number;
  x?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: x * -24 }}
      animate={{ opacity: 1, x }}
      transition={{ delay, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={cn("absolute z-20 hidden lg:block", className)}
    >
      <div className="animate-float shadow-lift">{children}</div>
    </motion.div>
  );
}

export function HeroMockup() {
  return (
    <div className="relative">
      <FloatingCard className="-left-6 top-10 xl:-left-16" delay={0.5}>
        <div className="w-60 rounded-2xl border border-border bg-card/95 p-4 backdrop-blur">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">CSR-Ready Score</span>
            <Badge variant="success" dot>
              Verified
            </Badge>
          </div>
          <div className="flex items-end gap-2">
            <span className="font-heading text-4xl font-bold text-foreground">92</span>
            <span className="mb-1 flex items-center gap-1 text-xs font-medium text-success">
              <TrendingUp className="size-3" /> +18 this quarter
            </span>
          </div>
          <Progress value={92} className="mt-3" tone="success" />
          <p className="mt-2 text-[11px] text-muted-foreground">Siksha Setu Foundation · Pune</p>
        </div>
      </FloatingCard>

      <FloatingCard className="-right-8 bottom-8 xl:-right-20" delay={0.7}>
        <div className="w-64 rounded-2xl border border-border bg-card/95 p-4 backdrop-blur">
          <div className="mb-3 flex items-center gap-2">
            <div className="grid size-8 place-items-center rounded-lg bg-success/15">
              <FileCheck2 className="size-4 text-success" />
            </div>
            <div>
              <p className="text-xs font-semibold">Q1 compliance report</p>
              <p className="text-[10px] text-muted-foreground">Board-ready · Schedule VII mapped</p>
            </div>
          </div>
          <div className="space-y-1.5">
            {[
              { label: "Education", w: 82 },
              { label: "Health", w: 58 },
              { label: "Environment", w: 44 },
            ].map((row) => (
              <div key={row.label} className="flex items-center gap-2">
                <span className="w-20 text-[10px] text-muted-foreground">{row.label}</span>
                <Progress value={row.w} className="h-1.5 flex-1" tone="primary" />
              </div>
            ))}
          </div>
          <p className="mt-3 flex items-center gap-1 text-[11px] font-medium text-primary">
            Download PDF <ArrowUpRight className="size-3" />
          </p>
        </div>
      </FloatingCard>

      <FloatingCard className="-left-4 bottom-4 xl:-left-24" delay={0.9}>
        <div className="w-56 rounded-2xl border border-border bg-card/95 p-4 backdrop-blur">
          <div className="mb-2 flex items-center gap-2">
            <div className="grid size-8 place-items-center rounded-lg bg-primary/12">
              <Users className="size-4 text-primary" />
            </div>
            <div>
              <p className="text-xs font-semibold">Volunteer matched</p>
              <p className="text-[10px] text-muted-foreground">94% skill match · 10 min away</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <BadgeCheck className="size-3.5 text-primary" />
            <span className="text-[10px] text-muted-foreground">Aditi Sharma · Engineering</span>
          </div>
        </div>
      </FloatingCard>

      <div className="relative mx-auto max-w-4xl">
        <div className="absolute -inset-x-8 -inset-y-4 -z-10 rounded-[28px] bg-gradient-to-b from-primary/10 via-transparent to-transparent blur-2xl" />
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="overflow-hidden rounded-2xl border border-border bg-card shadow-lift"
        >
          <div className="flex items-center gap-2 border-b border-border bg-muted/50 px-4 py-3">
            <WindowDot color="bg-[#FF5F57]" />
            <WindowDot color="bg-[#FEBC2E]" />
            <WindowDot color="bg-[#28C840]" />
            <div className="ml-3 hidden flex-1 rounded-md bg-card px-3 py-1 text-[11px] text-muted-foreground sm:block">
              app.kards.in / company / compliance
            </div>
            <Badge variant="secondary" className="gap-1">
              <BadgeCheck className="size-3 text-success" /> Nexora Technologies · Growth
            </Badge>
          </div>
          <div className="grid grid-cols-4 gap-3 p-4 sm:p-5">
            {[
              { label: "Hours logged", value: "4,860", delta: "+18%", icon: Users, tone: "text-primary bg-primary/12" },
              { label: "Budget deployed", value: "₹1.24 Cr", delta: "+12%", icon: IndianRupee, tone: "text-success bg-success/12" },
              { label: "Volunteers", value: "342", delta: "+64", icon: Building2, tone: "text-accent bg-accent/15" },
              { label: "NGOs engaged", value: "6", delta: "+2", icon: BadgeCheck, tone: "text-[hsl(285,70%,55%)] bg-[hsl(285,70%,55%)/0.12]" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-border/70 bg-background/60 p-3">
                <div className={cn("mb-2 inline-grid size-7 place-items-center rounded-lg", s.tone)}>
                  <s.icon className="size-3.5" />
                </div>
                <p className="font-heading text-sm font-bold leading-tight sm:text-lg">{s.value}</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">{s.label}</p>
                <span className="text-[10px] font-medium text-success">{s.delta}</span>
              </div>
            ))}
            <div className="col-span-4 sm:col-span-2">
              <div className="rounded-xl border border-border/70 bg-background/60 p-3">
                <p className="text-[10px] font-medium text-muted-foreground">Schedule VII allocation</p>
                <div className="mt-2 space-y-1.5">
                  {[
                    { label: "Education", w: 70, c: "bg-primary" },
                    { label: "Livelihood", w: 55, c: "bg-accent" },
                    { label: "Health", w: 45, c: "bg-success" },
                    { label: "Environment", w: 38, c: "bg-[hsl(120,45%,42%)]" },
                  ].map((r) => (
                    <div key={r.label} className="flex items-center gap-2">
                      <span className="w-[68px] text-[10px] text-muted-foreground">{r.label}</span>
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${r.w}%` }}
                          transition={{ delay: 0.8 + (r.w / 100), duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                          className={cn("h-full rounded-full", r.c)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="col-span-4 sm:col-span-2">
              <div className="flex h-full flex-col rounded-xl border border-border/70 bg-background/60 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-medium text-muted-foreground">CSR budget utilization</p>
                  <Badge variant="success">On track</Badge>
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <span className="font-heading text-2xl font-bold">68%</span>
                  <Progress value={68} className="flex-1" tone="accent" />
                </div>
                <p className="mt-auto pt-2 text-[10px] text-muted-foreground">
                  ₹2.85 Cr committed of ₹4.20 Cr FY26 budget
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
