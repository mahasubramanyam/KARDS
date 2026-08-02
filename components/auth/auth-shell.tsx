"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { BadgeCheck, FileCheck2, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/landing/logo";
import { cn } from "@/lib/utils";

export function AuthShell({
  children,
  title,
  subtitle,
  footer,
  brand = true,
}: {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  footer?: React.ReactNode;
  brand?: boolean;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative flex flex-col items-center justify-center px-4 py-12 sm:px-8">
        <div className="absolute inset-x-0 top-0 -z-10 h-[420px] bg-gradient-to-b from-primary/10 to-transparent" />
        <Link href="/" className="mb-8 self-start lg:hidden">
          <Logo />
        </Link>
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">{subtitle}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-8"
          >
            {children}
          </motion.div>
          {footer && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-6 text-center text-sm text-muted-foreground"
            >
              {footer}
            </motion.div>
          )}
        </div>
      </div>

      {brand && (
        <div className="relative hidden overflow-hidden bg-gradient-to-br from-primary via-[hsl(270,70%,48%)] to-[hsl(285,70%,42%)] lg:block">
          <div className="absolute inset-0 grid-bg opacity-15" />
          <div className="animate-aurora absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/10 blur-[100px]" />
          <div className="animate-aurora absolute -bottom-24 -left-16 h-96 w-96 rounded-full bg-accent/25 blur-[100px] [animation-delay:5s]" />
          <div className="relative flex h-full flex-col justify-between p-12 text-primary-foreground">
            <Link href="/" aria-label="Kards home" className="w-fit">
              <Logo className="[&_span]:text-white [&_[data-sub]]:text-primary-foreground/70" />
            </Link>
            <div>
              <blockquote className="max-w-md text-balance text-2xl font-semibold leading-snug">
                “We were invisible to CSR budgets before Kards. Now our score is 92 and we closed ₹1.2 Cr in
                one quarter.”
              </blockquote>
              <p className="mt-4 text-sm text-primary-foreground/75">
                Meera Joshi — Founder, Siksha Setu Foundation, Pune
              </p>
              <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm text-primary-foreground/80">
                <span className="flex items-center gap-2">
                  <BadgeCheck className="size-4 text-accent" /> 4,120+ verified NGOs
                </span>
                <span className="flex items-center gap-2">
                  <FileCheck2 className="size-4 text-accent" /> Board-ready reports
                </span>
                <span className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-accent" /> DPDP compliant
                </span>
              </div>
            </div>
            <div className={cn("flex flex-wrap gap-2")}>
              {["Schedule VII mapped", "English · हिन्दी · தமிழ்", "Razorpay billing"].map((chip) => (
                <span
                  key={chip}
                  className="rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-medium backdrop-blur"
                >
                  {chip}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
