import Link from "next/link";
import { CircleCheck, CircleDashed, CircleX } from "lucide-react";

import { getPipelineOverview, listAssets, listRules } from "@/lib/keel/client";
import { shortUrn } from "@/lib/keel/format";
import { PlatformIcon } from "@/components/keel/platform-icon";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function RulesPage(props: PageProps<"/rules">) {
  const searchParams = await props.searchParams;
  const rootUrn = typeof searchParams.root === "string" ? searchParams.root : undefined;

  const overview = await getPipelineOverview(rootUrn);
  const assets = await listAssets(overview.root_urn);

  const rulesByAsset = await Promise.all(
    assets.map(async (a) => ({ asset: a, rules: await listRules(a.urn).catch(() => []) })),
  );
  const withRules = rulesByAsset.filter((r) => r.rules.length > 0);
  const totalRules = withRules.reduce((sum, r) => sum + r.rules.length, 0);

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Quality rules</h1>
        <p className="text-sm text-muted-foreground">
          {totalRules} rule{totalRules === 1 ? "" : "s"} across {withRules.length} asset{withRules.length === 1 ? "" : "s"} —
          each one a real DataHub assertion. Open an asset to add one, including describing it in plain English.
        </p>
      </div>

      {withRules.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No quality rules yet. Open any asset and add one — you can describe it in plain English and Keel will draft
            it for you.
          </CardContent>
        </Card>
      )}

      {withRules.map(({ asset, rules }) => (
        <Card key={asset.urn}>
          <CardContent className="flex flex-col gap-3">
            <Link href={`/assets/${encodeURIComponent(asset.urn)}`} className="flex items-center justify-between hover:underline">
              <span className="flex items-center gap-2 font-medium">
                <PlatformIcon platform={asset.platform} className="size-5" />
                {shortUrn(asset.urn)}
              </span>
              <span className="text-xs text-muted-foreground">{asset.platform}</span>
            </Link>
            <div className="flex flex-col gap-2">
              {rules.map((rule) => {
                const Icon = !rule.has_run ? CircleDashed : rule.passing ? CircleCheck : CircleX;
                const iconClass = !rule.has_run ? "text-muted-foreground" : rule.passing ? "text-success" : "text-destructive";
                return (
                  <div key={rule.id} className="flex items-center justify-between gap-3 rounded-lg border p-2.5 text-sm">
                    <div className="flex items-center gap-2.5">
                      <Icon className={`size-4 shrink-0 ${iconClass}`} />
                      <span>{rule.description || rule.column || rule.id}</span>
                    </div>
                    <Badge variant={rule.severity === "critical" ? "destructive" : "outline"} className="shrink-0 capitalize">
                      {rule.severity}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
