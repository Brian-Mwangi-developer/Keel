import { getFeed, getLineage, getPipelineOverview } from "@/lib/keel/client";
import { LiveDashboard } from "@/components/keel/live-dashboard";
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
    <LiveDashboard
      initialOverview={overview}
      initialLineage={lineage}
      initialFeed={feed}
      resetSlot={<ResetDemoButton key="reset-demo" />}
    />
  );
}
