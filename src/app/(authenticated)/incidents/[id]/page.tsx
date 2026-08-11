import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, History } from "lucide-react";

import { getIncident, KeelApiError } from "@/lib/keel/client";
import { formatIso, shortUrn, SEVERITY_STYLES } from "@/lib/keel/format";
import { IncidentDecision } from "@/components/keel/incident-decision";
import { MarkFixedButton } from "@/components/keel/mark-fixed-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { SeverityLevel } from "@/lib/keel/types";

export default async function IncidentDetailPage(props: PageProps<"/incidents/[id]">) {
  const { id } = await props.params;

  let incident;
  try {
    incident = await getIncident(id);
  } catch (e) {
    if (e instanceof KeelApiError && e.status === 404) notFound();
    throw e;
  }

  const matchedPattern = incident.matched_pattern as
    | { incident_id?: string; reasoning?: string; recommended_actions?: string[]; resolved_at?: string }
    | undefined
    | null;

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <Link href="/incidents" className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-3.5" />
        All incidents
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-semibold">{incident.root_name}</h1>
          <span className="font-mono text-xs text-muted-foreground">{incident.symptom_signature}</span>
        </div>
        <div className="flex items-center gap-2">
          {incident.severity_assessment && <SeverityBadge level={incident.severity_assessment} />}
          <Badge variant="outline" className="capitalize">
            {incident.status.replace(/_/g, " ")}
          </Badge>
        </div>
      </div>

      {incident.status === "pending_human_approval" && <IncidentDecision incidentId={incident.incident_id} />}

      {(incident.status === "resolved" || incident.status === "fixed") && (
        <Card className="border-success/40 bg-success/5">
          <CardHeader className="flex flex-row items-start justify-between gap-3">
            <div>
              <CardTitle className="text-success">
                Approved by {incident.approved_by} · {incident.resolved_at && formatIso(new Date(incident.resolved_at * 1000).toISOString())}
              </CardTitle>
              <CardDescription>
                What actually happened when this was approved — notifications only. The underlying data problem is
                separate; see below.
              </CardDescription>
            </div>
            {incident.status === "resolved" && <MarkFixedButton incidentId={incident.incident_id} />}
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {incident.actions?.map((a, i) => (
              <div key={i} className="flex items-start gap-2 rounded-md border bg-background/60 p-2.5 text-sm">
                <Badge
                  variant={a.applied ? "default" : "outline"}
                  className={`shrink-0 capitalize ${a.applied ? "bg-success text-success-foreground" : "text-muted-foreground"}`}
                >
                  {a.applied ? "sent" : "not sent"}
                </Badge>
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium capitalize">
                    {a.action.replace(/_/g, " ")} <span className="font-normal text-muted-foreground">on {shortUrn(a.urn)}</span>
                  </span>
                  <span className="text-xs whitespace-pre-line text-muted-foreground">{a.detail}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {incident.status === "fixed" && (
        <Card className="border-primary/40 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-primary">
              Marked fixed by {incident.fixed_by} · {incident.fixed_at && formatIso(new Date(incident.fixed_at * 1000).toISOString())}
            </CardTitle>
            <CardDescription>A human confirmed the data problem is actually resolved.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-1 text-sm text-muted-foreground">
            {incident.unflagged && <span>Deprecation flag cleared on {shortUrn(incident.root_urn)}.</span>}
            {incident.assertions_repassed && incident.assertions_repassed.length > 0 && (
              <span>{incident.assertions_repassed.length} failing check(s) re-passed — trust recovering upstream-first.</span>
            )}
            {!incident.unflagged && (!incident.assertions_repassed || incident.assertions_repassed.length === 0) && (
              <span>No open flag or failing check was found to clear.</span>
            )}
          </CardContent>
        </Card>
      )}

      {incident.status === "denied" && (
        <Card className="border-muted-foreground/30">
          <CardContent className="text-sm text-muted-foreground">Denied by {incident.denied_by} — no action was taken.</CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Agent&apos;s investigation</CardTitle>
            <CardDescription>Grounded in real DataHub MCP tool calls, not the incident summary alone.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <p className="text-sm leading-relaxed">{incident.reasoning}</p>
            {incident.policy_floor && (
              <div className="rounded-md border bg-muted/40 p-2 text-xs text-muted-foreground">
                Org severity policy required at least <span className="font-medium capitalize">{incident.policy_floor}</span>
                {incident.policy_note ? ` — ${incident.policy_note}` : ""}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recommended actions</CardTitle>
            <CardDescription>Proposals only — applying them requires the approve step above.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {incident.recommended_actions && incident.recommended_actions.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {incident.recommended_actions.map((a) => (
                  <Badge key={a} variant="secondary" className="capitalize">
                    {a.replace(/_/g, " ")}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No actions recommended.</p>
            )}
            {incident.target_urns && incident.target_urns.length > 0 && (
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Targets</span>
                {incident.target_urns.map((u) => (
                  <Link key={u} href={`/assets/${encodeURIComponent(u)}`} className="text-sm hover:underline">
                    {shortUrn(u)}
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {matchedPattern && (
          <Card className="lg:col-span-2 border-primary/30 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="size-4" />
                Matched a prior incident
              </CardTitle>
              <CardDescription>
                The agent found this in incident memory and used it as context — it did not act on it automatically.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm">
              {matchedPattern.reasoning && <p className="text-muted-foreground">{matchedPattern.reasoning}</p>}
              {matchedPattern.recommended_actions && (
                <div className="flex flex-wrap gap-1.5">
                  {matchedPattern.recommended_actions.map((a) => (
                    <Badge key={a} variant="outline" className="capitalize">
                      {a.replace(/_/g, " ")}
                    </Badge>
                  ))}
                </div>
              )}
              {matchedPattern.incident_id && (
                <Link
                  href={`/incidents/${encodeURIComponent(matchedPattern.incident_id)}`}
                  className="flex items-center gap-1 text-xs text-primary underline underline-offset-2"
                >
                  view that incident <ArrowUpRight className="size-3" />
                </Link>
              )}
            </CardContent>
          </Card>
        )}

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Blast radius</CardTitle>
            <CardDescription>Every currently-unhealthy asset downstream of the root cause.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {incident.blast_radius.map((u) => (
              <Link
                key={u}
                href={`/assets/${encodeURIComponent(u)}`}
                className="rounded-full border px-3 py-1 text-xs hover:bg-muted"
              >
                {shortUrn(u)}
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SeverityBadge({ level }: { level: SeverityLevel }) {
  const style = SEVERITY_STYLES[level];
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${style.bg} ${style.text}`}>{level}</span>
  );
}
