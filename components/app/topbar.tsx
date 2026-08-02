"use client";

import { useState } from "react";
import { Bell, Check, ChevronDown, Command, LogOut, Search, Settings } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const notifications = [
  {
    id: "n1",
    title: "Application accepted",
    body: "Siksha Setu accepted you as a STEM mentor",
    at: "2h ago",
    kind: "success",
    unread: true,
  },
  {
    id: "n2",
    title: "New recommendation",
    body: "Fundraising deck · 82% match",
    at: "6h ago",
    kind: "primary",
    unread: true,
  },
  {
    id: "n3",
    title: "Certificate ready",
    body: "Watershed survey · premium format",
    at: "1d ago",
    kind: "accent",
    unread: false,
  },
];

const kindColor: Record<string, string> = {
  success: "bg-success",
  primary: "bg-primary",
  accent: "bg-accent",
};

export function Topbar({
  title,
  subtitle,
  user,
}: {
  title: string;
  subtitle?: string;
  user: { name: string; role: string };
}) {
  const { logout } = useAuth();
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border/70 bg-card/80 px-4 backdrop-blur-xl sm:px-6">
      <div className="min-w-0 flex-1">
        <h1 className="truncate font-heading text-lg font-semibold">{title}</h1>
        {subtitle && <p className="hidden truncate text-xs text-muted-foreground sm:block">{subtitle}</p>}
      </div>

      <button
        onClick={() => setSearchOpen(true)}
        className="hidden h-10 w-64 items-center gap-2 rounded-xl border border-border bg-background/60 px-3 text-sm text-muted-foreground transition-colors hover:border-primary/40 md:flex"
        aria-label="Search"
      >
        <Search className="size-4" />
        <span className="flex-1 text-left">Search NGOs, projects, reports…</span>
        <kbd className="rounded-md border border-border bg-card px-1.5 py-0.5 font-mono text-[10px]">⌘K</kbd>
      </button>

      <div className="relative">
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          onClick={() => {
            setNotifOpen((v) => !v);
            setUserOpen(false);
          }}
          aria-label="Notifications"
        >
          <Bell className="size-[18px]" />
          <span className="absolute right-2 top-2 size-2 rounded-full bg-destructive ring-2 ring-card" />
        </Button>
        {notifOpen && (
          <div className="absolute right-0 top-12 w-80 overflow-hidden rounded-2xl border border-border bg-card shadow-lift">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <p className="text-sm font-semibold">Notifications</p>
              <button className="cursor-pointer text-xs font-medium text-primary hover:underline">
                Mark all read
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.map((n) => (
                <button
                  key={n.id}
                  className="flex w-full cursor-pointer items-start gap-3 border-b border-border/60 px-4 py-3 text-left transition-colors hover:bg-muted/60"
                >
                  <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", kindColor[n.kind])} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{n.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{n.body}</p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground/70">{n.at}</p>
                  </div>
                  {n.unread && <span className="ml-auto size-1.5 shrink-0 rounded-full bg-primary" />}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="relative">
        <button
          onClick={() => {
            setUserOpen((v) => !v);
            setNotifOpen(false);
          }}
          className="flex cursor-pointer items-center gap-2 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-muted"
          aria-label="Account menu"
        >
          <Avatar name={user.name} size="sm" />
          <div className="hidden text-left md:block">
            <p className="text-xs font-semibold leading-tight">{user.name}</p>
            <p className="text-[10px] capitalize leading-tight text-muted-foreground">{user.role}</p>
          </div>
          <ChevronDown className="hidden size-3.5 text-muted-foreground md:block" />
        </button>
        {userOpen && (
          <div className="absolute right-0 top-12 w-56 overflow-hidden rounded-2xl border border-border bg-card p-1.5 shadow-lift">
            <div className="border-b border-border px-3 py-2.5">
              <p className="text-sm font-semibold">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.role} · Kards demo</p>
            </div>
            {[
              { icon: Settings, label: "Settings" },
              { icon: Check, label: "My certificates" },
            ].map((i) => (
              <button
                key={i.label}
                className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted"
              >
                <i.icon className="size-4 text-muted-foreground" />
                {i.label}
              </button>
            ))}
            <button
              onClick={async () => {
                await logout();
                window.location.href = "/auth/login";
              }}
              className="mt-1 flex w-full cursor-pointer items-center gap-2.5 rounded-lg border-t border-border px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive/5"
            >
              <LogOut className="size-4" />
              Sign out
            </button>
          </div>
        )}
      </div>

      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-6 pt-24" onClick={() => setSearchOpen(false)}>
          <div
            className="w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card shadow-lift"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-border px-4 py-3.5">
              <Command className="size-4 text-muted-foreground" />
              <input
                autoFocus
                placeholder="Search NGOs, projects, reports…"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              <kbd className="rounded-md border border-border px-1.5 py-0.5 font-mono text-[10px]">ESC</kbd>
            </div>
            <div className="p-2 text-sm text-muted-foreground">
              {["Siksha Setu Foundation", "STEM mentor opportunities", "Q1 compliance report"].map((s, i) => (
                <button
                  key={s}
                  className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted"
                  onClick={() => setSearchOpen(false)}
                >
                  <Search className="size-4 text-primary" />
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
