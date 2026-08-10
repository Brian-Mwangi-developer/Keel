"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Database, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { LiveDashboard } from "@/components/keel/live-dashboard";
import type { FeedEventOut, LineageOut, PipelineOverviewOut } from "@/lib/keel/types";

/**
 * A presentation-only gate for the demo's opening beat: visit
 * /dashboard?demo=empty and see a blank shell with an "Upload" button
 * instead of live data, narrate "here's a dataset, once ingested
 * everything's healthy," then click Upload to reveal the pipeline that's
 * already registered in DataHub -- LiveDashboard renders exactly as it
 * does on a plain /dashboard visit. No upload endpoint is called here;
 * this is purely a local toggle for a rehearsed opening beat, not the
 * dashboard's normal landing state -- every other link into /dashboard
 * (nav, incidents, a refresh) should show live data immediately.
 */
export function EmptyDashboardGate(props: {
  initialOverview: PipelineOverviewOut;
  initialLineage: LineageOut | null;
  initialFeed: FeedEventOut[];
  resetSlot?: React.ReactNode;
}) {
  const searchParams = useSearchParams();
  const [revealed, setRevealed] = useState(searchParams.get("demo") !== "empty");

  if (revealed) {
    return <LiveDashboard {...props} />;
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-6 text-center">
      <div className="flex size-16 items-center justify-center rounded-full border border-dashed border-border">
        <Database className="size-7 text-muted-foreground" />
      </div>
      <div className="flex max-w-md flex-col gap-1.5">
        <h1 className="font-heading text-2xl font-semibold">No pipeline yet</h1>
        <p className="text-sm text-muted-foreground">
          Connect a dataset and Keel starts scoring it immediately — freshness, schema stability, ownership,
          documentation, and every quality rule you attach, live from DataHub.
        </p>
      </div>
      <Button size="lg" onClick={() => setRevealed(true)}>
        <Upload className="size-4" />
        Upload
      </Button>
    </div>
  );
}
