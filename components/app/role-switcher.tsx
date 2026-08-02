"use client";

import { useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { UserRound, HeartHandshake, Building2, ShieldCheck } from "lucide-react";
import { Role } from "@/lib/types";
import { APP_HOME, ROLE_DESC, ROLE_LABEL, roleForPath } from "./nav";
import { cn } from "@/lib/utils";

const roles: { value: Role; icon: typeof UserRound }[] = [
  { value: "volunteer", icon: UserRound },
  { value: "ngo", icon: HeartHandshake },
  { value: "company", icon: Building2 },
  { value: "admin", icon: ShieldCheck },
];

export function RoleSwitcher({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const current = roleForPath(pathname);

  return (
    <div className="rounded-2xl border border-border bg-card p-3">
      <p className="mb-2.5 px-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {compact ? "Role" : "Demo workspace"}
      </p>
      <div className="flex flex-col gap-1">
        {roles.map((r) => {
          const active = current === r.value;
          return (
            <button
              key={r.value}
              onClick={() => router.push(APP_HOME[r.value])}
              className={cn(
                "group relative flex cursor-pointer items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors duration-200",
                active ? "text-foreground" : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
              )}
            >
              {active && (
                <motion.span
                  layoutId="role-active"
                  className="absolute inset-0 rounded-xl bg-primary/10 ring-1 ring-primary/20"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <r.icon
                className={cn(
                  "relative z-10 size-4 transition-colors",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              />
              <span className="relative z-10 text-sm font-medium">{ROLE_LABEL[r.value]}</span>
              {!compact && (
                <span className="relative z-10 ml-auto hidden truncate text-[10px] text-muted-foreground xl:block">
                  {active ? ROLE_DESC[r.value] : "demo"}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
