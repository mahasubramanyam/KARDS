"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Menu, Languages } from "lucide-react";
import { Logo } from "./logo";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { i18n } from "@/lib/i18n";
import { Language } from "@/lib/types";
import { cn } from "@/lib/utils";

const navItems = ["nav_how", "nav_ngos", "nav_companies", "nav_pricing"] as const;

export function LandingNav({ lang, setLang }: { lang: Language; setLang: (l: Language) => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const t = i18n[lang];

  return (
    <header className="fixed inset-x-0 top-0 z-40">
      <motion.nav
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        onScroll={(e) => setScrolled((e.currentTarget as HTMLElement).scrollTop > 8)}
        className={cn(
          "mx-auto mt-3 flex h-14 max-w-6xl items-center justify-between gap-4 rounded-2xl px-4 transition-all duration-300 sm:px-5",
          scrolled || menuOpen
            ? "border border-border/80 bg-card/80 shadow-soft backdrop-blur-xl"
            : "border border-transparent"
        )}
      >
        <Link href="/" aria-label="Kards home">
          <Logo />
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <a
              key={item}
              href={item === "nav_pricing" ? "#pricing" : `#${item}`}
              className="rounded-full px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {t[item]}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <div className="relative">
            <button
              className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-full px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              onClick={() => setLangOpen((v) => !v)}
              aria-label="Change language"
            >
              <Languages className="size-4" />
              <span className="uppercase">{lang}</span>
            </button>
            {langOpen && (
              <div className="absolute right-0 top-11 w-32 overflow-hidden rounded-xl border border-border bg-card p-1 shadow-lift">
                {(["en", "hi", "ta"] as Language[]).map((l) => (
                  <button
                    key={l}
                    onClick={() => {
                      setLang(l);
                      setLangOpen(false);
                    }}
                    className={cn(
                      "flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted",
                      lang === l && "bg-muted font-semibold"
                    )}
                  >
                    {l === "en" ? "English" : l === "hi" ? "हिन्दी" : "தமிழ்"}
                  </button>
                ))}
              </div>
            )}
          </div>
          <Link href="/auth/login">
            <Button variant="ghost">{t.nav_login}</Button>
          </Link>
          <Link href="/auth/register">
            <Button className="shadow-glow">{t.nav_cta}</Button>
          </Link>
        </div>

        <button
          className="inline-flex size-10 cursor-pointer items-center justify-center rounded-full text-foreground hover:bg-muted md:hidden"
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="size-5" />
        </button>
      </motion.nav>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <div className="flex h-full flex-col p-6 pt-16">
          <Logo />
          <div className="mt-8 flex flex-col gap-1">
            {navItems.map((item) => (
              <a
                key={item}
                href={item === "nav_pricing" ? "#pricing" : `#${item}`}
                onClick={() => setMenuOpen(false)}
                className="rounded-xl px-4 py-3 text-base font-medium text-foreground transition-colors hover:bg-muted"
              >
                {t[item]}
              </a>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            {(["en", "hi", "ta"] as Language[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={cn(
                  "flex-1 cursor-pointer rounded-full border px-3 py-2 text-sm transition-colors",
                  lang === l
                    ? "border-primary bg-primary/10 font-semibold text-primary"
                    : "border-border text-muted-foreground"
                )}
              >
                {l === "en" ? "English" : l === "hi" ? "हिन्दी" : "தமிழ்"}
              </button>
            ))}
          </div>
          <div className="mt-auto space-y-2">
            <Link href="/auth/login" className="block">
              <Button variant="outline" className="w-full">
                {t.nav_login}
              </Button>
            </Link>
            <Link href="/auth/register" className="block">
              <Button className="w-full shadow-glow">{t.nav_cta}</Button>
            </Link>
          </div>
        </div>
      </Sheet>
    </header>
  );
}
