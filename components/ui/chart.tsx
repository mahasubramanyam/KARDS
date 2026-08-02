"use client";

import * as React from "react";
import {
  ResponsiveContainer,
  Area,
  AreaChart,
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";

export const chartColors = {
  primary: "hsl(var(--primary))",
  accent: "hsl(var(--accent))",
  success: "hsl(var(--success))",
  muted: "hsl(var(--muted-foreground))",
  border: "hsl(var(--border))",
};

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; color?: string; payload?: Record<string, unknown> }>;
  label?: string;
  formatter?: (value: number, name: string) => string;
  labelFormatter?: (label: string) => string;
}

export function ChartTooltip({
  active,
  payload,
  label,
  formatter,
  labelFormatter,
}: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-card px-3.5 py-2.5 shadow-lift">
      {label && (
        <p className="mb-1.5 text-xs font-medium text-muted-foreground">
          {labelFormatter ? labelFormatter(label) : label}
        </p>
      )}
      <div className="space-y-1">
        {payload.map((entry, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span
              className="size-2.5 rounded-full"
              style={{ background: entry.color ?? chartColors.primary }}
            />
            <span className="text-muted-foreground">{entry.name}</span>
            <span className="ml-auto pl-4 font-semibold text-foreground">
              {formatter ? formatter(entry.value ?? 0, entry.name ?? "") : entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface KardsAreaChartProps {
  data: Record<string, unknown>[];
  xKey: string;
  series: { key: string; name: string; color: string; formatter?: (v: number) => string }[];
  height?: number;
  className?: string;
}

export function KardsAreaChart({ data, xKey, series, height = 280, className }: KardsAreaChartProps) {
  return (
    <div className={className} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <defs>
            {series.map((s) => (
              <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity={0.28} />
                <stop offset="100%" stopColor={s.color} stopOpacity={0.02} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={chartColors.border} vertical={false} />
          <XAxis
            dataKey={xKey}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: chartColors.muted }}
            dy={8}
          />
          <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: chartColors.muted }} width={56} />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: chartColors.border, strokeDasharray: "4 4" }} />
          {series.map((s) => (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.name}
              stroke={s.color}
              strokeWidth={2.5}
              fill={`url(#grad-${s.key})`}
              dot={false}
              activeDot={{ r: 5, strokeWidth: 2, stroke: "hsl(var(--card))" }}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

interface KardsBarChartProps {
  data: Record<string, unknown>[];
  xKey: string;
  bars: { key: string; name: string; color?: string }[];
  height?: number;
  className?: string;
  formatter?: (v: number, name: string) => string;
  labelFormatter?: (label: string) => string;
  horizontal?: boolean;
  radius?: [number, number, number, number];
}

export function KardsBarChart({
  data,
  xKey,
  bars,
  height = 280,
  className,
  formatter,
  labelFormatter,
  horizontal = false,
  radius = [6, 6, 0, 0],
}: KardsBarChartProps) {
  return (
    <div className={className} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout={horizontal ? "vertical" : "horizontal"}
          margin={{ top: 8, right: 8, left: horizontal ? 0 : -12, bottom: 0 }}
          barCategoryGap="28%"
        >
          <CartesianGrid strokeDasharray="3 3" stroke={chartColors.border} vertical={false} />
          {horizontal ? (
            <>
              <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: chartColors.muted }} />
              <YAxis
                dataKey={xKey}
                type="category"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12, fill: chartColors.muted }}
                width={110}
              />
            </>
          ) : (
            <>
              <XAxis dataKey={xKey} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: chartColors.muted }} dy={8} />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: chartColors.muted }} width={56} />
            </>
          )}
          <Tooltip
            content={<ChartTooltip formatter={formatter} labelFormatter={labelFormatter} />}
            cursor={{ fill: "hsl(var(--muted))", opacity: 0.5 }}
          />
          {bars.map((b) => (
            <Bar key={b.key} dataKey={b.key} name={b.name} fill={b.color ?? chartColors.primary} radius={radius} maxBarSize={34} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function KardsPieCell({ color }: { color: string }) {
  return <Cell fill={color} />;
}
