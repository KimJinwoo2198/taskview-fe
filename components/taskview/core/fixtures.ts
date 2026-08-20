import type { Needex, TransformPlanItem, ViewStatus } from "@/lib/types";

import type { CompilationResponse, CompilationTransform, CoreSource, SchemaField, NeedexArtifacts } from "./model";

export const demoPurpose = "일본 iOS 신규 사용자의 최근 회원가입 이탈 원인을 찾고 싶습니다.";

export const coreSources: CoreSource[] = [
  {
    key: "product",
    name: "Seoul Product",
    database: "Seoul Product DB",
    flag: "🇰🇷",
    meta: "signup_events · error_log",
    description: "가입 단계와 이탈 지점을 판단하는 핵심 이벤트",
  },
  {
    key: "operations",
    name: "Tokyo Operations",
    database: "Tokyo Operations DB",
    flag: "🇯🇵",
    meta: "device · region · ops",
    description: "일본 사용자 환경과 지역 맥락을 일반화해 활용",
  },
  {
    key: "voc",
    name: "HCMC CS",
    database: "Ho Chi Minh CS DB",
    flag: "🇻🇳",
    meta: "ticket_text · customer",
    description: "일본어 상담 원문에서 문제 유형과 불만 테마를 추출",
  },
];

const demoTransforms: TransformPlanItem[] = [
  { source: "product", input_fields: ["dropoff_step"], output_field: "signup_step", transformation: "select", rationale: "가입 단계 의미만 선택합니다." },
  { source: "operations", input_fields: ["exact_address"], output_field: "region_group", transformation: "region_group", rationale: "상세 주소를 권역으로 일반화합니다." },
  { source: "operations", input_fields: ["birth_date"], output_field: "age_band", transformation: "age_band", rationale: "생년월일 대신 연령 구간을 사용합니다." },
  { source: "voc", input_fields: ["ticket_text"], output_field: "complaint_theme", transformation: "classify", rationale: "원문을 노출하지 않고 불만 테마를 추출합니다." },
  { source: "voc", input_fields: ["customer_name"], output_field: "customer_name", transformation: "drop", rationale: "직접 식별자를 제거합니다." },
  { source: "voc", input_fields: ["phone", "email"], output_field: "contact", transformation: "drop", rationale: "연락처를 제거합니다." },
];

export const demoView: Needex = {
  id: "demo",
  status: "approved",
  purpose: demoPurpose,
  audience: "product",
  ttl_days: 7,
  plan: {
    purpose_spec: {
      objective: "JP signup dropoff diagnosis",
      decision_to_support: "JP Signup UX Diagnosis",
      audience: "product",
      requested_fields: ["signup_step", "error_category", "complaint_theme", "region_group", "week"],
    },
    selected_sources: ["product", "operations", "voc"],
    transformations: demoTransforms,
    preview_columns: ["age_band", "os_version", "signup_step", "error_category", "complaint_theme", "region_group", "week"],
    assumptions: ["신규 iOS 사용자와 최근 7일을 기준으로 해석했습니다."],
    needs_owner_approval: true,
  },
  policy_findings: [
    { code: "PII_DENY", severity: "block", field: "name / phone / email", message: "직접 식별자는 View에 포함할 수 없습니다.", action: "DROP" },
    { code: "RAW_TEXT_DENY", severity: "block", field: "raw_ticket_text", message: "Product 조직에 상담 원문을 제공할 수 없습니다.", action: "EXTRACT_CATEGORY" },
    { code: "ADDRESS_GENERALIZE", severity: "warning", field: "exact_address", message: "상세 주소는 권역으로 일반화합니다.", action: "GENERALIZE" },
    { code: "GROUP_SIZE", severity: "info", field: null, message: "최소 집단 크기 20을 충족합니다.", action: "PASS" },
    { code: "TTL_LIMIT", severity: "info", field: null, message: "TTL 7일 정책을 충족합니다.", action: "PASS" },
  ],
  utility: { selected_field_count: 7, removed_field_count: 5, estimated_rows: 4280, utility_score: 88 },
  preview_rows: [
    { age_band: "20–29", os_version: "iOS 18", signup_step: "signup_step_03", error_category: "error_category_A", complaint_theme: "complaint_theme_01", region_group: "Kanto", week: "2026-W34" },
    { age_band: "30–39", os_version: "iOS 18", signup_step: "signup_step_02", error_category: "error_category_B", complaint_theme: "complaint_theme_02", region_group: "Kansai", week: "2026-W34" },
  ],
  created_at: "2026-08-18T09:00:00.000Z",
  created_by: "demo-requester",
  requester: { display_name: "Product Team", email: "product@taskview.local" },
  reviewed_by: "owner@taskview.local",
  review_reason: "안전한 최소 공개 범위를 확인했습니다.",
  evidence: {
    view_id: "demo",
    purpose: demoPurpose,
    sources: ["Seoul Product", "Tokyo Operations", "HCMC CS"],
    transformations: demoTransforms,
    policy_version: "taskview-policy-2026.08",
    approved_by: "Data Owner",
    created_at: "2026-08-18T09:20:00.000Z",
    expires_at: "2026-08-25T09:20:00.000Z",
    row_count: 4280,
    minimum_group_size: 20,
    content_sha256: "b92ad738762e840b3f741cf3e7415c24900ca1e9b5e813446f4863775a12d9ee",
  },
};

export const demoRecentViews: Needex[] = [
  demoView,
  {
    ...demoView,
    id: "demo-insight",
    purpose: "일본 VOC 제품 인사이트를 확인하고 싶습니다.",
    status: "approved",
    ttl_days: 3,
    created_at: "2026-08-17T09:00:00.000Z",
    plan: { ...demoView.plan, purpose_spec: { ...demoView.plan.purpose_spec, decision_to_support: "JP CS Product Insight" } },
  },
  {
    ...demoView,
    id: "demo-refund",
    purpose: "APAC 환불 원인을 분석하고 싶습니다.",
    status: "proposed",
    ttl_days: 5,
    created_at: "2026-08-16T09:00:00.000Z",
    plan: { ...demoView.plan, purpose_spec: { ...demoView.plan.purpose_spec, decision_to_support: "APAC Refund Reason" } },
    evidence: null,
  },
];

const operatorMap: Record<TransformPlanItem["transformation"], CompilationTransform["operator"]> = {
  select: "SELECT",
  drop: "DROP",
  mask: "MASK",
  age_band: "BUCKET",
  region_group: "GENERALIZE",
  aggregate: "AGGREGATE",
  classify: "EXTRACT_CATEGORY",
};

export function toCompilation(view: Needex): CompilationResponse {
  const transforms = view.plan.transformations.map<CompilationTransform>((item) => ({
    source_key: item.source,
    source_name: coreSources.find((source) => source.key === item.source)?.name ?? item.source,
    raw_fields: item.input_fields,
    operator: operatorMap[item.transformation],
    task_field: item.transformation === "drop" ? null : item.output_field,
    rationale: item.rationale,
  }));
  const checks = view.policy_findings.map((finding) => ({
    code: finding.code,
    label: finding.field ?? finding.message,
    result: (finding.action === "PASS" ? "PASS" : finding.action === "GENERALIZE" ? "GENERALIZE" : finding.severity === "block" ? "DENY" : "WARN") as "PASS" | "DENY" | "GENERALIZE" | "WARN",
    detail: finding.message,
  }));
  return {
    view_id: view.id,
    view_name: viewName(view),
    stage: view.status === "blocked" ? "blocked" : "validation_complete",
    source_match_count: view.plan.selected_sources.length,
    transforms,
    utility_candidates: [
      { mode: "raw", score: 100, verdict: "노출 최대" },
      { mode: "static_masking", score: 63, verdict: "맥락 손실 가능" },
      { mode: "taskview", score: view.utility.utility_score, verdict: "결론 유지" },
    ],
    firewall_checks: checks.length ? checks : demoCompilation.firewall_checks,
    excluded_fields: ["name", "phone", "email", "exact_address", "raw_ticket_text"],
    can_submit_for_approval: view.status !== "rejected",
    policy_version: view.evidence?.policy_version ?? "taskview-policy-2026.08",
  };
}

export const demoCompilation: CompilationResponse = {
  view_id: demoView.id,
  view_name: "JP_SIGNUP_DIAGNOSIS_V7",
  stage: "validation_complete",
  source_match_count: 3,
  transforms: demoTransforms.map((item) => ({
    source_key: item.source,
    source_name: coreSources.find((source) => source.key === item.source)?.name ?? item.source,
    raw_fields: item.input_fields,
    operator: operatorMap[item.transformation],
    task_field: item.transformation === "drop" ? null : item.output_field,
    rationale: item.rationale,
  })),
  utility_candidates: [
    { mode: "raw", score: 100, verdict: "노출 최대" },
    { mode: "static_masking", score: 63, verdict: "맥락 손실 가능" },
    { mode: "taskview", score: 88, verdict: "결론 유지" },
  ],
  firewall_checks: [
    { code: "PII_DENY", label: "직접 식별자 name / phone / email", result: "DENY", detail: "View에서 제거" },
    { code: "RAW_TEXT_DENY", label: "raw_ticket_text (Product 요청)", result: "DENY", detail: "원문 제공 불가" },
    { code: "ADDRESS_GENERALIZE", label: "exact_address", result: "GENERALIZE", detail: "권역으로 일반화" },
    { code: "GROUP_SIZE", label: "group_size ≥ 20", result: "PASS", detail: "최소 집단 기준 충족" },
    { code: "TTL", label: "TTL ≤ 7 days", result: "PASS", detail: "정책 기준 충족" },
  ],
  excluded_fields: ["name", "phone", "email", "exact_address", "raw_ticket_text"],
  can_submit_for_approval: true,
  policy_version: "taskview-policy-2026.08",
};

export const demoSchema: SchemaField[] = [
  { name: "age_band", data_type: "string", source: "birth_date", transform: "BUCKET" },
  { name: "os_family / os_version", data_type: "string", source: "Seoul Product", transform: "SELECT" },
  { name: "signup_step", data_type: "string", source: "dropoff_step", transform: "SELECT" },
  { name: "error_category", data_type: "string", source: "error_log", transform: "CATEGORY" },
  { name: "complaint_theme", data_type: "string", source: "ticket_text", transform: "EXTRACT" },
  { name: "region_group", data_type: "string", source: "exact_address", transform: "GENERALIZE" },
  { name: "week", data_type: "date", source: "event_time", transform: "BUCKET" },
];

export function toArtifacts(view: Needex): NeedexArtifacts {
  const schema = view.plan.preview_columns.length
    ? view.plan.preview_columns.map((name) => demoSchema.find((field) => field.name.includes(name)) ?? { name, data_type: "string" as const, source: "Needex", transform: "SELECT" })
    : demoSchema;
  return {
    view_id: view.id,
    view_name: viewName(view),
    schema_fields: schema,
    removed_fields: ["name", "phone", "email", "exact_address", "raw_ticket_text"],
    sql: `SELECT ${schema.map((field) => field.name.replace(" / ", ", ")).join(", ")}\nFROM taskview_${view.id.replaceAll("-", "_")};`,
    api: { method: "GET", path: `/v1/taskviews/${view.id}/data`, authentication: "Bearer session token", response_schema: schema },
    dashboard: { dimensions: ["signup_step", "error_category", "complaint_theme", "region_group", "week"], measures: ["record_count"], default_visualization: "bar" },
    source_lineage: coreSources.map((source) => ({
      source_id: source.key,
      source_name: source.name,
      country_flag: source.flag,
      fields: source.meta.split(" · "),
      transforms: view.plan.transformations.filter((item) => item.source === source.key).map((item) => operatorMap[item.transformation]),
      usage: "used",
    })),
  };
}

export const demoArtifacts = toArtifacts(demoView);

export function viewName(view: Needex) {
  if (view.id === "demo") return "JP_SIGNUP_DIAGNOSIS_V7";
  const seed = view.plan.purpose_spec.decision_to_support || view.plan.purpose_spec.objective;
  const normalized = seed.toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_|_$/g, "");
  return normalized ? `${normalized.slice(0, 24)}_V1` : `TASK_VIEW_${view.id.slice(0, 8).toUpperCase()}`;
}

export function statusCopy(status: ViewStatus) {
  return ({ proposed: "검증 중", approved: "사용 중", rejected: "수정 필요", blocked: "정책 차단" } as const)[status];
}
