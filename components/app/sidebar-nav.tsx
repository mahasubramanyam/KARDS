"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function SidebarNav({
  items,
  activePath,
}: {
  items: { href: string; label: string; icon: React.ComponentType<{ className?: string }>; badge?: number }[];
  activePath: string;
}) {
  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const active = activePath === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors duration-200",
              active ? "text-foreground" : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
            )}
          >
            {active && (
              <motion.span
                layoutId="sidebar-active"
                className="absolute inset-0 rounded-xl bg-primary/10 ring-1 ring-primary/20"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            )}
            <item.icon
              className={cn(
                "relative z-10 size-[18px] transition-colors",
                active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
              )}
            />
            <span className="relative z-10">{item.label}</span>
            {item.badge ? (
              <span className="relative z-10 ml-auto grid size-5 place-items-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                {item.badge}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
