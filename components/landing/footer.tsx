"use client";

import Link from "next/link";
import { Logo } from "./logo";
import { i18n } from "@/lib/i18n";
import { Language } from "@/lib/types";

const columns = [
  {
    title: "Product",
    links: [
      { label: "For Companies", href: "#nav_companies" },
      { label: "For NGOs", href: "#nav_ngos" },
      { label: "For Volunteers", href: "/app/volunteer" },
      { label: "Pricing", href: "#pricing" },
    ],
  },
  {
    title: "Compliance",
    links: [
      { label: "NGO Verification", href: "/app/ngo/verification" },
      { label: "CSR-Ready Score", href: "/app/ngo" },
      { label: "Schedule VII", href: "#pricing" },
      { label: "Compliance Reports", href: "/app/company/reports" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Careers", href: "#" },
      { label: "Press", href: "#" },
      { label: "Privacy (DPDP)", href: "#" },
      { label: "Terms", href: "#" },
    ],
  },
];

export function Footer({ lang }: { lang: Language }) {
  const t = i18n[lang];
  return (
    <footer className="border-t border-border bg-card/60">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              The corporate volunteering &amp; CSR compliance platform for tier-2/3 India. Verify NGOs, deploy
              budgets, prove compliance.
            </p>
            <div className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="rounded-full border border-border bg-card px-3 py-1">EN</span>
              <span className="rounded-full border border-border bg-card px-3 py-1">हिन्दी</span>
              <span className="rounded-full border border-border bg-card px-3 py-1">தமிழ்</span>
            </div>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {col.title}
              </p>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Kards Technologies Pvt. Ltd. {t.footer_rights}
          </p>
          <p className="text-xs text-muted-foreground">
            DPDP-compliant · Documents encrypted at rest · Audit logs append-only
          </p>
        </div>
      </div>
    </footer>
  );
}
