"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Sheet({
  open,
  onOpenChange,
  children,
  side = "right",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  side?: "left" | "right" | "bottom";
}) {
  React.useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const sideClasses =
    side === "left"
      ? "left-0 top-0 h-full"
      : side === "right"
        ? "right-0 top-0 h-full"
        : "bottom-0 left-0 w-full";

  const initial =
    side === "left" ? { x: "-100%" } : side === "right" ? { x: "100%" } : { y: "100%" };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50">
          <motion.div
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onOpenChange(false)}
          />
          <motion.div
            className={cn(
              "absolute z-10 flex flex-col bg-card shadow-lift",
              sideClasses,
              side === "bottom" ? "max-h-[85vh] rounded-t-2xl" : "w-[300px] max-w-[85vw]"
            )}
            initial={initial}
            animate={{ x: 0, y: 0 }}
            exit={initial}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <button
              className="absolute right-4 top-4 z-10 inline-flex size-8 cursor-pointer items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={() => onOpenChange(false)}
              aria-label="Close menu"
            >
              <X className="size-4" />
            </button>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
