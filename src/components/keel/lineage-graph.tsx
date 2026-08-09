"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { BAND_STYLES, shortUrn } from "@/lib/keel/format";
import type { LineageOut } from "@/lib/keel/types";
import { AssetDrawer } from "@/components/keel/asset-drawer";

const COL_WIDTH = 240;
const ROW_HEIGHT = 120;
const NODE_R = 26;
const PAD = 48;
const LABEL_CHARS_PER_LINE = 18;

/** Breaks a long asset name onto up to two lines, preferring to split on a
 * word boundary (_ or space) near the middle rather than mid-word, so
 * "dynamic_pricing_decisions" reads as two clean lines instead of being
 * truncated with no indication anything was cut. Falls back to a hard
 * break only if there's no good boundary to use. */
function wrapLabel(name: string): [string, string | null] {
  if (name.length <= LABEL_CHARS_PER_LINE) return [name, null];
  const breakChars = /[_\s-]/g;
  let bestIdx = -1;
  let match: RegExpExecArray | null;
  while ((match = breakChars.exec(name))) {
    if (Math.abs(match.index - name.length / 2) < Math.abs(bestIdx - name.length / 2) || bestIdx === -1) {
      bestIdx = match.index;
    }
  }
  if (bestIdx > 0 && bestIdx < name.length - 1) {
    return [name.slice(0, bestIdx), name.slice(bestIdx + 1)];
  }
  return [name.slice(0, LABEL_CHARS_PER_LINE), name.slice(LABEL_CHARS_PER_LINE, LABEL_CHARS_PER_LINE * 2)];
}

/**
 * The "lineage constellation" -- hand-rolled SVG, same spirit as keel-ui's
 * own prototype (no graph library dependency). Layout is computed, not
 * hand-positioned: each node's column is its longest-path depth from a
 * root (an asset with no upstream in this slice), so damage traveling
 * downstream reads left-to-right in the same order it actually
 * propagates.
 */
export function LineageGraph({ lineage, centerUrn }: { lineage: LineageOut; centerUrn?: string }) {
  const [hoveredUrn, setHoveredUrn] = useState<string | null>(null);
  const [drawerUrn, setDrawerUrn] = useState<string | null>(null);

  const { positioned, edgePaths, width, height } = useMemo(() => {
    const nodesByUrn = new Map(lineage.nodes.map((n) => [n.urn, n]));
    const incoming = new Map<string, string[]>();
    const outgoing = new Map<string, string[]>();
    for (const e of lineage.edges) {
      if (!nodesByUrn.has(e.from_urn) || !nodesByUrn.has(e.to_urn)) continue;
      incoming.set(e.to_urn, [...(incoming.get(e.to_urn) ?? []), e.from_urn]);
      outgoing.set(e.from_urn, [...(outgoing.get(e.from_urn) ?? []), e.to_urn]);
    }

    // Longest-path depth from any root (no incoming edges), computed with
    // a visited-guard so a cycle degrades to "some finite depth" instead
    // of infinite recursion -- same defensive stance as the trust engine
    // itself takes on cycles.
    const depthCache = new Map<string, number>();
    function depthOf(urn: string, seen: Set<string>): number {
      if (depthCache.has(urn)) return depthCache.get(urn)!;
      const ups = incoming.get(urn) ?? [];
      if (ups.length === 0 || seen.has(urn)) {
        depthCache.set(urn, 0);
        return 0;
      }
      const nextSeen = new Set(seen).add(urn);
      const d = 1 + Math.max(0, ...ups.map((u) => depthOf(u, nextSeen)));
      depthCache.set(urn, d);
      return d;
    }
    for (const n of lineage.nodes) depthOf(n.urn, new Set());

    const columns = new Map<number, string[]>();
    for (const n of lineage.nodes) {
      const d = depthCache.get(n.urn) ?? 0;
      columns.set(d, [...(columns.get(d) ?? []), n.urn]);
    }

    const maxCol = Math.max(0, ...columns.keys());
    const maxRows = Math.max(1, ...[...columns.values()].map((c) => c.length));
    const width = PAD * 2 + (maxCol + 1) * COL_WIDTH;
    const height = PAD * 2 + maxRows * ROW_HEIGHT;

    const positioned = new Map<string, { x: number; y: number }>();
    for (const [col, urns] of columns) {
      const colHeight = urns.length * ROW_HEIGHT;
      const startY = (height - colHeight) / 2 + ROW_HEIGHT / 2;
      urns.forEach((urn, i) => {
        positioned.set(urn, { x: PAD + col * COL_WIDTH + NODE_R, y: startY + i * ROW_HEIGHT });
      });
    }

    const edgePaths = lineage.edges
      .filter((e) => positioned.has(e.from_urn) && positioned.has(e.to_urn))
      .map((e) => {
        const a = positioned.get(e.from_urn)!;
        const b = positioned.get(e.to_urn)!;
        const midX = (a.x + b.x) / 2;
        return {
          key: `${e.from_urn}->${e.to_urn}`,
          from: e.from_urn,
          to: e.to_urn,
          d: `M${a.x + NODE_R},${a.y} C${midX},${a.y} ${midX},${b.y} ${b.x - NODE_R},${b.y}`,
        };
      });

    return { positioned, edgePaths, width, height };
  }, [lineage]);

  return (
    <div className="overflow-x-auto">
      <svg width={width} height={height} className="min-w-full" role="img" aria-label="Lineage constellation">
        <g>
          {edgePaths.map((e) => (
            <path
              key={e.key}
              d={e.d}
              fill="none"
              stroke={hoveredUrn && (hoveredUrn === e.from || hoveredUrn === e.to) ? "var(--primary)" : "var(--border)"}
              strokeWidth={hoveredUrn && (hoveredUrn === e.from || hoveredUrn === e.to) ? 2 : 1.5}
              markerEnd="url(#keel-arrow)"
            />
          ))}
        </g>
        <defs>
          <marker id="keel-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill="var(--border)" />
          </marker>
        </defs>
        {lineage.nodes.map((n) => {
          const pos = positioned.get(n.urn);
          if (!pos) return null;
          const style = BAND_STYLES[n.band];
          const isCenter = n.urn === centerUrn;
          const [line1, line2] = wrapLabel(shortUrn(n.urn));
          return (
            <g
              key={n.urn}
              transform={`translate(${pos.x},${pos.y})`}
              onMouseEnter={() => setHoveredUrn(n.urn)}
              onMouseLeave={() => setHoveredUrn(null)}
              onClick={() => setDrawerUrn(n.urn)}
              className="cursor-pointer"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && setDrawerUrn(n.urn)}
            >
              <circle
                r={NODE_R}
                fill="var(--card)"
                stroke={isCenter ? "var(--primary)" : style.var}
                strokeWidth={isCenter ? 3 : 2}
              />
              <text textAnchor="middle" dy="0.35em" className={cn("font-mono text-sm font-semibold tabular-nums", style.text)} fill="currentColor">
                {n.score}
              </text>
              <text textAnchor="middle" y={NODE_R + 16} className="fill-foreground text-[11px] font-medium">
                {line1}
              </text>
              {line2 && (
                <text textAnchor="middle" y={NODE_R + 29} className="fill-foreground text-[11px] font-medium">
                  {line2}
                </text>
              )}
              <text textAnchor="middle" y={NODE_R + (line2 ? 42 : 29)} className="fill-muted-foreground text-[9px] uppercase">
                {n.platform} · {n.kind}
              </text>
            </g>
          );
        })}
      </svg>
      <AssetDrawer urn={drawerUrn} open={drawerUrn !== null} onOpenChange={(open) => !open && setDrawerUrn(null)} />
    </div>
  );
}
