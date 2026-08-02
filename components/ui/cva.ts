import * as React from "react";
import { cn } from "@/lib/utils";

export type VariantProps<T> = T extends {
  variants?: Record<string, Record<string, unknown>>;
  defaultVariants?: infer D;
}
  ? { [K in keyof D]?: keyof (T extends { variants: Record<K, unknown> } ? T["variants"][K] : never) }
  : {};

type CVAConfig = {
  variants?: Record<string, Record<string, string>>;
  defaultVariants?: Record<string, string>;
  base?: string;
};

export function cva(base: string, config: CVAConfig) {
  return function (props?: Record<string, string | undefined>) {
    const p = props ?? {};
    const classes: string[] = [base];
    for (const key of Object.keys(config.variants ?? {})) {
      const val = p[key] ?? config.defaultVariants?.[key];
      if (val) classes.push(config.variants![key][val]);
    }
    return cn(classes);
  };
}
