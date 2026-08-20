import type { PolicyFinding, Needex } from "@/lib/types";

export type CoreTone = "neutral" | "primary" | "success" | "warning" | "danger" | "safe";

export interface CoreSource {
  key: "product" | "operations" | "voc";
  name: string;
  database: string;
  flag: string;
  meta: string;
  description: string;
}

export interface PurposeInterpretation {
  task: string;
  requester: string;
  target: string;
  region: "KR" | "JP" | "VN" | "APAC" | "GLOBAL";
  success: string;
  ttl_days: number;
  output_mode: "dashboard" | "api" | "dashboard_api";
  matched_sources: Array<{
    source: { key: CoreSource["key"]; name: string; short_name: string; country_flag: string };
    matched_fields: string[];
    reason: string;
  }>;
  interpreted_at: string;
  summary: string;
  subject: string;
  comparison_dimensions: string[];
  desired_outcome: string;
  region_label: string;
  department: "product" | "operations" | "support" | "executive";
  confidence: number;
  needs_clarification: boolean;
  clarifying_question: string | null;
}

export type DiscoveryDecision = "required" | "candidate" | "generalize" | "bucket" | "extract" | "drop";

export interface DiscoveryResponse {
  view_id: string;
  purpose: string;
  requester: string;
  region: "KR" | "JP" | "VN" | "APAC" | "GLOBAL";
  ttl_days: number;
  sources: Array<{
    source_id: string;
    source_key: CoreSource["key"];
    source_name: string;
    country_flag: string;
    dataset: string;
    reason: string;
    fields: Array<{
      name: string;
      data_type: string;
      decision: DiscoveryDecision;
      task_field: string | null;
      rationale: string;
    }>;
  }>;
  reviewed_field_count: number;
  candidate_field_count: number;
  completion_percent: number;
}

export interface ApprovalStatusResponse {
  view_id: string;
  request_id: string | null;
  submitted: boolean;
  state: "not_submitted" | "pending" | "approved" | "rejected" | "blocked";
  queue_position: number | null;
  queue_total: number;
  submitted_at: string | null;
  estimated_response_minutes: number | null;
  evidence_ready: boolean;
  timeline: Array<{
    organization: string;
    country_flag: string;
    status: "complete" | "review_required" | "waiting" | "issued" | "rejected";
    title: string;
    detail: string;
    affected_fields: string[];
  }>;
}

export interface CompilationTransform {
  source_key: "product" | "operations" | "voc";
  source_name: string;
  raw_fields: string[];
  operator: "SELECT" | "DROP" | "MASK" | "GENERALIZE" | "BUCKET" | "AGGREGATE" | "EXTRACT_CATEGORY";
  task_field: string | null;
  rationale: string;
}

export interface UtilityCandidate {
  mode: "raw" | "static_masking" | "taskview";
  score: number;
  verdict: string;
}

export interface FirewallCheck {
  code: string;
  label: string;
  result: "PASS" | "DENY" | "GENERALIZE" | "WARN";
  detail: string;
}

export interface CompilationResponse {
  view_id: string;
  view_name: string;
  stage: "validation_complete" | "blocked";
  source_match_count: number;
  transforms: CompilationTransform[];
  utility_candidates: UtilityCandidate[];
  firewall_checks: FirewallCheck[];
  excluded_fields: string[];
  can_submit_for_approval: boolean;
  policy_version: string;
}

export interface ApprovalSubmission {
  request_id: string;
  view_id: string;
  state: "pending" | "approved" | "rejected" | "blocked";
  queue_position: number;
  queue_total: number;
  assigned_owners: string[];
  submitted_at: string;
  idempotent_replay: boolean;
}

export type ApprovalDecision = "approve" | "approve_recommended_alternative" | "reject";

export interface ApprovalReview {
  request_id: string;
  view_id: string;
  view_name: string;
  risk_level: "low" | "medium" | "high";
  request_blocked: boolean;
  requested_purpose: string;
  requester: string | null;
  existing_view: string | null;
  reasons: Array<{ title: string; detail: string }>;
  policy_findings: PolicyFinding[];
  recommended_alternative: {
    available: boolean;
    changes: Array<{ before: string; after: string; operator: "DROP" | "GENERALIZE" | "BUCKET" | "EXTRACT_CATEGORY" | "TTL" }>;
    unresolved_findings: string[];
  };
  assigned_owner: string;
  can_approve_as_is: boolean;
  evidence_state: "pending" | "issued";
}

export interface SchemaField {
  name: string;
  data_type: "string" | "integer" | "date" | "datetime";
  source: string;
  transform: string;
}

export interface NeedexArtifacts {
  view_id: string;
  view_name: string;
  schema_fields: SchemaField[];
  removed_fields: string[];
  sql: string;
  api: {
    method: "GET";
    path: string;
    authentication: string;
    response_schema: SchemaField[];
  };
  dashboard: {
    dimensions: string[];
    measures: string[];
    default_visualization: "table" | "bar" | "line";
  };
  source_lineage: Array<{
    source_id: string;
    source_name: string;
    country_flag: string;
    fields: string[];
    transforms: string[];
    usage: "used";
  }>;
}

export interface MaterializedData {
  view_id: string;
  view_name: string;
  expires_at: string;
  content_sha256: string;
  data_origin?: string;
  columns: string[];
  rows: Array<Record<string, string | number>>;
}

export interface DashboardPayload {
  workspace_name: string;
  workspace_region: string;
  period_days: number;
  data_origin?: string;
  counters: {
    active_task_views: number;
    created_in_period: number;
    pending_approvals: number;
    blocked_requests: number;
    connected_sources: number;
  };
  recent_task_views: Array<{
    id: string;
    name: string;
    purpose: string;
    ttl_days: number;
    status: Needex["status"];
    requester_name: string;
    requester_region: string;
    created_at: string;
  }>;
  data_sources: Array<{
    id: string;
    key: string;
    name: string;
    short_name: string;
    country_flag: string;
    description: string;
    status: string;
    source_type?: "public_live" | "workspace";
    provider?: string | null;
    official_url?: string | null;
    last_synced_at?: string | null;
    row_count?: number;
  }>;
  privacy_firewall: {
    default_action: string;
    max_ttl_days: number;
    denied_data: string[];
    minimum_group_size: number;
  };
  generated_at: string;
}

export interface ServerResult<T> {
  data: T | null;
  error: string | null;
  status: number;
}

export interface CoreViewState {
  view: Needex;
  isFallback: boolean;
  error: string | null;
}
