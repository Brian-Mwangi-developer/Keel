import { getFeed, getLineage, getPipelineOverview } from "@/lib/keel/client";
import { EmptyDashboardGate } from "@/components/keel/empty-dashboard-gate";
import { InjectScenarioDialog } from "@/components/keel/inject-scenario-dialog";
import { ResetDemoButton } from "@/components/keel/reset-demo-button";

export default async function DashboardPage(props: PageProps<"/dashboard">) {
  const searchParams = await props.searchParams;
  const rootUrn = typeof searchParams.root === "string" ? searchParams.root : undefined;

  const overview = await getPipelineOverview(rootUrn);
  const [lineage, feed] = await Promise.all([
    getLineage(overview.root_urn).catch(() => null),
    getFeed(50).catch(() => []),
  ]);

  return (
    <EmptyDashboardGate
      initialOverview={overview}
      initialLineage={lineage}
      initialFeed={feed}
      resetSlot={
        <div key="demo-actions" className="flex items-center gap-2">
          <InjectScenarioDialog />
          <ResetDemoButton />
        </div>
      }
    />
  );
}
