"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { urnPath } from "./client";
import type {
  ConnectSourceIn,
  EditAndCheckOut,
  InvestigateOut,
  NotifyOwnersOut,
  Operator,
  ResolveOut,
  RuleDraftOut,
  Severity,
  SeverityLevel,
  SeverityRuleOut,
  UploadOut,
} from "./types";

const BASE_URL = process.env.KEEL_BACKEND_URL ?? "http://localhost:8010";

async function requireSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Not authenticated");
  return session;
}

async function postJson<T>(path: string, body?: unknown, method = "POST"): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => res.statusText);
    throw new Error(`Keel backend ${res.status} on ${path}: ${detail}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// --- Rules ------------------------------------------------------------

export async function createRuleAction(input: {
  asset_urn: string;
  column?: string | null;
  operator: Operator;
  value?: string | null;
  min_value?: string | null;
  max_value?: string | null;
  severity: Severity;
  description?: string | null;
}) {
  await requireSession();
  const rule = await postJson(`/rules`, input);
  revalidatePath(`/assets/${encodeURIComponent(input.asset_urn)}`);
  revalidatePath(`/rules`);
  return rule;
}

export async function draftRuleAction(assetUrn: string, description: string): Promise<RuleDraftOut> {
  await requireSession();
  return postJson<RuleDraftOut>(`/rules/draft`, { asset_urn: assetUrn, description });
}

export async function updateRuleSeverityAction(ruleId: string, severity: Severity, assetUrn: string) {
  await requireSession();
  await postJson(`/rules/${encodeURIComponent(ruleId)}`, { severity }, "PATCH");
  revalidatePath(`/assets/${encodeURIComponent(assetUrn)}`);
  revalidatePath(`/rules`);
}

export async function deleteRuleAction(ruleId: string, assetUrn: string) {
  await requireSession();
  await postJson(`/rules/${encodeURIComponent(ruleId)}`, undefined, "DELETE");
  revalidatePath(`/assets/${encodeURIComponent(assetUrn)}`);
  revalidatePath(`/rules`);
}

// --- Governance ---------------------------------------------------------

export async function flagUnsafeAction(urn: string, note?: string, relatedIncidentId?: string) {
  await requireSession();
  await postJson(`/assets/${urnPath(urn)}/flag-unsafe`, {
    note: note || null,
    related_incident_id: relatedIncidentId || null,
  });
  revalidatePath(`/assets/${encodeURIComponent(urn)}`);
  revalidatePath(`/dashboard`);
}

export async function unflagAction(urn: string, note?: string) {
  await requireSession();
  await postJson(`/assets/${urnPath(urn)}/unflag`, { note: note || null });
  revalidatePath(`/assets/${encodeURIComponent(urn)}`);
  revalidatePath(`/dashboard`);
}

export async function notifyOwnersAction(urn: string, reason?: string): Promise<NotifyOwnersOut> {
  await requireSession();
  return postJson<NotifyOwnersOut>(`/assets/${urnPath(urn)}/notify-owners`, { reason: reason || null });
}

export async function bulkFlagUnsafeAction(urns: string[], note?: string) {
  await requireSession();
  await Promise.all(urns.map((urn) => postJson(`/assets/${urnPath(urn)}/flag-unsafe`, { note: note || null })));
  revalidatePath(`/dashboard`);
  for (const urn of urns) revalidatePath(`/assets/${encodeURIComponent(urn)}`);
}

export async function assignOwnerAction(urn: string, ownerUrn: string, ownershipType = "data_owner") {
  await requireSession();
  await postJson(`/assets/${urnPath(urn)}/owner`, { owner_urn: ownerUrn, ownership_type: ownershipType });
  revalidatePath(`/assets/${encodeURIComponent(urn)}`);
  revalidatePath(`/dashboard`);
}

export async function removeOwnerAction(urn: string, ownerUrn: string) {
  await requireSession();
  await fetch(
    `${BASE_URL}/assets/${urnPath(urn)}/owner?owner_urn=${encodeURIComponent(ownerUrn)}`,
    { method: "DELETE", cache: "no-store" },
  );
  revalidatePath(`/assets/${encodeURIComponent(urn)}`);
}

// --- Sources --------------------------------------------------------------

export async function connectSourceAction(input: ConnectSourceIn) {
  await requireSession();
  const result = await postJson<{ urn: string }>(`/sources`, input);
  revalidatePath(`/sources`);
  return result;
}

export async function uploadSourceAction(formData: FormData): Promise<UploadOut> {
  await requireSession();

  const file = formData.get("file");
  if (!(file instanceof File)) throw new Error("No file provided.");

  const params = new URLSearchParams();
  const platform = String(formData.get("platform") || "file");
  params.set("platform", platform);
  const name = formData.get("name");
  if (name) params.set("name", String(name));
  const description = formData.get("description");
  if (description) params.set("description", String(description));

  const upstream = new FormData();
  upstream.set("file", file);

  const res = await fetch(`${BASE_URL}/sources/upload?${params.toString()}`, {
    method: "POST",
    body: upstream,
    cache: "no-store",
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => res.statusText);
    throw new Error(`Upload failed (${res.status}): ${detail}`);
  }
  const result = (await res.json()) as UploadOut;
  revalidatePath(`/sources`);
  return result;
}

export async function editAndCheckRowAction(
  urn: string,
  rowId: number,
  column: string,
  value: string,
): Promise<EditAndCheckOut> {
  await requireSession();
  const result = await postJson<EditAndCheckOut>(
    `/sources/${urnPath(urn)}/rows/${rowId}/edit-and-check`,
    { column, value },
  );
  revalidatePath(`/sources/${encodeURIComponent(urn)}`);
  revalidatePath(`/assets/${encodeURIComponent(urn)}`);
  revalidatePath(`/dashboard`);
  return result;
}

// --- Agent / incidents ----------------------------------------------------

export async function investigateAction(triggerUrn: string, pipelineRootUrn?: string): Promise<InvestigateOut> {
  const session = await requireSession();
  void session;
  const result = await postJson<InvestigateOut>(`/agent/investigate`, {
    trigger_urn: triggerUrn,
    pipeline_root_urn: pipelineRootUrn || null,
  });
  revalidatePath(`/incidents`);
  return result;
}

export async function approveIncidentAction(incidentId: string): Promise<ResolveOut> {
  const session = await requireSession();
  const approver = session.user.name || session.user.email || "unknown";
  const result = await postJson<ResolveOut>(`/agent/incidents/${encodeURIComponent(incidentId)}/approve`, {
    approver,
  });
  revalidatePath(`/incidents`);
  revalidatePath(`/incidents/${encodeURIComponent(incidentId)}`);
  revalidatePath(`/dashboard`);
  return result;
}

export async function denyIncidentAction(incidentId: string): Promise<ResolveOut> {
  const session = await requireSession();
  const approver = session.user.name || session.user.email || "unknown";
  const result = await postJson<ResolveOut>(`/agent/incidents/${encodeURIComponent(incidentId)}/deny`, {
    approver,
  });
  revalidatePath(`/incidents`);
  revalidatePath(`/incidents/${encodeURIComponent(incidentId)}`);
  return result;
}

// --- Demo -------------------------------------------------------------

export async function resetDemoAction(rootUrn?: string) {
  await requireSession();
  const params = rootUrn ? `?root_urn=${encodeURIComponent(rootUrn)}` : "";
  const result = await postJson<{
    unflagged: string[];
    assertions_repassed: string[];
    incidents_denied: string[];
  }>(`/demo/reset${params}`);
  revalidatePath(`/dashboard`);
  revalidatePath(`/assets`);
  revalidatePath(`/incidents`);
  revalidatePath(`/sources`);
  return result;
}

// --- Severity policy --------------------------------------------------

export async function addSeverityRuleAction(input: {
  selector_type: "domain" | "tag";
  selector_value: string;
  floor_severity: SeverityLevel;
  label?: string;
}): Promise<SeverityRuleOut> {
  await requireSession();
  const rule = await postJson<SeverityRuleOut>(`/severity-policy`, input);
  revalidatePath(`/settings/severity-policy`);
  return rule;
}

export async function removeSeverityRuleAction(id: string) {
  await requireSession();
  await postJson(`/severity-policy/${encodeURIComponent(id)}`, undefined, "DELETE");
  revalidatePath(`/settings/severity-policy`);
}
