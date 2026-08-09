"use client";

// Browser-safe counterpart to client.ts (which is server-only) -- goes
// through /api/keel/[...path], a thin authenticated proxy to keel-backend,
// since Client Components can't call the backend directly (no server-only
// env access, and no point opening the backend to the public internet for
// this). Read-only, same as client.ts -- mutations always go through
// Server Actions in actions.ts.
import type { FeedEventOut, IncidentRecord, LineageOut, OwnerOut, PipelineOverviewOut, QuickViewOut } from "./types";

async function keelClientFetch<T>(path: string): Promise<T> {
  const res = await fetch(`/api/keel${path}`, { cache: "no-store" });
  if (!res.ok) {
    const detail = await res.text().catch(() => res.statusText);
    throw new Error(`Keel proxy ${res.status} on ${path}: ${detail}`);
  }
  return res.json() as Promise<T>;
}

export function getQuickView(urn: string, maxHops?: number): Promise<QuickViewOut> {
  const params = maxHops ? `?max_hops=${maxHops}` : "";
  return keelClientFetch(`/assets/${encodeURIComponent(urn)}/quickview${params}`);
}

export function searchOwners(query: string, limit = 50): Promise<OwnerOut[]> {
  return keelClientFetch(`/owners?query=${encodeURIComponent(query || "*")}&limit=${limit}`);
}

// --- Live polling (dashboard + notification bell) --------------------------

export function getPipelineOverviewLive(rootUrn?: string): Promise<PipelineOverviewOut> {
  const params = rootUrn ? `?root_urn=${encodeURIComponent(rootUrn)}` : "";
  return keelClientFetch(`/pipeline/overview${params}`);
}

export function getFeedLive(limit = 50): Promise<FeedEventOut[]> {
  return keelClientFetch(`/pipeline/feed?limit=${limit}`);
}

export function listIncidentsLive(): Promise<IncidentRecord[]> {
  return keelClientFetch(`/agent/incidents`);
}

export function getLineageLive(urn: string): Promise<LineageOut> {
  return keelClientFetch(`/assets/${encodeURIComponent(urn)}/lineage?direction=both`);
}
