"use client";

import { motion } from "framer-motion";
import { type LucideIcon } from "lucide-react";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { cn } from "@/lib/utils";

export interface StatCardProps {
  label: string;
  value: number;
  format?: (n: number) => string;
  icon: LucideIcon;
  delta?: { value: string; positive?: boolean };
  tone?: "primary" | "success" | "accent" | "info" | "violet" | "warning" | "destructive";
  delay?: number;
  hint?: string;
}

const tones = {
  primary: "bg-primary/12 text-primary",
  success: "bg-success/12 text-[hsl(152,60%,35%)] dark:text-[hsl(152,60%,70%)]",
  accent: "bg-accent/15 text-[hsl(32,90%,35%)] dark:text-[hsl(38,92%,72%)]",
  info: "bg-[hsl(200,80%,48%)]/12 text-[hsl(200,80%,38%)] dark:text-[hsl(200,80%,70%)]",
  violet: "bg-[hsl(285,70%,55%)]/12 text-[hsl(285,70%,45%)] dark:text-[hsl(285,70%,72%)]",
  warning: "bg-[hsl(38,92%,50%)]/14 text-[hsl(32,90%,38%)] dark:text-[hsl(38,92%,72%)]",
  destructive: "bg-destructive/12 text-destructive",
};

export function StatCard({
  label,
  value,
  format,
  icon: Icon,
  delta,
  tone = "primary",
  delay = 0,
  hint,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift"
    >
      <div className="absolute -right-6 -top-6 size-20 rounded-full bg-primary/5 blur-2xl transition-colors group-hover:bg-primary/10" />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1.5 font-heading text-2xl font-bold tracking-tight sm:text-3xl">
            <AnimatedNumber value={value} format={format} />
          </p>
        </div>
        <div className={cn("grid size-10 shrink-0 place-items-center rounded-xl", tones[tone])}>
          <Icon className="size-5" />
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        {delta && (
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold",
              delta.positive ? "bg-success/12 text-[hsl(152,60%,35%)] dark:text-[hsl(152,60%,68%)]" : "bg-destructive/10 text-destructive"
            )}
          >
            {delta.value}
          </span>
        )}
        {hint && <span className="truncate text-xs text-muted-foreground">{hint}</span>}
      </div>
    </motion.div>
  );
}
