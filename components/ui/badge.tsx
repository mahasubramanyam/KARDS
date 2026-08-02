import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "outline" | "success" | "warning" | "destructive" | "accent";
  dot?: boolean;
}

const variants: Record<NonNullable<BadgeProps["variant"]>, string> = {
  default: "bg-primary/10 text-primary border-transparent",
  secondary: "bg-secondary text-secondary-foreground border-transparent",
  outline: "border-border text-muted-foreground",
  success: "bg-success/12 text-[hsl(152,62%,32%)] border-transparent dark:text-[hsl(152,60%,70%)]",
  warning: "bg-warning/14 text-[hsl(32,80%,32%)] border-transparent dark:text-[hsl(38,92%,70%)]",
  destructive: "bg-destructive/12 text-destructive border-transparent",
  accent: "bg-accent/15 text-[hsl(32,90%,32%)] border-transparent dark:text-[hsl(38,92%,72%)]",
};

const dotColors: Record<NonNullable<BadgeProps["variant"]>, string> = {
  default: "bg-primary",
  secondary: "bg-secondary-foreground/60",
  outline: "bg-muted-foreground",
  success: "bg-success",
  warning: "bg-warning",
  destructive: "bg-destructive",
  accent: "bg-accent",
};

export function Badge({ className, variant = "default", dot, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        variants[variant],
        className
      )}
      {...props}
    >
      {dot && <span className={cn("size-1.5 rounded-full", dotColors[variant])} />}
      {children}
    </span>
  );
}
