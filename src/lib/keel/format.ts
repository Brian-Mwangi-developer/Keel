import type { Band, SeverityLevel } from "./types";

// A single accent (--primary) for interactive things; a separate status
// ramp used ONLY for trust bands, drawn from this app's own --success /
// --warning / --destructive tokens (already the exact ramp keel-ui's
// design system was built around — #0e9f6e / #e3a008 / its destructive
// red). Status never rides on color alone: every badge also carries its
// own text, not just a color.
export const BAND_STYLES: Record<Band, { dot: string; text: string; bg: string; var: string; label: string }> = {
  good: {
    dot: "bg-success",
    text: "text-success",
    bg: "bg-success/10",
    var: "var(--success)",
    label: "Healthy",
  },
  warn: {
    dot: "bg-warning",
    text: "text-warning",
    bg: "bg-warning/10",
    var: "var(--warning)",
    label: "At risk",
  },
  bad: {
    dot: "bg-destructive",
    text: "text-destructive",
    bg: "bg-destructive/10",
    var: "var(--destructive)",
    label: "Failing",
  },
};

export const SEVERITY_STYLES: Record<SeverityLevel, { text: string; bg: string }> = {
  low: { text: "text-muted-foreground", bg: "bg-muted" },
  medium: { text: "text-warning", bg: "bg-warning/10" },
  high: { text: "text-destructive", bg: "bg-destructive/10" },
};

export function shortUrn(urn: string): string {
  // urn:li:dataset:(urn:li:dataPlatform:snowflake,trust_layer_db.public.driver_surge_features,PROD)
  // -> driver_surge_features (last dotted segment before the trailing ,ENV))
  const match = urn.match(/,([^,()]+),[A-Z]+\)$/);
  if (match) {
    const parts = match[1].split(".");
    return parts[parts.length - 1];
  }
  const dashboardMatch = urn.match(/:\(([^,]+),([^)]+)\)$/);
  if (dashboardMatch) return dashboardMatch[2];
  return urn;
}

export function relativeTime(unixSeconds: number): string {
  const deltaMs = Date.now() - unixSeconds * 1000;
  const deltaSec = Math.round(deltaMs / 1000);
  if (deltaSec < 5) return "just now";
  if (deltaSec < 60) return `${deltaSec}s ago`;
  const deltaMin = Math.round(deltaSec / 60);
  if (deltaMin < 60) return `${deltaMin}m ago`;
  const deltaHr = Math.round(deltaMin / 60);
  if (deltaHr < 24) return `${deltaHr}h ago`;
  return `${Math.round(deltaHr / 24)}d ago`;
}

const DATAHUB_ENTITY_SEGMENT: Record<string, string> = {
  dataset: "dataset",
  dashboard: "dashboard",
  mlModel: "mlModels",
  chart: "chart",
  dataFlow: "pipelines",
  dataJob: "tasks",
};

/** Best-effort deep link into the DataHub UI for a given urn -- DataHub
 * uses a different URL prefix per entity type, parsed straight out of the
 * urn itself (`urn:li:dataset:...` -> `dataset`, etc.). */
export function datahubEntityUrl(urn: string): string {
  const base = process.env.NEXT_PUBLIC_DATAHUB_UI_BASE ?? "http://localhost:9002";
  const match = urn.match(/^urn:li:([a-zA-Z]+):/);
  const segment = (match && DATAHUB_ENTITY_SEGMENT[match[1]]) || "dataset";
  return `${base}/${segment}/${encodeURIComponent(urn)}`;
}

export function formatIso(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
