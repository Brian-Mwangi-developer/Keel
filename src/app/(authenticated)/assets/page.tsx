import Link from "next/link";

import { getPipelineOverview, listAssets } from "@/lib/keel/client";
import { VerdictBadge } from "@/components/keel/verdict-badge";
import { PlatformIcon } from "@/components/keel/platform-icon";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function AssetsPage(props: PageProps<"/assets">) {
  const searchParams = await props.searchParams;
  const rootUrn = typeof searchParams.root === "string" ? searchParams.root : undefined;
  const domain = typeof searchParams.domain === "string" ? searchParams.domain : undefined;
  const platform = typeof searchParams.platform === "string" ? searchParams.platform : undefined;

  const overview = await getPipelineOverview(rootUrn);
  const assets = await listAssets(overview.root_urn, { domain, platform });

  const platforms = [...new Set(assets.map((a) => a.platform))].sort();

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Assets</h1>
        <p className="text-sm text-muted-foreground">
          Every asset connected to this pipeline&apos;s lineage graph, scored live — discovered from DataHub.
        </p>
      </div>

      {platforms.length > 1 && (
        <div className="flex flex-wrap items-center gap-2">
          <FilterLink label="All platforms" active={!platform} href={`/assets`} />
          {platforms.map((p) => (
            <FilterLink
              key={p}
              label={p}
              active={platform === p}
              href={`/assets?platform=${encodeURIComponent(p)}`}
              icon={<PlatformIcon platform={p} className="size-4" />}
            />
          ))}
        </div>
      )}

      <Card>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground uppercase">
                <th className="pb-2 font-medium">Asset</th>
                <th className="pb-2 font-medium">Domain</th>
                <th className="pb-2 font-medium">Owners</th>
                <th className="pb-2 font-medium">Tags</th>
                <th className="pb-2 font-medium">Trust</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((a) => (
                <tr key={a.urn} className="border-b last:border-0 hover:bg-muted/40">
                  <td className="py-3">
                    <Link href={`/assets/${encodeURIComponent(a.urn)}`} className="flex items-center gap-2 hover:underline">
                      <PlatformIcon platform={a.platform} className="size-6" />
                      <span className="flex flex-col">
                        <span className="font-medium">{a.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {a.platform} · {a.kind}
                        </span>
                      </span>
                    </Link>
                  </td>
                  <td className="py-3 text-muted-foreground">{a.domain ?? "—"}</td>
                  <td className="py-3">
                    {a.owners.length === 0 ? (
                      <span className="text-warning">unassigned</span>
                    ) : (
                      <span className="text-muted-foreground">{a.owners.length} owner{a.owners.length > 1 ? "s" : ""}</span>
                    )}
                  </td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-1">
                      {a.tags.slice(0, 3).map((t) => (
                        <Badge key={t} variant="outline" className="font-normal">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="py-3">
                    <VerdictBadge score={a.score} band={a.band} verdict={a.verdict} size="sm" />
                  </td>
                </tr>
              ))}
              {assets.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground">
                    No assets found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

function FilterLink({
  label,
  active,
  href,
  icon,
}: {
  label: string;
  active: boolean;
  href: string;
  icon?: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium capitalize transition-colors ${
        active ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:bg-muted"
      }`}
    >
      {icon}
      {label}
    </Link>
  );
}
