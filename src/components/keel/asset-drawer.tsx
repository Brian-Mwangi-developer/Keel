"use client";

import {
  ExternalLink,
  Flag,
  Info,
  Megaphone,
  Sparkles,
  Unplug,
  UserCheck,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition, type CSSProperties } from "react";
import { toast } from "sonner";

import { hygieneExplanation } from "@/components/keel/hygiene-tooltips";
import { PlatformIcon } from "@/components/keel/platform-icon";
import { RulesTable } from "@/components/keel/rules-table";
import { ScoreDot } from "@/components/keel/verdict-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  bulkFlagUnsafeAction,
  investigateAction,
  notifyDepartmentsAction,
  notifyOwnersAction,
} from "@/lib/keel/actions";
import { getQuickView } from "@/lib/keel/client-fetch";
import { datahubEntityUrl, formatIso, shortUrn } from "@/lib/keel/format";
import { cn } from "@/lib/utils";
import type { QuickViewOut } from "@/lib/keel/types";

/**
 * The quick-look drawer -- click any node, see its decomposition, pivot to
 * any asset in its blast radius, act on it, all without leaving the page.
 * Tabs mirror the full /assets/[urn] page's own sections (Overview / Rules
 * / Flag history) so this drawer IS the detail view, not a stripped-down
 * preview of one -- "View full details" is there for deep-linking, not
 * because the drawer is missing something.
 */
export function AssetDrawer({
  urn,
  open,
  onOpenChange,
}: {
  urn: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [activeUrn, setActiveUrn] = useState(urn);
  const [prevPropUrn, setPrevPropUrn] = useState(urn);
  const [data, setData] = useState<QuickViewOut | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  // Render-time state adjustment (React's documented pattern for "reset a
  // state variable when a prop changes") rather than an effect -- resets
  // the internal pivot back to whatever was just clicked.
  if (open && urn && urn !== prevPropUrn) {
    setPrevPropUrn(urn);
    setActiveUrn(urn);
  }

  const loading = open && activeUrn !== null && data?.asset.urn !== activeUrn;

  useEffect(() => {
    if (!open || !activeUrn) return;
    let cancelled = false;
    getQuickView(activeUrn)
      .then((d) => !cancelled && setData(d))
      .catch(
        (e) =>
          !cancelled &&
          toast.error(e instanceof Error ? e.message : "Failed to load asset."),
      );
    return () => {
      cancelled = true;
    };
  }, [open, activeUrn]);

  const totalToFlag = data ? 1 + data.blast_radius.length : 0;
  const isIsolated = data
    ? data.asset.upstream_urns.length === 0 && data.blast_radius.length === 0
    : false;
  const failingWithPayload =
    data?.rules.filter(
      (r) =>
        r.has_run && !r.passing && Object.keys(r.native_results).length > 0,
    ) ?? [];

  return (
    <Drawer open={open} onOpenChange={onOpenChange} swipeDirection="right">
      <DrawerContent
        className="flex flex-col gap-0 overflow-hidden p-0"
        style={
          { "--drawer-content-width": "min(38rem, 100vw)" } as CSSProperties
        }
      >
        {loading && (
          <div className="flex flex-col gap-4 p-4">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        )}

        {data && !loading && (
          <>
            <DrawerHeader className="border-b pb-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2">
                  <PlatformIcon platform={data.asset.platform} className="mt-0.5 size-7" />
                  <div className="flex flex-col gap-1">
                    <DrawerTitle className="text-lg">
                      {data.asset.name}
                    </DrawerTitle>
                    <DrawerDescription className="font-mono text-[10px] break-all">
                      {data.asset.urn}
                    </DrawerDescription>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end">
                  <span className="font-mono text-3xl font-semibold tabular-nums">
                    {data.asset.score}
                  </span>
                  <span className="text-xs text-muted-foreground capitalize">
                    {data.asset.verdict}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-1 pt-1">
                <Badge variant="outline" className="font-normal">
                  {data.asset.platform} · {data.asset.kind}
                </Badge>
                {data.asset.owners.length === 0 && (
                  <Badge variant="outline" className="text-warning">
                    unowned
                  </Badge>
                )}
                {data.asset.tags.map((t) => (
                  <Badge key={t} variant="outline" className="font-normal">
                    {t}
                  </Badge>
                ))}
              </div>
              <Link
                href={`/assets/${encodeURIComponent(data.asset.urn)}`}
                className="w-fit text-xs text-primary underline underline-offset-2"
              >
                View full details →
              </Link>
            </DrawerHeader>

            <Tabs
              defaultValue="overview"
              className="flex min-h-0 flex-1 flex-col gap-0"
            >
              <TabsList className="mx-4 mt-3 w-fit shrink-0">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="rules">
                  Rules ({data.rules.length})
                </TabsTrigger>
                <TabsTrigger value="history">
                  Flag history ({data.flag_history.length})
                </TabsTrigger>
              </TabsList>

              <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
                <TabsContent
                  value="overview"
                  className="mt-0 flex flex-col gap-6"
                >
                  {isIsolated && (
                    <div className="flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/5 p-3 text-sm">
                      <Unplug className="mt-0.5 size-4 shrink-0 text-warning" />
                      <div>
                        <p className="font-medium text-warning">
                          Not connected to anything
                        </p>
                        <p className="mt-1 text-muted-foreground">
                          Nothing feeds this asset and nothing is built from it,
                          so no incident could have touched it — its score comes
                          entirely from its own hygiene
                          {data.asset.owners.length === 0
                            ? " and its missing owner"
                            : ""}
                          .
                          {data.asset.tags.includes("pii") &&
                            " It also holds personal data, which makes an unowned asset like this worth fixing on its own merits."}
                        </p>
                      </div>
                    </div>
                  )}

                  <section className="flex flex-col gap-3">
                    <SectionLabel>Why this score</SectionLabel>
                    <BarRow
                      label="Hygiene"
                      value={data.breakdown.hygiene_total}
                      max={100}
                    />
                    <p className="-mt-2 text-xs text-muted-foreground">
                      Freshness, schema stability, ownership and documentation.
                    </p>
                    {data.breakdown.validity < 1 && (
                      <BarRow
                        label="Failing checks"
                        value={data.breakdown.validity * 100}
                        max={100}
                        negative
                        sub={
                          data.breakdown.validity === 0
                            ? "critical — validity zeroed"
                            : `${Math.round(data.breakdown.validity * 100)}% passing`
                        }
                      />
                    )}
                    <BarRow
                      label="Trust"
                      value={data.asset.score}
                      max={100}
                      emphasize
                    />
                    {data.breakdown.capped_by && (
                      <p className="text-xs text-muted-foreground">
                        Capped by{" "}
                        <button
                          className="text-primary underline underline-offset-2"
                          onClick={() =>
                            setActiveUrn(data.breakdown.capped_by!.urn)
                          }
                        >
                          {shortUrn(data.breakdown.capped_by.urn)}
                        </button>{" "}
                        (score {data.breakdown.capped_by.score})
                      </p>
                    )}
                  </section>

                  {failingWithPayload.length > 0 && (
                    <section className="flex flex-col gap-2">
                      <SectionLabel>Failing check · the payload</SectionLabel>
                      {failingWithPayload.map((r) => (
                        <div key={r.id} className="flex flex-col gap-2">
                          <p className="text-xs text-muted-foreground">
                            {r.description || r.column} — this asset is the
                            origin, the value below is in it right now.
                          </p>
                          <pre className="overflow-x-auto rounded-lg bg-foreground p-3 font-mono text-xs text-background">
                            {Object.entries(r.native_results)
                              .map(([k, v]) => `${k}: ${v}`)
                              .join("\n")}
                          </pre>
                          <p className="text-xs text-destructive">
                            violates {r.description || r.id}
                          </p>
                        </div>
                      ))}
                    </section>
                  )}

                  <section className="flex flex-col gap-2">
                    <SectionLabel>
                      Blast radius · {data.blast_radius.length} downstream
                    </SectionLabel>
                    {data.blast_radius.length === 0 && !isIsolated && (
                      <p className="text-sm text-muted-foreground">
                        Nothing downstream of this asset.
                      </p>
                    )}
                    {data.blast_radius.map((b) => (
                      <button
                        key={b.urn}
                        onClick={() => setActiveUrn(b.urn)}
                        className="flex items-center justify-between gap-2 rounded-md border px-2.5 py-1.5 text-left text-sm hover:bg-muted/50"
                      >
                        <span className="flex items-center gap-2">
                          <ScoreDot band={b.band} />
                          <PlatformIcon platform={b.platform} className="size-4" />
                          {b.name}
                        </span>
                        <span className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="font-mono tabular-nums">
                            {b.score}
                          </span>
                          {b.kind}
                        </span>
                      </button>
                    ))}
                    {data.blast_radius.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {
                          new Set(data.blast_radius.flatMap((b) => b.owners))
                            .size
                        }{" "}
                        owning team(s) affected.
                      </p>
                    )}
                  </section>

                  <section className="flex flex-col gap-3">
                    <SectionLabel>Hygiene detail</SectionLabel>
                    {data.breakdown.parts.map((p) => (
                      <BarRow
                        key={p.key}
                        label={p.label}
                        value={p.got}
                        max={p.max}
                        sub={`${p.got.toFixed(0)}/${p.max}`}
                        explain={hygieneExplanation(p.key)}
                      />
                    ))}
                  </section>

                  <section className="flex flex-col gap-2">
                    <SectionLabel>Rules on this asset</SectionLabel>
                    {data.rules.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No rules yet — this asset&apos;s validity is assumed, not verified. Add one from the Rules tab.
                      </p>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {data.rules.map((rule) => (
                          <div
                            key={rule.id}
                            className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm"
                          >
                            <span className="font-mono text-xs">
                              {rule.description || `${rule.column ?? "table"} ${rule.id}`}
                            </span>
                            <span
                              className={cn(
                                "flex items-center gap-1.5 text-xs",
                                !rule.has_run
                                  ? "text-muted-foreground"
                                  : rule.passing
                                    ? "text-success"
                                    : "text-destructive",
                              )}
                            >
                              <span
                                className={cn(
                                  "size-1.5 rounded-full",
                                  !rule.has_run ? "bg-muted-foreground" : rule.passing ? "bg-success" : "bg-destructive",
                                )}
                              />
                              {!rule.has_run ? "never run" : rule.passing ? "passing" : "failing"}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                </TabsContent>

                <TabsContent value="rules" className="mt-0">
                  <RulesTable assetUrn={data.asset.urn} rules={data.rules} />
                </TabsContent>

                <TabsContent
                  value="history"
                  className="mt-0 flex flex-col gap-3"
                >
                  {data.flag_history.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No flags have ever been raised on this asset.
                    </p>
                  )}
                  {[...data.flag_history].reverse().map((f, i) => (
                    <div key={i} className="rounded-lg border p-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">
                          {f.event === "flagged"
                            ? "Flagged unsafe"
                            : "Unflagged"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatIso(f.at)}
                        </span>
                      </div>
                      {f.note && (
                        <p className="mt-1 text-muted-foreground">{f.note}</p>
                      )}
                      {f.event === "flagged" && (
                        <div className="mt-2 border-t pt-2 text-xs">
                          {f.resolved ? (
                            <span className="text-success">
                              Resolved{" "}
                              {f.resolved_at && formatIso(f.resolved_at)}
                              {f.resolved_note ? ` — ${f.resolved_note}` : ""}
                            </span>
                          ) : (
                            <span className="text-warning">Still open</span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </TabsContent>
              </div>
            </Tabs>

            <DrawerFooter className="flex-row flex-wrap items-center justify-between gap-2 border-t bg-muted/30 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      try {
                        const targets = [
                          data.asset.urn,
                          ...data.blast_radius.map((b) => b.urn),
                        ];
                        await bulkFlagUnsafeAction(
                          targets,
                          `Flagged from quick view: ${data.asset.name}`,
                        );
                        toast.success(
                          `Flagged ${targets.length} asset(s) as unsafe.`,
                        );
                      } catch (e) {
                        toast.error(
                          e instanceof Error
                            ? e.message
                            : "Failed to flag assets.",
                        );
                      }
                    })
                  }
                >
                  <Flag className="size-3.5" />
                  Flag {totalToFlag}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      try {
                        const result = await notifyOwnersAction(
                          data.asset.urn,
                          `${data.asset.name} is scoring ${data.asset.score} (${data.asset.verdict}).`,
                        );
                        if (result.sent) {
                          toast.success(
                            `Alerted owners in Slack (#${result.channel}).`,
                          );
                        } else {
                          toast.info(
                            result.reason || "Slack isn't connected yet.",
                          );
                        }
                      } catch (e) {
                        toast.error(
                          e instanceof Error
                            ? e.message
                            : "Failed to alert owners.",
                        );
                      }
                    })
                  }
                >
                  <UserCheck className="size-3.5" />
                  Alert owners
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      try {
                        const result = await notifyDepartmentsAction(
                          data.asset.urn,
                          `${data.asset.name} is scoring ${data.asset.score} (${data.asset.verdict}).`,
                        );
                        const sent = result.results.filter((r) => r.sent);
                        if (result.results.length === 0) {
                          toast.info("No department is configured for this asset yet — set one up in Notification routing.");
                        } else if (sent.length === result.results.length) {
                          toast.success(`Notified: ${sent.map((r) => r.department).join(", ")}.`);
                        } else if (sent.length > 0) {
                          toast.info(
                            `Sent to ${sent.map((r) => r.department).join(", ")}; failed for ${result.results
                              .filter((r) => !r.sent)
                              .map((r) => r.department)
                              .join(", ")}.`,
                          );
                        } else {
                          toast.error(result.results[0]?.reason || "Failed to notify departments.");
                        }
                      } catch (e) {
                        toast.error(e instanceof Error ? e.message : "Failed to notify departments.");
                      }
                    })
                  }
                >
                  <Megaphone className="size-3.5" />
                  Notify departments
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      try {
                        const result = await investigateAction(data.asset.urn);
                        toast.success("Investigation complete.");
                        onOpenChange(false);
                        router.push(
                          `/incidents/${encodeURIComponent(result.incident_id)}`,
                        );
                      } catch (e) {
                        toast.error(
                          e instanceof Error
                            ? e.message
                            : "Investigation failed.",
                        );
                      }
                    })
                  }
                >
                  <Sparkles className="size-3.5" />
                  Investigate
                </Button>
              </div>
              <a
                href={datahubEntityUrl(data.asset.urn)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-sky-700"
              >
                <Image
                  src="/datahub.png"
                  alt=""
                  width={36}
                  height={36}
                  className="rounded-xl"
                />
                Open in DataHub
                <ExternalLink className="size-3" />
              </a>
            </DrawerFooter>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
      {children}
    </h3>
  );
}

function BarRow({
  label,
  value,
  max,
  sub,
  emphasize,
  negative,
  explain,
}: {
  label: string;
  value: number;
  max: number;
  sub?: string;
  emphasize?: boolean;
  negative?: boolean;
  explain?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-sm">
        <span
          className={`flex items-center gap-1 ${emphasize ? "font-medium" : ""} ${negative ? "text-destructive font-medium" : ""}`}
        >
          {label}
          {explain && (
            <Tooltip>
              <TooltipTrigger className="text-muted-foreground hover:text-foreground">
                <Info className="size-3" />
              </TooltipTrigger>
              <TooltipContent>{explain}</TooltipContent>
            </Tooltip>
          )}
        </span>
        <span
          className={`font-mono text-xs tabular-nums ${negative ? "text-destructive" : "text-muted-foreground"}`}
        >
          {sub ?? value.toFixed(0)}
        </span>
      </div>
      <Progress
        value={(value / max) * 100}
        trackClassName={cn(
          "h-2 rounded-md border bg-transparent",
          negative ? "border-destructive/40" : emphasize ? "border-success/50" : "border-border",
        )}
        indicatorClassName={cn(
          "rounded-sm",
          negative ? "bg-destructive/20" : emphasize ? "bg-success/20" : "bg-primary/10",
        )}
      />
    </div>
  );
}
