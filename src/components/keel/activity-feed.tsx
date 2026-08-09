import { ArrowRight, Flag, FlagOff, Search, ShieldCheck, ShieldX } from "lucide-react";

import { shortUrn } from "@/lib/keel/format";
import type { FeedEventOut } from "@/lib/keel/types";

const KIND_META: Record<FeedEventOut["kind"], { icon: typeof ArrowRight; className: string; label: string }> = {
  score: { icon: ArrowRight, className: "text-muted-foreground", label: "SCORE" },
  flagged: { icon: Flag, className: "text-destructive", label: "FLAGGED" },
  unflagged: { icon: FlagOff, className: "text-success", label: "UNFLAGGED" },
  investigating: { icon: Search, className: "text-warning", label: "INVESTIGATING" },
  resolved: { icon: ShieldCheck, className: "text-success", label: "RESOLVED" },
  denied: { icon: ShieldX, className: "text-muted-foreground", label: "DENIED" },
};

/**
 * The dashboard's Activity panel -- a running tail of real events this
 * process has observed: score transitions computed from live DataHub reads
 * and incident lifecycle transitions (see keel-backend's app/state.py).
 * Styled after DataHub's own MetadataChangeLog stream, since every entry
 * here traces back to an actual metadata read or write, not a fixture.
 * Clicking a row opens that asset's quick-look drawer (via onSelect) rather
 * than navigating away -- same "stay on the page" interaction as clicking a
 * lineage node or a Movers row.
 */
export function ActivityFeed({ events, onSelect }: { events: FeedEventOut[]; onSelect: (urn: string) => void }) {
  if (events.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No activity yet — inject a bad event or flag an asset to see it here live.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {events.map((e, i) => {
        const meta = KIND_META[e.kind];
        const Icon = meta.icon;
        return (
          <button
            key={`${e.urn}-${e.at}-${i}`}
            onClick={() => onSelect(e.urn)}
            className="flex items-start gap-3 rounded-lg px-1 py-1 text-left text-sm transition-colors hover:bg-muted/50"
          >
            <Icon className={`mt-0.5 size-3.5 shrink-0 ${meta.className}`} />
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-semibold tracking-wide ${meta.className}`}>{meta.label}</span>
                <span className="text-[10px] text-muted-foreground">
                  {new Date(e.at * 1000).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </span>
              </div>
              <span className="truncate font-medium">{e.label || shortUrn(e.urn)}</span>
              <span className="truncate text-xs text-muted-foreground">{e.detail}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
