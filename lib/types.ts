export type Audience = "product" | "operations" | "support" | "executive";
export type ViewStatus = "proposed" | "approved" | "rejected" | "blocked";
export type Role = "requester" | "data_owner" | "admin";

export interface User {
  id: string;
  email: string;
  display_name: string;
  role: Role;
  created_at: string;
}

export interface TransformPlanItem {
  source: "product" | "operations" | "voc";
  input_fields: string[];
  output_field: string;
  transformation:
    | "select"
    | "drop"
    | "mask"
    | "age_band"
    | "region_group"
    | "aggregate"
    | "classify";
  rationale: string;
}

export interface PolicyFinding {
  code: string;
  severity: "info" | "warning" | "block";
  field: string | null;
  message: string;
  action: string;
}

export interface EvidenceContract {
  view_id: string;
  purpose: string;
  sources: string[];
  transformations: TransformPlanItem[];
  policy_version: string;
  approved_by: string;
  created_at: string;
  expires_at: string;
  row_count: number;
  minimum_group_size: number;
  content_sha256: string;
}

export interface TaskView {
  id: string;
  status: ViewStatus;
  purpose: string;
  audience: Audience;
  ttl_days: number;
  plan: {
    purpose_spec: {
      objective: string;
      decision_to_support: string;
      audience: Audience;
      requested_fields: string[];
    };
    selected_sources: Array<"product" | "operations" | "voc">;
    transformations: TransformPlanItem[];
    preview_columns: string[];
    assumptions: string[];
    needs_owner_approval: boolean;
  };
  policy_findings: PolicyFinding[];
  utility: {
    selected_field_count: number;
    removed_field_count: number;
    estimated_rows: number;
    utility_score: number;
  };
  preview_rows: Array<Record<string, string | number>>;
  created_at: string;
  created_by: string | null;
  reviewed_by: string | null;
  review_reason: string | null;
  evidence: EvidenceContract | null;
}
