"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Logo } from "@/components/landing/logo";
import { Sheet } from "@/components/ui/sheet";
import { Topbar } from "./topbar";
import { RoleSwitcher } from "./role-switcher";
import { SidebarNav } from "./sidebar-nav";
import { NAV, ROLE_LABEL, ROLE_DESC, roleForPath } from "./nav";
import { useAuth } from "@/lib/auth";

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  "/app/volunteer": { title: "Volunteer Dashboard", subtitle: "Recommended for you, based on skill & location" },
  "/app/volunteer/opportunities": { title: "Opportunities", subtitle: "Free discovery layer — browse, filter, apply" },
  "/app/volunteer/certificates": { title: "My Certificates", subtitle: "Verifiable credentials with QR-checkable codes" },
  "/app/volunteer/messages": { title: "Messages", subtitle: "Project-threaded conversations" },
  "/app/ngo": { title: "NGO Dashboard", subtitle: "Your verification status & CSR readiness at a glance" },
  "/app/ngo/verification": { title: "Verification Pipeline", subtitle: "Documents, CSR-Ready Score & review state" },
  "/app/ngo/projects": { title: "Projects & Opportunities", subtitle: "Schedule VII-tagged projects with lifecycle states" },
  "/app/ngo/messages": { title: "Messages", subtitle: "Project-threaded conversations" },
  "/app/company": { title: "CSR Command Center", subtitle: "Budget, hours & Schedule VII deployment" },
  "/app/company/reports": { title: "Compliance Reports", subtitle: "Board-ready, Schedule VII-mapped, audit-reconciled" },
  "/app/company/roster": { title: "Roster & Department Targets", subtitle: "Employee seats, CSV import & hour targets" },
  "/app/company/billing": { title: "Billing & Subscription", subtitle: "Plans, Razorpay invoices & usage metering" },
  "/app/company/messages": { title: "Messages", subtitle: "Project-threaded conversations" },
  "/app/admin": { title: "Admin Console", subtitle: "Platform health, verification & disputes" },
  "/app/admin/verification": { title: "Verification Queue", subtitle: "NGO document review with side-by-side viewer" },
  "/app/admin/audit": { title: "Audit Log", subtitle: "Append-only trail of every admin action" },
  "/app/admin/disputes": { title: "Disputes", subtitle: "Resolve issues with a logged decision" },
  "/app/admin/api": { title: "API Keys", subtitle: "White-label public REST access for partners" },
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const role = roleForPath(pathname);
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const meta = PAGE_TITLES[pathname] ?? { title: "Kards", subtitle: ROLE_DESC[role] };

  const authUser = user ? { name: user.full_name, role: user.role } : { name: "Volunteer", role: "volunteer" };

  const SidebarContent = (
    <>
      <div className="flex h-16 items-center border-b border-border/70 px-5">
        <Link href="/" aria-label="Kards home">
          <Logo size="sm" />
        </Link>
      </div>
      <div className="flex-1 space-y-6 overflow-y-auto px-3 py-5 scrollbar-thin">
        <div>
          <p className="mb-2 px-3.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            {ROLE_LABEL[role]}
          </p>
          <SidebarNav items={NAV[role]} activePath={pathname} />
        </div>
        <RoleSwitcher />
      </div>
      <div className="border-t border-border/70 p-3">
        <div className="rounded-xl bg-muted/60 p-3">
          <p className="text-xs font-medium">Q2 FY 2026 report</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Generating now — you'll be notified when ready.
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="shimmer-bg h-full w-full rounded-full" />
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-border/70 bg-card lg:flex">
        {SidebarContent}
      </aside>

      {/* Mobile sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen} side="left">
        <div className="flex h-full flex-col">{SidebarContent}</div>
      </Sheet>

      <div className="lg:pl-64">
        <Topbar title={meta.title} subtitle={meta.subtitle} user={authUser} />
        <button
          className="fixed bottom-4 left-4 z-40 grid size-11 cursor-pointer place-items-center rounded-full border border-border bg-card text-foreground shadow-lift lg:hidden"
          onClick={() => setMobileOpen(true)}
          aria-label="Open sidebar"
        >
          <Menu className="size-5" />
        </button>
        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
