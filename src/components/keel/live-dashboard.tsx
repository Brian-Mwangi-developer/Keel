"use client";

import { ArrowDown, ArrowUp, Minus, Radio } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { ActivityFeed } from "@/components/keel/activity-feed";
import { AssetDrawer } from "@/components/keel/asset-drawer";
import { LineageGraph } from "@/components/keel/lineage-graph";
import { Sparkline } from "@/components/keel/sparkline";
import { StatTile } from "@/components/keel/stat-tile";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getFeedLive,
  getLineageLive,
  getPipelineOverviewLive,
} from "@/lib/keel/client-fetch";
import { shortUrn } from "@/lib/keel/format";
import type {
  FeedEventOut,
  LineageOut,
  PipelineOverviewOut,
} from "@/lib/keel/types";

const POLL_MS = 8_000;

/**
 * Everything on the dashboard that should move without a manual refresh --
 * seeded from the server-rendered initial fetch (no loading flash on first
 * paint), then polled against the live backend so the trust index, movers,
 * lineage scores, and activity feed all reflect whatever DataHub-derived
 * state actually changed, the same "connects to a live backend" promise
 * the rest of the product makes.
 */
export function LiveDashboard({
  initialOverview,
  initialLineage,
  initialFeed,
  resetSlot,
}: {
  initialOverview: PipelineOverviewOut;
  initialLineage: LineageOut | null;
  initialFeed: FeedEventOut[];
  resetSlot?: React.ReactNode;
}) {
  const [overview, setOverview] = useState(initialOverview);
  const [lineage, setLineage] = useState(initialLineage);
  const [feed, setFeed] = useState(initialFeed);
  const [live, setLive] = useState(true);
  const [drawerUrn, setDrawerUrn] = useState<string | null>(null);
  const rootUrn = initialOverview.root_urn;
  const inFlight = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function tick() {
      if (inFlight.current) return;
      inFlight.current = true;
      try {
        const [nextOverview, nextFeed, nextLineage] = await Promise.all([
          getPipelineOverviewLive(rootUrn),
          getFeedLive(50),
          // Lineage scores ride along with overview so the constellation's
          // node colors stay in sync with the stat tiles instead of
          // drifting stale between polls.
          getLineageLive(rootUrn).catch(() => null),
        ]);
        if (cancelled) return;
        setOverview(nextOverview);
        setFeed(nextFeed);
        if (nextLineage) setLineage(nextLineage);
        setLive(true);
      } catch {
        if (!cancelled) setLive(false);
      } finally {
        inFlight.current = false;
      }
    }

    const id = setInterval(tick, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [rootUrn]);

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold">
            Pipeline health
          </h1>
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            {overview.healthy_count} of {overview.asset_count} assets are safe
            to use. Live, computed from DataHub
            <LiveDot live={live} />
          </p>
        </div>
        {resetSlot}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Pipeline trust index"
          value={overview.pipeline_trust_index}
          suffix="/ 100"
          tone={
            overview.band === "good"
              ? "good"
              : overview.band === "warn"
                ? "warn"
                : "bad"
          }
          sublabel={overview.verdict}
        />
        <StatTile
          label="Assets at risk"
          value={overview.warn_count + overview.bad_count}
          suffix={`of ${overview.asset_count}`}
          tone={overview.warn_count + overview.bad_count > 0 ? "warn" : "good"}
          sublabel="scoring below 80"
        />
        <StatTile
          label="Failing today"
          value={overview.bad_count}
          suffix="assets"
          tone={overview.bad_count > 0 ? "bad" : "good"}
          sublabel="don't trust today"
        />
        <StatTile
          label="Movers"
          value={
            overview.movers.filter((m) => m.delta !== null && m.delta !== 0)
              .length
          }
          suffix="changed"
          tone="default"
          sublabel="since last check"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Pipeline Trust Index</CardTitle>
            <CardDescription>
              One score for the whole pipeline. Assets that more things depend
              on move it more.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Sparkline points={overview.history} />
          </CardContent>
        </Card>

        <Card className="xl:col-span-3">
          <CardHeader>
            <CardTitle>Lineage constellation</CardTitle>
            <CardDescription>
              Click any node to see its full decomposition.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {lineage && lineage.nodes.length > 0 ? (
              <LineageGraph lineage={lineage} />
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No lineage graph for this root yet.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Movers</CardTitle>
            <CardDescription>
              Sorted by change, not by current state.
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground uppercase">
                  <th className="pb-2 font-medium">Asset</th>
                  <th className="pb-2 font-medium">Trust</th>
                  <th className="pb-2 text-right font-medium">Δ</th>
                </tr>
              </thead>
              <tbody>
                {overview.movers.slice(0, 8).map((m) => (
                  <tr
                    key={m.urn}
                    className="cursor-pointer border-b last:border-0 hover:bg-muted/50"
                    onClick={() => setDrawerUrn(m.urn)}
                  >
                    <td className="py-2">
                      <span className="font-medium hover:underline">
                        {shortUrn(m.urn)}
                      </span>
                    </td>
                    <td className="py-2 font-mono tabular-nums">{m.current}</td>
                    <td className="py-2 text-right">
                      <DeltaBadge delta={m.delta} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activity</CardTitle>
            <CardDescription>
              MetadataChangeLog — real score and governance events, as they
              happen.
            </CardDescription>
          </CardHeader>
          <CardContent className="max-h-[360px] overflow-y-auto">
            <ActivityFeed events={feed} onSelect={setDrawerUrn} />
          </CardContent>
        </Card>
      </div>

      <AssetDrawer
        urn={drawerUrn}
        open={drawerUrn !== null}
        onOpenChange={(open) => !open && setDrawerUrn(null)}
      />
    </div>
  );
}

function LiveDot({ live }: { live: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-medium animate-pulse ${live ? "text-success" : "text-muted-foreground"}`}
      title={live ? "Polling the live backend" : "Last poll failed — retrying"}
    >
      <Radio className="size-5" />
      {live ? "live" : "reconnecting…"}
    </span>
  );
}

function DeltaBadge({ delta }: { delta: number | null }) {
  if (delta === null)
    return <span className="text-xs text-muted-foreground">—</span>;
  if (delta === 0)
    return <Minus className="ml-auto size-3.5 text-muted-foreground" />;
  const up = delta > 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 font-mono text-xs tabular-nums ${up ? "text-success" : "text-destructive"}`}
    >
      {up ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />}
      {Math.abs(delta)}
    </span>
  );
}
