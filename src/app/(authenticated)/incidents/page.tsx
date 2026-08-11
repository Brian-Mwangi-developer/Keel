import Link from "next/link";

import { listIncidents } from "@/lib/keel/client";
import { relativeTime, shortUrn, SEVERITY_STYLES } from "@/lib/keel/format";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { IncidentStatus, SeverityLevel } from "@/lib/keel/types";

export default async function IncidentsPage() {
  const incidents = await listIncidents();

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Incidents</h1>
        <p className="text-sm text-muted-foreground">
          Keel&apos;s agent investigates using DataHub&apos;s own MCP tools and recommends a response — a human always
          reviews and decides. Nothing here was applied without approval.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {incidents.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              No incidents yet. Trigger &quot;Investigate with agent&quot; from any asset, or wait for one to be
              detected automatically.
            </CardContent>
          </Card>
        )}
        {incidents.map((incident) => (
          <Link key={incident.incident_id} href={`/incidents/${encodeURIComponent(incident.incident_id)}`}>
            <Card className="transition-colors hover:bg-muted/40">
              <CardContent className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{shortUrn(incident.root_urn)}</span>
                    <span className="font-mono text-xs text-muted-foreground">{incident.failure_class.replace(/_/g, " ")}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {incident.blast_radius.length} asset{incident.blast_radius.length === 1 ? "" : "s"} affected ·{" "}
                    {relativeTime(incident.detected_at)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {incident.severity_assessment && <SeverityBadge level={incident.severity_assessment} />}
                  <StatusBadge status={incident.status} />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: IncidentStatus }) {
  const variant =
    status === "resolved" ? "secondary" : status === "pending_human_approval" ? "default" : "outline";
  const className =
    status === "fixed" ? "bg-success text-success-foreground capitalize" : "capitalize";
  return (
    <Badge variant={variant} className={className}>
      {status.replace(/_/g, " ")}
    </Badge>
  );
}

function SeverityBadge({ level }: { level: SeverityLevel }) {
  const style = SEVERITY_STYLES[level];
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${style.bg} ${style.text}`}>{level}</span>
  );
}
