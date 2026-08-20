"use client";

import { ArrowRight, MoreHorizontal, Plus, Search } from "lucide-react";
import Link from "next/link";
import { type KeyboardEvent, useEffect, useMemo, useState } from "react";

import { AdminBadge, AdminEmptyState, AdminErrorState, AdminPage, AdminPanel, ApiFallbackNotice, MiniSkeleton, PageTitle } from "@/components/taskview/admin/admin-ui";
import { adminEndpoints, useAdminResource } from "@/components/taskview/admin/admin-resource";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Needex } from "@/lib/types";
import { cn } from "@/lib/utils";

type LibraryStatus = "ACTIVE" | "APPROVED" | "VALIDATING" | "EXPIRES SOON" | "EXPIRED" | "PROPOSED" | "BLOCKED" | "REJECTED";

interface LibraryView {
  id: string;
  name: string;
  label: string;
  purpose: string;
  owner: string;
  region: string;
  ttl: string;
  status: LibraryStatus;
}

const figmaViews: LibraryView[] = [
  { id: "jp-signup-diagnosis-v7", name: "JP_SIGNUP_DIAGNOSIS_V7", label: "Reusable Task View", purpose: "일본 iOS 신규 사용자 가입 이탈 원인 분석", owner: "Product Team", region: "JP", ttl: "7일", status: "ACTIVE" },
  { id: "jp-cs-product-insight-v3", name: "JP_CS_PRODUCT_INSIGHT_V3", label: "Reusable Task View", purpose: "일본 VOC 제품 인사이트 추출", owner: "Product Team", region: "JP", ttl: "3일", status: "APPROVED" },
  { id: "apac-refund-reason-v2", name: "APAC_REFUND_REASON_V2", label: "Reusable Task View", purpose: "APAC 환불 사유 패턴 분석", owner: "Product Team", region: "APAC", ttl: "5일", status: "VALIDATING" },
  { id: "jp-onboarding-v5", name: "JP_ONBOARDING_V5", label: "Reusable Task View", purpose: "일본 온보딩 장애 원인 분석", owner: "UX Team", region: "JP", ttl: "1일", status: "EXPIRES SOON" },
  { id: "sea-cs-theme-v1", name: "SEA_CS_THEME_V1", label: "Reusable Task View", purpose: "SEA 상담 테마 비교", owner: "Data Team", region: "SEA", ttl: "7일", status: "ACTIVE" },
  { id: "kr-ops-weekly-v4", name: "KR_OPS_WEEKLY_V4", label: "Reusable Task View", purpose: "주간 운영 이슈 요약", owner: "HQ Ops", region: "KR", ttl: "7일", status: "EXPIRED" },
];

function normalizeViews(response: Needex[]): LibraryView[] {
  if (!Array.isArray(response)) return [];
  return response.slice(0, 12).map((view, index) => ({
    id: view.id,
    name: view.id.length < 26 ? view.id.toUpperCase().replaceAll("-", "_") : `TASK_VIEW_${String(index + 1).padStart(2, "0")}`,
    label: "Reusable Task View",
    purpose: view.purpose,
    owner: view.requester?.display_name ?? "Product Team",
    region: view.audience === "operations" ? "JP" : view.audience === "support" ? "SEA" : "KR",
    ttl: `${view.ttl_days}일`,
    status: view.status === "approved" ? "APPROVED" : view.status === "proposed" ? "PROPOSED" : view.status === "rejected" ? "REJECTED" : "BLOCKED",
  }));
}

function statusTone(status: LibraryStatus) {
  if (status === "ACTIVE" || status === "APPROVED") return "success" as const;
  if (status === "VALIDATING" || status === "EXPIRES SOON" || status === "PROPOSED") return "warning" as const;
  if (status === "BLOCKED" || status === "REJECTED") return "danger" as const;
  return "neutral" as const;
}

export function NeedexsAdminScreen() {
  const { data: views, loading, error, demoFallback, reload } = useAdminResource<LibraryView[], Needex[]>(adminEndpoints.taskviews, figmaViews, normalizeViews);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [region, setRegion] = useState("all");
  const [ttl, setTtl] = useState("all");
  const [page, setPage] = useState(0);
  const pageSize = 6;

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("ko-KR");
    return views.filter((view) => {
      const matchQuery = !q || `${view.name} ${view.purpose} ${view.owner}`.toLocaleLowerCase("ko-KR").includes(q);
      const matchStatus = status === "all" || view.status === status;
      const matchRegion = region === "all" || view.region === region;
      const matchTtl = ttl === "all" || view.ttl === ttl;
      return matchQuery && matchStatus && matchRegion && matchTtl;
    });
  }, [query, region, status, ttl, views]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageViews = filtered.slice(page * pageSize, (page + 1) * pageSize);
  useEffect(() => { setPage(0); }, [query, region, status, ttl]);
  useEffect(() => { if (page >= pageCount) setPage(pageCount - 1); }, [page, pageCount]);

  return (
    <AdminPage>
      <PageTitle
        description="목적·상태·TTL 기준으로 발급된 업무용 View를 관리합니다."
        title="Task Views"
      />
      <Button asChild className="mt-3 h-10 w-full rounded-[10px] sm:hidden"><Link href="/taskviews/new"><Plus className="size-4" />새 Task View</Link></Button>

      <AdminPanel className="mt-[18px] flex min-h-16 flex-col gap-2 p-3 lg:flex-row lg:items-center">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Task View 검색</span>
          <Search aria-hidden="true" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-tv-slate" />
          <Input className="h-10 rounded-[10px] border-0 bg-tv-canvas pl-9 text-[12px] shadow-none" onChange={(event) => setQuery(event.target.value)} placeholder="Task View 이름이나 Purpose 검색" type="search" value={query} />
        </label>
        <div className="grid grid-cols-3 gap-2 lg:flex">
          <FilterSelect label="상태" onChange={setStatus} value={status} values={["all", "ACTIVE", "APPROVED", "PROPOSED", "BLOCKED", "REJECTED", "VALIDATING", "EXPIRES SOON", "EXPIRED"]} />
          <FilterSelect label="지역" onChange={setRegion} value={region} values={["all", "JP", "APAC", "SEA", "KR"]} />
          <FilterSelect label="TTL" onChange={setTtl} value={ttl} values={["all", "1일", "3일", "5일", "7일"]} />
        </div>
        <AdminBadge className="ml-auto" tone="primary">{views.length} views</AdminBadge>
      </AdminPanel>

      {demoFallback ? <div className="mt-3"><ApiFallbackNotice onRetry={() => void reload()} /></div> : null}

      {error && !demoFallback ? <div className="mt-5"><AdminErrorState message={error} onRetry={() => void reload()} /></div> : <AdminPanel className="mt-5 overflow-hidden">
        {loading ? <div className="p-4"><MiniSkeleton rows={6} /></div> : !views.length ? <AdminEmptyState action={<Button asChild><Link href="/taskviews/new"><Plus className="size-4" />첫 Task View 만들기</Link></Button>} description="업무 목적을 입력하면 필요한 의미만 남긴 Task View를 만들 수 있습니다." title="아직 Task View가 없습니다." /> : (
          <div className="overflow-x-auto">
            <div className="min-w-[960px]">
              <div className="grid h-12 grid-cols-[290px_330px_170px_100px_130px_24px] items-center bg-tv-canvas px-5 text-[10px] font-bold text-tv-slate">
                <span>TASK VIEW</span><span>PURPOSE</span><span>OWNER / REGION</span><span>TTL</span><span>STATUS</span><span />
              </div>
              {pageViews.map((view) => (
                <Link className="grid h-[82px] grid-cols-[290px_330px_170px_100px_130px_24px] items-center border-t border-tv-border px-5 transition-colors hover:bg-tv-canvas focus-visible:bg-tv-blue-50" href={`/taskviews/${encodeURIComponent(view.id)}`} key={view.id}>
                  <span className="min-w-0"><strong className="block truncate text-[12px] font-bold text-tv-ink">{view.name}</strong><small className="mt-0.5 block text-[10px] text-tv-slate">{view.label}</small></span>
                  <span className="truncate text-[11px] text-tv-gray">{view.purpose}</span>
                  <span className="text-[11px] font-medium text-tv-ink">{view.owner} · {view.region}</span>
                  <span className="text-[11px] font-medium text-tv-ink">{view.ttl}</span>
                  <AdminBadge className="h-[26px] justify-self-start text-[10px]" tone={statusTone(view.status)}>{view.status}</AdminBadge>
                  <MoreHorizontal aria-label="행 작업" className="size-4 text-tv-slate" />
                </Link>
              ))}
              {!filtered.length ? <div className="grid h-52 place-items-center text-[12px] text-tv-gray">조건에 맞는 Task View가 없습니다.</div> : null}
            </div>
          </div>
        )}
      </AdminPanel>}

      {!error || demoFallback ? <div className="mt-5 flex items-center justify-between gap-4">
        <span className="text-[11px] text-tv-gray">총 {views.length}개 중 {pageViews.length ? `${page * pageSize + 1}–${page * pageSize + pageViews.length}` : "0"}</span>
        <div className="flex gap-2">
          <Button className="h-9 rounded-[10px] px-5 text-[11px] text-tv-slate" disabled={page === 0} onClick={() => setPage((current) => Math.max(0, current - 1))} variant="outline">이전</Button>
          <Button className="h-9 rounded-[10px] px-5 text-[11px]" disabled={page + 1 >= pageCount} onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))} variant="outline">다음 <ArrowRight className="size-3.5" /></Button>
        </div>
      </div> : null}
      <p className="mt-4 text-[10px] leading-5 text-tv-slate">만료된 View는 원본 접근을 재사용하지 않으며, 재발급 시 Purpose와 Policy를 다시 검증합니다.</p>
    </AdminPage>
  );
}

function FilterSelect({ label, value, values, onChange }: { label: string; value: string; values: string[]; onChange: (value: string) => void }) {
  return (
    <Select onValueChange={onChange} value={value}>
      <SelectTrigger aria-label={`${label} 필터`} className="h-10 min-w-0 rounded-[10px] bg-white px-3 text-[11px] lg:w-[116px]">
        <SelectValue>{label}: {value === "all" ? "전체" : value}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {values.map((item) => <SelectItem key={item} value={item}>{item === "all" ? "전체" : item}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

interface ApprovalRequest {
  id: string;
  viewId: string;
  risk: "HIGH RISK" | "REVIEW" | "APPROVED";
  title: string;
  requester: string;
  owner: string;
  transform: string;
  finding: string;
  state: "pending" | "approved" | "rejected";
}

interface ApprovalPayload {
  pending: number;
  highRisk: number;
  approved: number;
  items: ApprovalRequest[];
}

function handleApprovalTabKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
  if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
  const tabs = Array.from(event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]:not(:disabled)') ?? []);
  if (!tabs.length) return;
  const current = tabs.indexOf(event.currentTarget);
  const target = event.key === "Home" ? tabs[0] : event.key === "End" ? tabs.at(-1) : event.key === "ArrowRight" ? tabs[(current + 1) % tabs.length] : tabs[(current - 1 + tabs.length) % tabs.length];
  event.preventDefault();
  target?.focus();
  target?.click();
}

const figmaApprovals: ApprovalPayload = {
  pending: 3,
  highRisk: 1,
  approved: 8,
  items: [
    { id: "REQ-024", viewId: "jp-signup-diagnosis-v7", risk: "HIGH RISK", title: "JP Signup UX Diagnosis", requester: "Product Team · Seoul", owner: "Tokyo Operations", transform: "raw_ticket_text · precise age · exact_address", finding: "Inference 결합 위험", state: "pending" },
    { id: "REQ-023", viewId: "sea-cs-theme-v1", risk: "REVIEW", title: "SEA CS Theme Analysis", requester: "Data Team · Seoul", owner: "HCMC CS", transform: "ticket_text → complaint_theme", finding: "신규 목적 검토", state: "pending" },
    { id: "REQ-021", viewId: "jp-onboarding-v5", risk: "REVIEW", title: "JP Onboarding Diagnosis", requester: "UX Team · Seoul", owner: "Tokyo Operations", transform: "exact_address → region_group", finding: "지역 일반화 승인", state: "pending" },
    { id: "REQ-018", viewId: "kr-ops-weekly-v4", risk: "APPROVED", title: "KR Ops Weekly Summary", requester: "HQ Ops · Seoul", owner: "Korea Operations", transform: "operation_issue → category", finding: "승인 완료", state: "approved" },
  ],
};
const emptyApprovals: ApprovalPayload = { pending: 0, highRisk: 0, approved: 0, items: [] };

interface ApiApprovalReview {
  request_id: string;
  view_id: string;
  view_name: string;
  risk_level: "low" | "medium" | "high";
  requested_purpose: string;
  requester: string | null;
  assigned_owner: string;
  reasons: Array<{ title: string }>;
  policy_findings: Array<{ field: string | null; action: string }>;
  recommended_alternative: { changes: Array<{ before: string; after: string; operator: string }> };
  evidence_state: "pending" | "issued";
}

function normalizeApprovals(response: ApiApprovalReview[]): ApprovalPayload {
  if (!Array.isArray(response)) return emptyApprovals;
  const items: ApprovalRequest[] = response.map((request) => ({
    id: request.request_id.toUpperCase().replace("REQ_", "REQ-"),
    viewId: request.view_id,
    risk: request.evidence_state === "issued" ? "APPROVED" : request.risk_level === "high" ? "HIGH RISK" : "REVIEW",
    title: request.view_name,
    requester: `${request.requester ?? "Product Team"} · Seoul`,
    owner: request.assigned_owner,
    transform: request.recommended_alternative.changes.length
      ? request.recommended_alternative.changes.map((change) => `${change.before} → ${change.after}`).join(" · ")
      : request.policy_findings.map((finding) => finding.field ?? finding.action).join(" · ") || "정책 검토",
    finding: request.reasons[0]?.title ?? (request.risk_level === "high" ? "Inference 결합 위험" : "신규 목적 검토"),
    state: request.evidence_state === "issued" ? "approved" : "pending",
  }));
  return { pending: items.filter((item) => item.state === "pending").length, highRisk: items.filter((item) => item.risk === "HIGH RISK").length, approved: items.filter((item) => item.state === "approved").length, items };
}

export function ApprovalInboxScreen() {
  const { data, loading, error, demoFallback, reload } = useAdminResource<ApprovalPayload, ApiApprovalReview[]>(adminEndpoints.approvals, figmaApprovals, normalizeApprovals, emptyApprovals);
  const [tab, setTab] = useState<"pending" | "all" | "approved" | "rejected">("pending");
  const [query, setQuery] = useState("");
  const [risk, setRisk] = useState("all");

  const rows = useMemo(() => data.items.filter((request) => {
    const tabMatch = tab === "all" || request.state === tab;
    const riskMatch = risk === "all" || request.risk === risk;
    const q = query.toLocaleLowerCase("ko-KR");
    const queryMatch = !q || `${request.id} ${request.title} ${request.requester}`.toLocaleLowerCase("ko-KR").includes(q);
    return tabMatch && riskMatch && queryMatch;
  }), [data.items, query, risk, tab]);

  return (
    <AdminPage>
      <PageTitle badge={<AdminBadge tone="warning">{data.pending}건 검토 필요</AdminBadge>} description="Data Owner가 신규 목적·고위험 변환을 검토하고 승인 또는 거절합니다." title="승인 요청" />
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <ApprovalMetric label="검토 필요" note="오늘 처리 권장" tone="warning" value={data.pending} />
        <ApprovalMetric label="High Risk" note="Inference risk 포함" tone="danger" value={data.highRisk} />
        <ApprovalMetric label="승인 완료" note="최근 7일" tone="success" value={data.approved} />
      </div>
      <AdminPanel className="mt-5 flex min-h-[60px] flex-col gap-3 p-3 lg:flex-row lg:items-center">
        <div aria-label="승인 요청 상태" className="grid w-full grid-cols-2 gap-1 sm:flex sm:flex-1" role="tablist">
          {([['pending','검토 필요'],['all','전체'],['approved','승인 완료'],['rejected','거절됨']] as const).map(([value, label]) => (
            <button aria-controls="approval-results" aria-selected={tab === value} className={cn("h-9 w-full whitespace-nowrap rounded-[10px] px-3 text-[12px] font-medium focus-visible:ring-2 focus-visible:ring-tv-blue-500 sm:w-auto sm:px-4", tab === value ? "border border-tv-blue-200 bg-tv-blue-50 text-tv-blue-600" : "text-tv-gray hover:text-tv-ink")} id={`approval-tab-${value}`} key={value} onClick={() => setTab(value)} onKeyDown={handleApprovalTabKeyDown} role="tab" tabIndex={tab === value ? 0 : -1} type="button">{label}</button>
          ))}
        </div>
        <label className="relative lg:w-[220px]"><span className="sr-only">승인 요청 검색</span><Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-tv-slate" /><Input className="h-9 border-0 bg-tv-canvas pl-9 text-[11px]" onChange={(event) => setQuery(event.target.value)} placeholder="요청자·Purpose 검색" value={query} /></label>
        <Select onValueChange={setRisk} value={risk}><SelectTrigger aria-label="위험도 필터" className="h-9 w-full text-[11px] lg:w-[96px]"><SelectValue placeholder="위험도" /></SelectTrigger><SelectContent><SelectItem value="all">위험도</SelectItem><SelectItem value="HIGH RISK">High Risk</SelectItem><SelectItem value="REVIEW">Review</SelectItem><SelectItem value="APPROVED">Approved</SelectItem></SelectContent></Select>
      </AdminPanel>
      {demoFallback ? <div className="mt-3"><ApiFallbackNotice onRetry={() => void reload()} /></div> : null}
      <div aria-labelledby={`approval-tab-${tab}`} className="mt-5 space-y-3 outline-none" id="approval-results" role="tabpanel" tabIndex={0}>
        {loading ? <MiniSkeleton rows={4} /> : error && !demoFallback ? <AdminErrorState message={error} onRetry={() => void reload()} /> : rows.map((request) => <ApprovalCard key={request.id} request={request} />)}
        {!loading && (!error || demoFallback) && !rows.length ? <AdminEmptyState description={data.items.length ? "검색어나 필터를 변경해 보세요." : "새 검토 요청이 도착하면 이곳에 표시됩니다."} title={data.items.length ? "조건에 맞는 승인 요청이 없습니다." : "검토할 승인 요청이 없습니다."} /> : null}
      </div>
      <p className="mt-7 text-[10px] leading-5 text-tv-slate">승인 상세 화면에서는 요청의 업무 필요성, Policy 위반, 과거 View와의 결합 위험, 안전한 대안을 함께 보여줍니다.</p>
    </AdminPage>
  );
}

function ApprovalMetric({ label, value, note, tone }: { label: string; value: number; note: string; tone: "warning" | "danger" | "success" }) {
  return <AdminPanel className="flex min-h-[90px] min-w-0 flex-wrap items-center justify-between gap-3 px-4 py-3"><div><p className="text-[11px] text-tv-gray">{label}</p><strong className="mt-1 block text-[22px] leading-7 text-tv-ink">{value}</strong></div><AdminBadge tone={tone}>{note}</AdminBadge></AdminPanel>;
}

function ApprovalCard({ request }: { request: ApprovalRequest }) {
  const href = request.state === "approved" ? "/evidence/EV-8831" : `/reviews/${encodeURIComponent(request.viewId)}`;
  const riskTone = request.risk === "HIGH RISK" ? "danger" : request.risk === "APPROVED" ? "success" : "warning";
  return (
    <AdminPanel className="grid min-h-[112px] gap-4 p-4 sm:grid-cols-[minmax(0,1.3fr)_minmax(140px,.75fr)_minmax(0,1.3fr)_auto] sm:items-center">
      <div className="min-w-0"><div className="flex items-center gap-3"><span className="text-[10px] font-bold text-tv-slate">{request.id}</span><AdminBadge className="h-5 px-2 text-[9px]" tone={riskTone}>{request.risk}</AdminBadge></div><h2 className="mt-2 truncate text-[14px] font-bold text-tv-ink">{request.title}</h2><p className="mt-1 text-[10px] text-tv-gray">{request.requester}</p></div>
      <div><p className="text-[9px] font-bold text-tv-slate">DATA OWNER</p><p className="mt-2 text-[11px] font-medium text-tv-ink">{request.owner}</p></div>
      <div className="min-w-0"><p className="text-[9px] font-bold text-tv-slate">REQUESTED TRANSFORM</p><p className="mt-2 truncate text-[10px] text-tv-gray">{request.transform}</p><p className={cn("mt-1 text-[10px] font-medium", request.risk === "HIGH RISK" ? "text-tv-red-700" : request.state === "approved" ? "text-tv-green-700" : "text-tv-amber-700")}>{request.finding}</p></div>
      <Button asChild className="h-10 rounded-[10px] bg-tv-blue-50 px-4 text-[11px] text-tv-blue-600 hover:bg-tv-blue-100"><Link href={href}>{request.state === "approved" ? "기록 보기" : "검토하기"}<ArrowRight className="size-3.5" /></Link></Button>
    </AdminPanel>
  );
}
