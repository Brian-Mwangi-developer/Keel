"use client";

import { Area, AreaChart, CartesianGrid, ReferenceLine, XAxis } from "recharts";

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { HistoryPointOut } from "@/lib/keel/types";

const chartConfig = {
  v: {
    label: "Pipeline Trust Index",
    color: "var(--primary)",
  },
} satisfies ChartConfig;

/**
 * Pipeline Trust Index over time. Single series -> no legend box, the
 * card title names it (per keel-ui's own design system notes). The line
 * uses the accent color, never a status color -- it "never means good or
 * bad" here; only the reference line at the warn threshold carries that
 * meaning.
 */
export function Sparkline({
  points,
  warnThreshold = 50,
  height = 220,
}: {
  points: HistoryPointOut[];
  warnThreshold?: number;
  height?: number;
}) {
  if (points.length === 0) {
    return (
      <div className="flex items-center justify-center text-sm text-muted-foreground" style={{ height }}>
        No history yet — check back after the next recompute.
      </div>
    );
  }

  const data = points.map((p) => ({
    t: p.t,
    v: p.v,
    label: new Date(p.t * 1000).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
  }));

  return (
    <ChartContainer config={chartConfig} style={{ height }} className="w-full">
      <AreaChart data={data} margin={{ left: 4, right: 4, top: 8, bottom: 0 }}>
        <defs>
          <linearGradient id="keel-trust-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-v)" stopOpacity={0.25} />
            <stop offset="95%" stopColor="var(--color-v)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} minTickGap={40} className="text-xs" />
        <ReferenceLine
          y={warnThreshold}
          stroke="var(--warning)"
          strokeDasharray="4 4"
          label={{ value: `at risk below ${warnThreshold}`, position: "insideTopRight", fontSize: 10, fill: "var(--warning)" }}
        />
        <ChartTooltip cursor={{ stroke: "var(--border)" }} content={<ChartTooltipContent labelKey="label" />} />
        <Area
          dataKey="v"
          type="monotone"
          fill="url(#keel-trust-fill)"
          stroke="var(--color-v)"
          strokeWidth={2}
          dot={data.length === 1}
          isAnimationActive={false}
        />
      </AreaChart>
    </ChartContainer>
  );
}
