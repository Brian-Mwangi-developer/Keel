import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { shortUrn } from "@/lib/keel/format";
import type { BreakdownOut } from "@/lib/keel/types";

/**
 * IDEA.md §5.3: "Selecting any asset shows a full decomposition: what its
 * own health was, what its failing checks cost it, which specific
 * upstream asset capped it and by how much, and how many hops away that
 * asset is." This component is that decomposition, laid out in the same
 * order a person would reason through it.
 */
export function BreakdownView({ breakdown }: { breakdown: BreakdownOut }) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Own health</CardTitle>
          <CardDescription>Hygiene: freshness, schema stability, ownership, documentation.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {breakdown.parts.map((part) => (
            <div key={part.key} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{part.label}</span>
                <span className="font-mono text-muted-foreground tabular-nums">
                  {part.got.toFixed(1)} / {part.max}
                </span>
              </div>
              <Progress value={(part.got / part.max) * 100} />
            </div>
          ))}
          <div className="mt-2 flex items-center justify-between border-t pt-3 text-sm">
            <span className="font-medium">Hygiene total</span>
            <span className="font-mono tabular-nums">{breakdown.hygiene_total.toFixed(1)} / 100</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Validity gate</CardTitle>
          <CardDescription>The fraction of this asset&apos;s own quality checks currently passing.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Validity</span>
              <span className="font-mono tabular-nums">{(breakdown.validity * 100).toFixed(0)}%</span>
            </div>
            <Progress
              value={breakdown.validity * 100}
              indicatorClassName={breakdown.validity === 0 ? "bg-destructive" : undefined}
            />
          </div>

          {breakdown.failed_rules.length > 0 ? (
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium">Failing checks</span>
              {breakdown.failed_rules.map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-md border px-3 py-1.5 text-xs">
                  <span className="font-mono">{r.id.split(":").pop()}</span>
                  <Badge variant={r.severity === "critical" ? "destructive" : "outline"} className="capitalize">
                    {r.severity}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-success">All checks passing (or none attached).</p>
          )}

          <div className="flex items-center justify-between border-t pt-3 text-sm">
            <span className="font-medium">Own score (hygiene × validity gate)</span>
            <span className="font-mono tabular-nums">{breakdown.own.toFixed(1)}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Upstream cap</CardTitle>
          <CardDescription>
            trust = min( own_health × validity_gate, min(upstream trust) + hop_recovery )
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {breakdown.upstream.length === 0 ? (
            <p className="text-sm text-muted-foreground">No upstream assets — nothing to inherit damage from.</p>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                {breakdown.upstream.map((u) => (
                  <Link
                    key={u.urn}
                    href={`/assets/${encodeURIComponent(u.urn)}`}
                    className="flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs hover:bg-muted"
                  >
                    {shortUrn(u.urn)}
                    <span className="font-mono tabular-nums text-muted-foreground">{u.score}</span>
                  </Link>
                ))}
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Ceiling (weakest upstream + hop recovery)</span>
                <span className="font-mono tabular-nums">{breakdown.ceiling.toFixed(1)}</span>
              </div>
            </>
          )}

          {breakdown.capped_by ? (
            <div className="rounded-lg border border-warning/40 bg-warning/5 p-3 text-sm">
              <span className="font-medium">
                Capped by{" "}
                <Link href={`/assets/${encodeURIComponent(breakdown.capped_by.urn)}`} className="underline underline-offset-2">
                  {shortUrn(breakdown.capped_by.urn)}
                </Link>{" "}
                (score {breakdown.capped_by.score})
              </span>
              <p className="mt-1 text-muted-foreground">
                This asset&apos;s own health ({breakdown.own.toFixed(1)}) is fine — its final score is lower because
                nothing can be more trustworthy than what it&apos;s made of.
              </p>
            </div>
          ) : (
            <div className="rounded-lg border p-3 text-sm text-muted-foreground">
              Not capped — its own health governs this score.
            </div>
          )}

          {breakdown.root_cause && (
            <Link
              href={`/assets/${encodeURIComponent(breakdown.root_cause.urn)}`}
              className="flex items-center justify-between rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm hover:bg-destructive/10"
            >
              <span>
                Root cause: <span className="font-medium">{breakdown.root_cause.name}</span>, {breakdown.root_cause.hops}{" "}
                hop{breakdown.root_cause.hops === 1 ? "" : "s"} upstream
              </span>
              <ArrowUpRight className="size-4 shrink-0" />
            </Link>
          )}

          <div className="flex items-center justify-between border-t pt-3 text-base font-semibold">
            <span>Final score</span>
            <span className="font-mono tabular-nums">{breakdown.final}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
