import { getPipelineOverview, listSources } from "@/lib/keel/client";
import { ConnectSourceDialog, UploadSourceDialog } from "@/components/keel/source-dialogs";
import { PlatformIcon } from "@/components/keel/platform-icon";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function SourcesPage(props: PageProps<"/sources">) {
  const searchParams = await props.searchParams;
  const rootUrn = typeof searchParams.root === "string" ? searchParams.root : undefined;

  const overview = await getPipelineOverview(rootUrn);
  const sources = await listSources(overview.root_urn);

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Sources</h1>
          <p className="text-sm text-muted-foreground">
            Every platform Keel found while walking this pipeline&apos;s lineage — not a hand-configured list.
          </p>
        </div>
        <div className="flex gap-2">
          <ConnectSourceDialog />
          <UploadSourceDialog />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sources.map((s) => (
          <Card key={s.platform}>
            <CardContent className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <PlatformIcon platform={s.platform} className="size-8" />
                <span className="font-heading text-lg font-medium capitalize">{s.platform}</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {s.asset_count} asset{s.asset_count === 1 ? "" : "s"}
              </span>
              <div className="flex flex-wrap gap-1">
                {s.kinds.map((k) => (
                  <Badge key={k} variant="outline" className="font-normal">
                    {k}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
        {sources.length === 0 && (
          <Card className="sm:col-span-2 lg:col-span-3">
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              No sources connected to this pipeline yet.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
