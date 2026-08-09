import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, TriangleAlert } from "lucide-react";

import {
  getAsset,
  getBreakdown,
  getFlagHistory,
  getLineage,
  listRules,
  KeelApiError,
} from "@/lib/keel/client";
import { formatIso } from "@/lib/keel/format";
import { VerdictBadge } from "@/components/keel/verdict-badge";
import { LineageGraph } from "@/components/keel/lineage-graph";
import { BreakdownView } from "@/components/keel/breakdown-view";
import { RulesTable } from "@/components/keel/rules-table";
import { AssetActions, UnflagButton } from "@/components/keel/asset-actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";

export default async function AssetDetailPage(props: PageProps<"/assets/[urn]">) {
  const { urn: encodedUrn } = await props.params;
  const urn = decodeURIComponent(encodedUrn);

  let asset;
  try {
    asset = await getAsset(urn);
  } catch (e) {
    if (e instanceof KeelApiError && e.status === 404) notFound();
    throw e;
  }

  const [breakdown, lineage, rules, flagHistory] = await Promise.all([
    getBreakdown(urn),
    getLineage(urn),
    listRules(urn),
    getFlagHistory(urn).catch(() => []),
  ]);

  const openFlag = flagHistory.find((f) => f.event === "flagged" && f.resolved === false);

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <Link href="/assets" className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-3.5" />
        All assets
      </Link>

      {openFlag && (
        <Alert variant="destructive">
          <TriangleAlert className="size-4" />
          <AlertTitle>Flagged unsafe to consume</AlertTitle>
          <AlertDescription>
            {openFlag.note || "No reason given."} — {formatIso(openFlag.at)}
            <div className="mt-2">
              <UnflagButton urn={urn} />
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-heading text-2xl font-semibold">{asset.name}</h1>
            <Badge variant="outline" className="font-normal">
              {asset.platform} · {asset.kind}
            </Badge>
            {!asset.fully_registered && (
              <Badge variant="outline" className="text-muted-foreground">
                minimally registered
              </Badge>
            )}
          </div>
          <span className="font-mono text-xs break-all text-muted-foreground">{asset.urn}</span>
          <VerdictBadge score={asset.score} band={asset.band} verdict={asset.verdict} />
        </div>
        <AssetActions urn={urn} fullyRegistered={asset.fully_registered} />
      </div>

      <Tabs defaultValue="breakdown">
        <TabsList>
          <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
          <TabsTrigger value="lineage">Lineage</TabsTrigger>
          <TabsTrigger value="rules">Quality rules ({rules.length})</TabsTrigger>
          <TabsTrigger value="history">Flag history ({flagHistory.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="breakdown" className="pt-4">
          <BreakdownView breakdown={breakdown} />
        </TabsContent>

        <TabsContent value="lineage" className="pt-4">
          <Card>
            <CardContent>
              <LineageGraph lineage={lineage} centerUrn={urn} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="pt-4">
          <RulesTable assetUrn={urn} rules={rules} />
        </TabsContent>

        <TabsContent value="history" className="pt-4">
          <Card>
            <CardContent className="flex flex-col gap-3">
              {flagHistory.length === 0 && (
                <p className="text-sm text-muted-foreground">No flags have ever been raised on this asset.</p>
              )}
              {[...flagHistory].reverse().map((f, i) => (
                <div key={i} className="rounded-lg border p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{f.event === "flagged" ? "Flagged unsafe" : "Unflagged"}</span>
                    <span className="text-xs text-muted-foreground">{formatIso(f.at)}</span>
                  </div>
                  {f.note && <p className="mt-1 text-muted-foreground">{f.note}</p>}
                  {f.related_incident_id && (
                    <Link
                      href={`/incidents/${encodeURIComponent(f.related_incident_id)}`}
                      className="mt-1 inline-block text-xs text-primary underline underline-offset-2"
                    >
                      related incident
                    </Link>
                  )}
                  {f.event === "flagged" && (
                    <div className="mt-2 border-t pt-2 text-xs">
                      {f.resolved ? (
                        <span className="text-success">
                          Resolved {f.resolved_at && formatIso(f.resolved_at)}
                          {f.resolved_note ? ` — ${f.resolved_note}` : ""}
                        </span>
                      ) : (
                        <span className="text-warning">Still open</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
