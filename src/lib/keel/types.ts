// Mirrors keel-backend's pydantic response/request schemas exactly
// (app/api/schemas/*.py). Kept as one file since the backend is the
// single source of truth for these shapes — update both together.

export type Verdict = "safe to use" | "use with care" | "don't trust today";
export type Band = "good" | "warn" | "bad";
export type Severity = "critical" | "warning";
export type SeverityLevel = "low" | "medium" | "high";

export interface AssetOut {
  urn: string;
  name: string;
  kind: string;
  platform: string;
  domain: string | null;
  owners: string[];
  tags: string[];
  score: number;
  band: Band;
  verdict: Verdict;
}

export interface AssetDetailOut extends AssetOut {
  upstream_urns: string[];
  downstream_count: number;
  fully_registered: boolean;
}

export interface HygienePartOut {
  key: string;
  label: string;
  max: number;
  got: number;
}

export interface FailedRuleOut {
  id: string;
  severity: Severity;
}

export interface UpstreamRefOut {
  urn: string;
  name: string;
  score: number;
}

export interface RootCauseOut {
  urn: string;
  name: string;
  hops: number;
}

export interface BreakdownOut {
  asset_urn: string;
  parts: HygienePartOut[];
  hygiene_total: number;
  validity: number;
  failed_rules: FailedRuleOut[];
  own: number;
  upstream: UpstreamRefOut[];
  ceiling: number;
  capped_by: UpstreamRefOut | null;
  final: number;
  verdict: Verdict;
  root_cause: RootCauseOut | null;
}

export interface LineageNodeOut {
  urn: string;
  name: string;
  kind: string;
  platform: string;
  score: number;
  band: Band;
  verdict: Verdict;
}

export interface LineageEdgeOut {
  from_urn: string;
  to_urn: string;
}

export interface LineageOut {
  nodes: LineageNodeOut[];
  edges: LineageEdgeOut[];
}

export interface BlastRadiusEntryOut {
  urn: string;
  name: string;
  kind: string;
  platform: string;
  score: number;
  band: Band;
  verdict: Verdict;
  owners: string[];
}

export interface QuickViewOut {
  asset: AssetDetailOut;
  breakdown: BreakdownOut;
  blast_radius: BlastRadiusEntryOut[];
  rules: RuleOut[];
  flag_history: FlagHistoryEntryOut[];
}

export interface NotifyOwnersOut {
  sent: boolean;
  channel: string | null;
  reason: string | null;
  owners: string[];
}

export interface OwnerOut {
  urn: string;
  display_name: string;
  type: "user" | "group";
  avatar_url: string | null;
  description: string | null;
}

export interface HistoryPointOut {
  t: number;
  v: number;
}

export interface MoverOut {
  urn: string;
  name: string;
  current: number;
  previous: number | null;
  delta: number | null;
}

export interface PipelineOverviewOut {
  root_urn: string;
  pipeline_trust_index: number;
  band: Band;
  verdict: Verdict;
  history: HistoryPointOut[];
  asset_count: number;
  healthy_count: number;
  warn_count: number;
  bad_count: number;
  movers: MoverOut[];
}

export type FeedEventKind = "score" | "flagged" | "unflagged" | "investigating" | "resolved" | "denied";

export interface FeedEventOut {
  kind: FeedEventKind;
  urn: string;
  label: string;
  detail: string;
  at: number;
  from_value: number | null;
  to_value: number | null;
}

export type Operator =
  | "between"
  | "greater_than"
  | "greater_than_or_equal_to"
  | "less_than"
  | "less_than_or_equal_to"
  | "equal_to"
  | "not_equal_to"
  | "not_null";

export interface RuleOut {
  id: string;
  asset_urn: string;
  column: string | null;
  description: string | null;
  severity: Severity;
  has_run: boolean;
  passing: boolean | null;
  last_run_millis: number | null;
  row_count: number | null;
  unexpected_count: number | null;
  native_results: Record<string, string>;
}

export interface RuleCreateIn {
  asset_urn: string;
  column?: string | null;
  operator: Operator;
  value?: string | null;
  min_value?: string | null;
  max_value?: string | null;
  severity: Severity;
  description?: string | null;
}

export interface RuleDraftOut {
  asset_urn: string;
  column: string | null;
  operator: Operator | null;
  value: string | null;
  min_value: string | null;
  max_value: string | null;
  severity: Severity;
  description: string | null;
  available_fields: string[];
}

export interface SourceOut {
  platform: string;
  asset_count: number;
  kinds: string[];
}

export interface ConnectSourceIn {
  platform: string;
  name: string;
  description?: string | null;
  owner_urn?: string | null;
  upstream_urns?: string[] | null;
}

export interface UploadOut {
  urn: string;
  platform: string;
  name: string;
  row_count: number;
  columns: string[];
}

export interface LocalRow {
  _row_id: number;
  [column: string]: string | number | null;
}

export interface CheckResultOut {
  rule_id: string;
  column: string | null;
  operator: string;
  value_checked: string | null;
  passed: boolean;
  severity: Severity;
}

export interface EditAndCheckOut {
  row: LocalRow;
  checks: CheckResultOut[];
}

export interface FlagHistoryEntryOut {
  event: "flagged" | "unflagged";
  at: string;
  note: string | null;
  actor: string | null;
  related_incident_id: string | null;
  resolved: boolean | null;
  resolved_at: string | null;
  resolved_note: string | null;
}

export type SelectorType = "domain" | "tag";

export interface SeverityRuleOut {
  id: string;
  selector_type: SelectorType;
  selector_value: string;
  floor_severity: SeverityLevel;
  label: string | null;
}

export type IncidentStatus =
  | "investigating"
  | "pending_human_approval"
  | "resolved"
  | "denied";

export interface ActionResultOut {
  action: string;
  urn: string;
  applied: boolean;
  detail: string;
}

export interface IncidentRecord {
  incident_id: string;
  root_urn: string;
  root_name: string;
  trigger_urn: string;
  failure_class: string;
  symptom_signature: string;
  blast_radius: string[];
  policy_floor: SeverityLevel | null;
  policy_note?: string;
  detected_at: number;
  detected_at_iso: string;
  status: IncidentStatus;
  reasoning?: string;
  severity_assessment?: SeverityLevel;
  resolved_by?: "human";
  approved_by?: string;
  denied_by?: string;
  resolved_at?: number;
  resolution_seconds?: number;
  actions?: ActionResultOut[];
  matched_incident_id?: string | null;
  matched_pattern?: Record<string, unknown> | null;
  recommended_actions?: string[];
  target_urns?: string[];
  notify_team_name?: string | null;
}

export interface InvestigateOut {
  incident_id: string;
  status: IncidentStatus;
  root_urn: string;
  reasoning: string;
  recommended_actions: string[];
  target_urns: string[];
  severity_assessment: SeverityLevel;
  matched_incident_id: string | null;
  matched_pattern: Record<string, unknown> | null;
  policy_floor: SeverityLevel | null;
  detected_at: number;
}

export interface ResolveOut {
  incident_id: string;
  status: "resolved" | "denied";
  approver: string;
  actions?: ActionResultOut[];
  detected_at?: number;
  resolved_at?: number;
  resolution_seconds?: number;
}
