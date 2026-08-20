"use client";

import { ArrowLeft, ArrowRight, Download, Info, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { AdminBadge, AdminEmptyState, AdminErrorState, AdminPage, AdminPanel, ApiFallbackNotice, DefinitionRows, MiniSkeleton, PageTitle, SectionHeading } from "@/components/taskview/admin/admin-ui";
import { adminEndpoints, useAdminResource } from "@/components/taskview/admin/admin-resource";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type AuditTone = "success" | "safe" | "danger" | "primary";
interface AuditEvent { time: string; event: string; view: string; purpose: string; actor: string; result: string; tone: AuditTone; evidence?: string | null; evidenceId?: string | null; evidenceHash?: string | null }

const figmaAudit: AuditEvent[] = [
  { time: "02:04:18", event: "VIEW_CREATED", view: "JP_SIGNUP_DIAGNOSIS_V7", purpose: "JP Signup UX Diagnosis", actor: "System", result: "PASS", tone: "success", evidence: "Contract #EV-8831", evidenceId: "EV-8831" },
  { time: "02:03:52", event: "APPROVED", view: "JP_SIGNUP_DIAGNOSIS_V7", purpose: "High-risk refinement", actor: "Tokyo Ops", result: "SAFE ALT", tone: "safe", evidence: "Approval #REQ-024", evidenceId: "EV-8831" },
  { time: "02:03:20", event: "INFERENCE_CHECK", view: "JP_SIGNUP_DIAGNOSIS_V7", purpose: "High-risk refinement", actor: "Policy Engine", result: "RISK", tone: "danger", evidence: "Ledger #IF-304", evidenceId: "EV-8831" },
  { time: "02:02:41", event: "POLICY_CHECK", view: "JP_SIGNUP_DIAGNOSIS_V7", purpose: "JP Signup UX Diagnosis", actor: "Policy Engine", result: "2 DENY", tone: "danger", evidence: "Policy #PL-119", evidenceId: "EV-8831" },
  { time: "02:02:06", event: "UTILITY_TEST", view: "JP_SIGNUP_DIAGNOSIS_V7", purpose: "JP Signup UX Diagnosis", actor: "Validator", result: "PASS", tone: "success", evidence: "Test #UT-445", evidenceId: "EV-8831" },
  { time: "02:01:22", event: "VIEW_COMPILED", view: "JP_SIGNUP_DIAGNOSIS_V7", purpose: "JP Signup UX Diagnosis", actor: "Safe Compiler", result: "PASS", tone: "success", evidence: "Plan #CP-728", evidenceId: "EV-8831" },
  { time: "02:00:57", event: "PURPOSE_PARSED", view: "DRAFT", purpose: "JP Signup UX Diagnosis", actor: "Product Team", result: "OK", tone: "primary", evidence: "Spec #PS-102", evidenceId: "EV-8831" },
];

export function AuditLogScreen() {
  const { data, loading, error, demoFallback, reload } = useAdminResource<AuditEvent[]>(adminEndpoints.audit, figmaAudit);
  const [query, setQuery] = useState("");
  const [event, setEvent] = useState("all");
  const [result, setResult] = useState("all");
  const rows = useMemo(() => data.filter((item) => {
    const q = query.toLocaleLowerCase("ko-KR");
    return (!q || `${item.view} ${item.purpose} ${item.evidence}`.toLocaleLowerCase("ko-KR").includes(q)) && (event === "all" || item.event === event) && (result === "all" || item.result === result);
  }), [data, event, query, result]);

  return (
    <AdminPage>
      <PageTitle badge={<AdminBadge tone="primary">APPEND-ONLY</AdminBadge>} description="Purpose부터 변환·정책·승인·만료까지 감사 가능한 Evidence 이벤트를 추적합니다." title="Audit Log" />
      <AdminPanel className="mt-[22px] flex min-h-16 flex-col gap-2 p-3 lg:flex-row lg:items-center">
        <label className="relative min-w-0 flex-1"><span className="sr-only">Audit 검색</span><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-tv-slate" /><Input className="h-10 border-0 bg-tv-canvas pl-9 text-[11px]" onChange={(e) => setQuery(e.target.value)} placeholder="Task View · 요청자 · Event ID 검색" value={query} /></label>
        <CompactSelect onChange={setEvent} value={event} values={["all", "VIEW_CREATED", "APPROVED", "POLICY_CHECK", "UTILITY_TEST"]} label="이벤트" />
        <CompactSelect onChange={setResult} value={result} values={["all", "PASS", "SAFE ALT", "RISK", "2 DENY", "OK"]} label="결과" />
        <Button className="h-10 rounded-[10px] text-[10px]" disabled title="기간 필터 API 준비 중" variant="outline">최근 7일 · 준비 중</Button>
        <Button className="h-10 rounded-[10px] text-[10px]" disabled title="CSV 내보내기 API 준비 중" variant="outline"><Download className="size-3.5" />CSV · 준비 중</Button>
      </AdminPanel>
      {demoFallback ? <div className="mt-3"><ApiFallbackNotice onRetry={() => void reload()} /></div> : null}
      {error && !demoFallback ? <div className="mt-5"><AdminErrorState message={error} onRetry={() => void reload()} /></div> : <AdminPanel className="mt-5 overflow-hidden">
        {loading ? <div className="p-4"><MiniSkeleton rows={7} /></div> : !data.length ? <AdminEmptyState description="감사 이벤트가 기록되면 시간순으로 표시됩니다." title="감사 로그가 없습니다." /> : <div className="overflow-x-auto"><div className="min-w-[980px]"><div className="grid h-12 grid-cols-[116px_180px_330px_160px_150px_1fr_24px] items-center bg-tv-canvas px-3 text-[9px] font-bold text-tv-slate"><span>TIME</span><span>EVENT</span><span>TASK VIEW / PURPOSE</span><span>ACTOR</span><span>RESULT</span><span>EVIDENCE</span><span /></div>{rows.map((item) => <AuditRow item={item} key={`${item.time}-${item.event}`} />)}</div></div>}
      </AdminPanel>}
      <div className="mt-5 flex min-h-[60px] items-center justify-between gap-4 rounded-[10px] bg-tv-blue-50 px-4 text-[10px] leading-5 text-tv-blue-600"><span className="flex items-center gap-2"><Info className="size-4" />감사 로그는 실행 명세와 승인 근거를 보존하며, Task View가 만료되어도 정책·승인 이력은 별도 보존됩니다.</span><AdminBadge className="hidden sm:inline-flex" tone="primary">Evidence Contract</AdminBadge></div>
    </AdminPage>
  );
}

function AuditRow({ item }: { item: AuditEvent }) {
  const content = <><span className="text-tv-gray">{item.time}</span><strong className={item.event === "APPROVED" ? "text-tv-green-700" : "text-tv-ink"}>{item.event}</strong><span><strong className="block text-tv-ink">{item.view}</strong><small className="mt-1 block text-[9px] text-tv-gray">{item.purpose}</small></span><span>{item.actor}</span><AdminBadge className="h-5 justify-self-start text-[9px]" tone={item.tone}>{item.result}</AdminBadge><span className={item.evidenceId ? "text-tv-blue-600" : "text-tv-slate"}>{item.evidence ?? "증적 없음"}</span>{item.evidenceId ? <ArrowRight className="size-3.5 text-tv-slate" /> : <span aria-label="증적 없음" className="text-tv-slate">—</span>}</>;
  const className = "grid h-[78px] grid-cols-[116px_180px_330px_160px_150px_1fr_24px] items-center border-t border-tv-border px-3 text-[10px]";
  return item.evidenceId ? <Link className={`${className} transition-colors hover:bg-tv-canvas`} href={`/evidence/${encodeURIComponent(item.evidenceId)}`}>{content}</Link> : <div className={className}>{content}</div>;
}

function CompactSelect({ label, value, values, onChange }: { label: string; value: string; values: string[]; onChange: (value: string) => void }) {
  return <Select onValueChange={onChange} value={value}><SelectTrigger aria-label={`${label} 필터`} className="h-10 w-full rounded-[10px] text-[10px] lg:w-[116px]"><SelectValue>{label}: {value === "all" ? "전체" : value}</SelectValue></SelectTrigger><SelectContent>{values.map((item) => <SelectItem key={item} value={item}>{item === "all" ? "전체" : item}</SelectItem>)}</SelectContent></Select>;
}

interface EvidencePayload {
  id: string;
  view: string;
  title: string;
  created: string;
  hash: string;
}

const figmaEvidence: EvidencePayload = { id: "EV-8831", view: "JP_SIGNUP_DIAGNOSIS_V7", title: "JP Signup UX Diagnosis", created: "2026.08.18 02:04", hash: "8b31…d42a" };
const emptyEvidence: EvidencePayload = { id: "", view: "", title: "", created: "", hash: "" };

export function EvidenceDetailScreen({ evidenceId }: { evidenceId: string }) {
  const { data, loading, error, demoFallback, reload } = useAdminResource<EvidencePayload>(adminEndpoints.evidence(evidenceId), { ...figmaEvidence, id: evidenceId || figmaEvidence.id }, undefined, emptyEvidence);
  return (
    <AdminPage>
      <Link className="inline-flex items-center gap-1 text-[11px] font-medium text-tv-blue-600" href="/audit"><ArrowLeft className="size-3.5" />Audit Log</Link>
      <PageTitle className="mt-3" badge={<AdminBadge tone="primary">AUDITABLE</AdminBadge>} description={data.view ? `${data.view} 생성 시점의 실행·정책·승인 명세입니다.` : "Evidence Contract를 불러옵니다."} title={`Evidence Contract · ${data.id || evidenceId}`} />
      {demoFallback ? <div className="mt-3"><ApiFallbackNotice onRetry={() => void reload()} /></div> : null}
      {loading ? <MiniSkeleton rows={5} /> : error && !demoFallback ? <div className="mt-5"><AdminErrorState message={error} onRetry={() => void reload()} /></div> : <>
        <AdminPanel className="mt-4 flex min-h-[100px] flex-col justify-between gap-4 border-tv-blue-200 bg-tv-blue-50 p-4 sm:flex-row sm:items-center"><div><h2 className="text-[16px] font-bold">{data.title}</h2><p className="mt-2 text-[10px] text-tv-gray">Requester: Product Team · Seoul · Created: {data.created}</p></div><div className="text-right"><div className="flex justify-end gap-2"><AdminBadge tone="success">PASS</AdminBadge><AdminBadge tone="primary">TTL 7 days</AdminBadge></div><p className="mt-3 text-[9px] text-tv-slate">Contract hash · {data.hash}</p></div></AdminPanel>
        {demoFallback ? <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(280px,.9fr)]">
          <div className="space-y-3"><EvidenceSection title="1. Purpose & Requester" rows={[["Task","JP signup dropoff diagnosis"],["Requester","Product Team · Seoul"],["Target","New iOS users"],["Region","Japan (JP)"],["Success metric","Identify top causes of dropoff"]]} /><EvidenceSection title="2. Source Lineage" rows={[["Seoul Product","signup_events · error_log"],["Tokyo Operations","user_context · operation_issue"],["HCMC CS","tickets_jp · customer context"]]} /><EvidenceSection title="3. Transformations" rows={[["birth_date","BUCKET → age_band"],["exact_address","GENERALIZE → region_group"],["ticket_text","EXTRACT_CATEGORY → complaint_theme"],["name / phone / email",<span className="text-tv-red-700" key="drop">DROP</span>]]} /></div>
          <div className="space-y-3"><EvidenceSection title="Utility Validation" badge={<AdminBadge tone="success">PASS</AdminBadge>} rows={[["Raw Data","Reference"],["Static Masking","Context loss possible"],["Needex",<span className="text-tv-blue-600" key="top">Top-k insight preserved</span>]]} /><EvidenceSection title="Privacy / Policy" rows={[["Direct identifiers",<AdminBadge className="h-5" key="1" tone="danger">DENY</AdminBadge>],["raw_ticket_text",<AdminBadge className="h-5" key="2" tone="danger">DENY</AdminBadge>],["exact_address",<AdminBadge className="h-5" key="3" tone="safe">GENERALIZE</AdminBadge>],["group_size ≥ 20",<AdminBadge className="h-5" key="4" tone="success">PASS</AdminBadge>],["TTL ≤ 7 days",<AdminBadge className="h-5" key="5" tone="success">PASS</AdminBadge>]]} /><EvidenceSection title="Human Approval" badge={<AdminBadge tone="success">APPROVED</AdminBadge>} rows={[["Approver","Tokyo Operations"],["Decision","Safe alternative approved"],["Inference","Combination risk checked"],["Audit note","Reason + decision preserved"]]} /></div>
        </div> : <div className="mt-5"><AdminEmptyState description="현재 Evidence API는 식별자·View·생성 시각·계약 해시만 제공합니다. Source Lineage와 정책 판정 세부 계약이 추가되면 여기에 표시됩니다." title="Evidence 세부 명세 준비 중" /></div>}
      </>}
    </AdminPage>
  );
}

function EvidenceSection({ title, rows, badge }: { title: string; rows: Array<[React.ReactNode, React.ReactNode]>; badge?: React.ReactNode }) {
  return <AdminPanel className="p-4"><SectionHeading action={badge} title={title} /><DefinitionRows className="mt-4" rows={rows} /></AdminPanel>;
}
