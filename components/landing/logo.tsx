import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative grid size-9 shrink-0 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-primary to-[hsl(285,70%,52%)] shadow-[0_4px_14px_-4px_hsl(var(--primary)/0.6)]",
        className
      )}
    >
      <svg viewBox="0 0 24 24" className="size-5 text-white" fill="none" aria-hidden="true">
        <rect x="3" y="3" width="8" height="12" rx="2" fill="currentColor" opacity="0.55" />
        <rect x="13" y="9" width="8" height="12" rx="2" fill="currentColor" />
        <rect x="13" y="3" width="8" height="3.5" rx="1.75" fill="currentColor" opacity="0.55" />
      </svg>
      <span className="absolute -right-1 -top-1 size-2.5 rounded-full bg-accent ring-2 ring-card" />
    </div>
  );
}

export function Logo({ className, size }: { className?: string; size?: "sm" | "md" }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <LogoMark className={size === "sm" ? "size-8" : "size-9"} />
      <div className="flex flex-col leading-none">
        <span className={cn("font-heading font-bold tracking-tight", size === "sm" ? "text-lg" : "text-xl")}>
          Kards
        </span>
        <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          CSR, proven
        </span>
      </div>
    </div>
  );
}
