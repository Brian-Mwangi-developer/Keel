// Server-only fetch wrappers over keel-backend. Every trust score in this
// product is a live computation over DataHub (see keel-backend's
// app/trust/engine.py) — nothing here is cached beyond a single request,
// so "no-store" is the deliberate default throughout, not an oversight.
// Called from Server Components directly; mutations live in actions.ts.
import "server-only";

import type {
  AssetDetailOut,
  AssetOut,
  BreakdownOut,
  EditAndCheckOut,
  FeedEventOut,
  FlagHistoryEntryOut,
  IncidentRecord,
  InvestigateOut,
  LineageOut,
  LocalRow,
  PipelineOverviewOut,
  ResolveOut,
  RuleDraftOut,
  RuleOut,
  SeverityRuleOut,
  SourceOut,
  UploadOut,
} from "./types";

const BASE_URL = process.env.KEEL_BACKEND_URL ?? "http://localhost:8010";

export class KeelApiError extends Error {
  constructor(
    public status: number,
    public path: string,
    detail: string,
  ) {
    super(`Keel backend ${status} on ${path}: ${detail}`);
    this.name = "KeelApiError";
  }
}

async function keelFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    cache: "no-store",
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => res.statusText);
    throw new KeelApiError(res.status, path, detail);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export function urnPath(urn: string): string {
  return encodeURIComponent(urn);
}

// --- Pipeline ---------------------------------------------------------

export function getPipelineOverview(
  rootUrn?: string,
  maxHops?: number,
): Promise<PipelineOverviewOut> {
  const params = new URLSearchParams();
  if (rootUrn) params.set("root_urn", rootUrn);
  if (maxHops) params.set("max_hops", String(maxHops));
  const qs = params.toString();
  return keelFetch(`/pipeline/overview${qs ? `?${qs}` : ""}`);
}

export function getFeed(limit = 50): Promise<FeedEventOut[]> {
  return keelFetch(`/pipeline/feed?limit=${limit}`);
}

// --- Assets -------------------------------------------------------------

export function listAssets(
  rootUrn: string,
  opts?: { maxHops?: number; domain?: string; platform?: string; tag?: string },
): Promise<AssetOut[]> {
  const params = new URLSearchParams({ root_urn: rootUrn });
  if (opts?.maxHops) params.set("max_hops", String(opts.maxHops));
  if (opts?.domain) params.set("domain", opts.domain);
  if (opts?.platform) params.set("platform", opts.platform);
  if (opts?.tag) params.set("tag", opts.tag);
  return keelFetch(`/assets?${params.toString()}`);
}

export function getAsset(urn: string): Promise<AssetDetailOut> {
  return keelFetch(`/assets/${urnPath(urn)}`);
}

export function getBreakdown(urn: string): Promise<BreakdownOut> {
  return keelFetch(`/assets/${urnPath(urn)}/breakdown`);
}

export function getLineage(
  urn: string,
  direction: "both" | "upstream" | "downstream" = "both",
): Promise<LineageOut> {
  return keelFetch(`/assets/${urnPath(urn)}/lineage?direction=${direction}`);
}

export function getFlagHistory(urn: string): Promise<FlagHistoryEntryOut[]> {
  return keelFetch(`/assets/${urnPath(urn)}/flag-history`);
}

// --- Rules ----------------------------------------------------------------

export function listRules(assetUrn: string): Promise<RuleOut[]> {
  return keelFetch(`/rules?asset_urn=${encodeURIComponent(assetUrn)}`);
}

// --- Sources ----------------------------------------------------------------

export function listSources(rootUrn: string, maxHops?: number): Promise<SourceOut[]> {
  const params = new URLSearchParams({ root_urn: rootUrn });
  if (maxHops) params.set("max_hops", String(maxHops));
  return keelFetch(`/sources?${params.toString()}`);
}

export function getRows(urn: string, limit = 50, offset = 0): Promise<LocalRow[]> {
  return keelFetch(`/sources/${urnPath(urn)}/rows?limit=${limit}&offset=${offset}`);
}

// --- Severity policy ----------------------------------------------------

export function listSeverityRules(): Promise<SeverityRuleOut[]> {
  return keelFetch(`/severity-policy`);
}

// --- Agent / incidents ---------------------------------------------------

export function listIncidents(): Promise<IncidentRecord[]> {
  return keelFetch(`/agent/incidents`);
}

export function getIncident(id: string): Promise<IncidentRecord> {
  return keelFetch(`/agent/incidents/${encodeURIComponent(id)}`);
}

export type {
  AssetDetailOut,
  AssetOut,
  BreakdownOut,
  EditAndCheckOut,
  InvestigateOut,
  ResolveOut,
  RuleDraftOut,
  UploadOut,
};
