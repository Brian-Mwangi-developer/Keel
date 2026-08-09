"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { listIncidentsLive } from "@/lib/keel/client-fetch";
import { relativeTime, shortUrn } from "@/lib/keel/format";
import type { IncidentRecord } from "@/lib/keel/types";

const POLL_MS = 15_000;

/**
 * Header notification bell -- live count of incidents still awaiting a
 * human decision (never auto-resolved, see agent/orchestrator.py), polled
 * against the real backend so it reflects whatever the agent has actually
 * opened, not a static badge. Clicking an item goes straight to that
 * incident; clicking the bell itself with none open still opens /incidents.
 */
export function NotificationBell() {
  const [incidents, setIncidents] = useState<IncidentRecord[]>([]);
  const [loaded, setLoaded] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      try {
        const all = await listIncidentsLive();
        if (!cancelled) {
          setIncidents(all);
          setLoaded(true);
        }
      } catch {
        // Silent -- a failed poll just means the badge doesn't update this
        // tick; it isn't worth surfacing a toast for a background refresh.
      }
    }
    poll();
    const id = setInterval(poll, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const pending = incidents.filter((i) => i.status === "pending_human_approval");
  const recent = incidents.slice(0, 8);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="size-4.5" />
            {pending.length > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-4 min-w-4 justify-center rounded-full px-1 text-[10px] tabular-nums"
              >
                {pending.length > 9 ? "9+" : pending.length}
              </Badge>
            )}
            <span className="sr-only">Notifications</span>
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-1.5 py-1 text-sm font-medium">
          Incidents
          {pending.length > 0 && (
            <span className="text-xs font-normal text-muted-foreground">{pending.length} awaiting review</span>
          )}
        </div>
        <DropdownMenuSeparator />
        {!loaded && <p className="px-2 py-3 text-center text-xs text-muted-foreground">Loading…</p>}
        {loaded && recent.length === 0 && (
          <p className="px-2 py-3 text-center text-xs text-muted-foreground">No incidents — the pipeline has been calm.</p>
        )}
        {recent.map((incident) => (
          <DropdownMenuItem
            key={incident.incident_id}
            onClick={() => router.push(`/incidents/${encodeURIComponent(incident.incident_id)}`)}
            className="flex flex-col items-start gap-0.5 py-2"
          >
            <div className="flex w-full items-center justify-between gap-2">
              <span className="font-medium">{shortUrn(incident.root_urn)}</span>
              <span
                className={
                  incident.status === "pending_human_approval"
                    ? "text-xs text-warning"
                    : incident.status === "resolved"
                      ? "text-xs text-success"
                      : "text-xs text-muted-foreground"
                }
              >
                {incident.status.replace(/_/g, " ")}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              {incident.failure_class.replace(/_/g, " ")} · {relativeTime(incident.detected_at)}
            </span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/incidents")} className="justify-center text-xs">
          View all incidents
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
