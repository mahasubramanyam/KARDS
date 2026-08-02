import * as React from "react";
import { cn, initials } from "@/lib/utils";

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  src?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  status?: "online" | "offline" | "busy";
}

const sizes = {
  xs: "size-6 text-[10px]",
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-14 text-lg",
  xl: "size-20 text-2xl",
};

const statusColors = {
  online: "bg-success",
  offline: "bg-muted-foreground/40",
  busy: "bg-warning",
};

export function Avatar({ name, src, size = "md", status, className, ...props }: AvatarProps) {
  return (
    <div className={cn("relative inline-flex shrink-0", className)} {...props}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={name}
          className={cn(sizes[size], "rounded-full object-cover ring-2 ring-border")}
        />
      ) : (
        <div
          className={cn(
            sizes[size],
            "flex items-center justify-center rounded-full bg-gradient-to-br from-primary to-[hsl(285,70%,55%)] font-semibold text-primary-foreground ring-2 ring-border"
          )}
        >
          {initials(name)}
        </div>
      )}
      {status && (
        <span
          className={cn(
            "absolute bottom-0 right-0 block rounded-full ring-2 ring-card",
            statusColors[status],
            size === "xs" || size === "sm" ? "size-2" : "size-3"
          )}
        />
      )}
    </div>
  );
}
