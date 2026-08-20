"use client";

import { ArrowRight, Check, Copy, Database, ExternalLink, FileCode2 } from "lucide-react";
import Link from "next/link";
import { type KeyboardEvent, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { CountryFlag } from "@/components/taskview/country-flag";
import { isNeedexDemoMode } from "@/lib/demo-mode";
import { cn } from "@/lib/utils";

import { useCoreNeedex } from "./client";
import { coreSources, toArtifacts, viewName } from "./fixtures";
import type { NeedexArtifacts } from "./model";
import { CoreEmpty, CoreError, CorePage, CorePanel, CorePill, DemoNotice, MetricTile, SectionHeading } from "./shared";

type DetailTab = "schema" | "sql" | "api" | "dashboard";

function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
  const tabs = Array.from(event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]:not(:disabled)') ?? []);
  if (!tabs.length) return;
  const current = tabs.indexOf(event.currentTarget);
  const target = event.key === 'Home' ? tabs[0] : event.key === 'End' ? tabs.at(-1) : event.key === 'ArrowRight' ? tabs[(current + 1) % tabs.length] : tabs[(current - 1 + tabs.length) % tabs.length];
  event.preventDefault();
  target?.focus();
  target?.click();
}

export function NeedexDetailCore({ viewId, initialArtifacts, artifactsError }: { viewId: string; initialArtifacts?: NeedexArtifacts | null; artifactsError?: string | null }) {
  const { view, loading, error, isFallback, reload } = useCoreNeedex(viewId);
  const [tab, setTab] = useState<DetailTab>("schema");
  if (loading) return <div className="tv-page"><div className="h-[820px] animate-pulse rounded-2xl bg-tv-subtle" role="status" aria-label="Task View 상세 로딩 중" /></div>;
  if (error && !isFallback) return <CoreError message={error} retry={() => void reload()} />;
  if (!initialArtifacts && !isNeedexDemoMode) return <CoreError message={artifactsError ?? "Task View Artifact를 불러오지 못했습니다."} />;
  const usingDemoArtifacts = !initialArtifacts;
  const artifacts = initialArtifacts ?? toArtifacts(view);
  const approved = view.status === "approved";
  const blockingFindings = view.policy_findings.filter((item) => item.severity === "block").length;
  const expiresAt = view.evidence?.expires_at ? new Date(view.evidence.expires_at) : new Date(new Date(view.created_at).getTime() + view.ttl_days * 86400000);
  const daysLeft = Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / 86400000));

  async function copyApi() {
    await navigator.clipboard.writeText(artifacts.api.path);
    toast.success("API 경로를 복사했습니다.");
  }

  return (
    <CorePage className="gap-4 pb-8">
      {isFallback || usingDemoArtifacts ? <DemoNotice error={error ?? artifactsError} /> : null}

      <section className="flex min-h-[110px] items-start gap-5 rounded-[16px] border border-tv-blue-200 bg-tv-blue-50 px-5 py-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2"><h1 className="text-[22px] font-bold leading-[26px] tracking-[-0.025em] text-tv-ink">{artifacts.view_name || viewName(view)}</h1><CorePill tone={view.status === "approved" ? "success" : view.status === "blocked" ? "danger" : "warning"}>{view.status.toUpperCase()}</CorePill></div>
          <p className="mt-2 text-[11px] text-tv-ink">{view.purpose}</p>
          <p className="mt-1 truncate text-[8px] text-tv-slate">Purpose: {view.plan.purpose_spec.decision_to_support} · Requester: {view.requester?.display_name ?? "Product Team"} · Seoul</p>
        </div>
        <dl className="grid w-[205px] shrink-0 grid-cols-[72px_1fr] gap-y-3 rounded-[12px] bg-white p-3 text-[8px]"><dt className="text-tv-slate">만료</dt><dd className="text-right font-bold text-tv-blue-500">{daysLeft || view.ttl_days}일 후</dd><dt className="text-tv-slate">생성</dt><dd className="text-right text-tv-ink">{new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(view.created_at)).replaceAll(". ", ".").replace(/\.$/, "")}</dd></dl>
      </section>

      {approved ? <div className="flex flex-wrap justify-end gap-2"><Button className="h-9 rounded-[10px] text-[10px]" onClick={() => void copyApi()} variant="outline"><Copy className="size-3.5" />API 복사</Button><Button asChild className="h-9 rounded-[10px] text-[10px]"><Link href={`/taskviews/${view.id}/dashboard`}>Dashboard 열기<ExternalLink className="size-3.5" /></Link></Button></div> : <div className="rounded-xl border border-tv-amber-100 bg-tv-amber-50 px-4 py-3 text-[10px] text-tv-amber-700" role="status">{view.status === "blocked" ? "정책 차단을 해결하고 안전한 대안 승인을 받은 뒤 API와 Dashboard가 활성화됩니다." : view.status === "rejected" ? "거절된 Task View에서는 API와 Dashboard를 사용할 수 없습니다." : "Data Owner 승인 후 API와 Dashboard가 활성화됩니다."}</div>}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricTile label="Utility" value={`${view.utility.utility_score} / 100`} tone={view.utility.utility_score >= 70 ? "safe" : "warning"} />
        <MetricTile label="Privacy" value={blockingFindings ? `${blockingFindings} BLOCKED` : "PASS"} tone={blockingFindings ? "danger" : "safe"} />
        <MetricTile label="TTL" value={`${view.ttl_days} days`} tone="primary" />
        <MetricTile label="Sources" value={`${view.plan.selected_sources.length} connected`} tone="primary" />
      </section>

      <div className="grid grid-cols-2 gap-1 rounded-[11px] bg-tv-canvas p-1 sm:flex sm:h-11 sm:items-center sm:gap-2" role="tablist" aria-label="Task View 결과">
        {(["schema", "sql", "api", "dashboard"] as DetailTab[]).map((value) => { const unavailable = !approved && (value === "api" || value === "dashboard"); return <button aria-controls={`taskview-panel-${value}`} aria-selected={tab === value} className={cn("h-9 min-w-0 rounded-lg px-2 text-[10px] font-medium capitalize text-tv-gray transition-colors focus-visible:ring-2 focus-visible:ring-tv-blue-500 sm:min-w-28 sm:px-4", tab === value && "bg-white text-tv-blue-500 shadow-sm")} disabled={unavailable} id={`taskview-tab-${value}`} key={value} onClick={() => setTab(value)} onKeyDown={handleTabKeyDown} role="tab" tabIndex={tab === value ? 0 : -1} title={unavailable ? "승인 후 사용할 수 있습니다." : undefined} type="button">{value === "schema" ? "Schema" : value === "sql" ? "SQL" : value === "api" ? approved ? "API" : "API · 승인 필요" : approved ? "Dashboard" : "Dashboard · 승인 필요"}</button>; })}
      </div>

      <div className="grid min-h-[590px] gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <div className="flex min-w-0 flex-col gap-4">
          <div aria-labelledby="taskview-tab-schema" hidden={tab !== "schema"} id="taskview-panel-schema" role="tabpanel" tabIndex={0}><SchemaPanel artifacts={artifacts} /></div>
          <div aria-labelledby="taskview-tab-sql" hidden={tab !== "sql"} id="taskview-panel-sql" role="tabpanel" tabIndex={0}><SqlPanel sql={artifacts.sql} /></div>
          <div aria-labelledby="taskview-tab-api" hidden={tab !== "api"} id="taskview-panel-api" role="tabpanel" tabIndex={0}><ApiPanel artifacts={artifacts} copyApi={copyApi} /></div>
          <div aria-labelledby="taskview-tab-dashboard" hidden={tab !== "dashboard"} id="taskview-panel-dashboard" role="tabpanel" tabIndex={0}><DashboardPanel artifacts={artifacts} viewId={view.id} /></div>
          <CorePanel className="min-h-[128px] p-4">
            <SectionHeading title="Removed from View" aside={<CorePill tone="danger">Privacy protected</CorePill>} />
            <div className="mt-5 flex flex-wrap gap-2">{artifacts.removed_fields.map((field) => <CorePill key={field} tone="danger">{field}</CorePill>)}</div>
            <p className="mt-5 text-[8px] leading-4 text-tv-gray">직접 식별자와 원문은 SQL/API/Dashboard 어떤 출력에서도 제공되지 않습니다.</p>
          </CorePanel>
        </div>

        <div className="flex min-w-0 flex-col gap-3">
          <CorePanel className="min-h-[332px] p-4">
            <SectionHeading title="Evidence Contract" aside={<CorePill tone={view.evidence ? "primary" : "warning"}>{view.evidence ? "AUDITABLE" : "PENDING"}</CorePill>} />
            <dl className="mt-5 grid grid-cols-[98px_1fr] gap-y-[18px] text-[8px]"><dt className="text-tv-slate">Purpose</dt><dd>{view.evidence?.purpose ?? view.purpose}</dd><dt className="text-tv-slate">Requester</dt><dd>{view.requester?.display_name ?? "—"}</dd><dt className="text-tv-slate">Data Owner</dt><dd>{view.evidence?.approved_by ?? "승인 대기"}</dd><dt className="text-tv-slate">Transformations</dt><dd>{view.plan.transformations.map((item) => item.transformation.toUpperCase()).join(" · ") || "—"}</dd><dt className="text-tv-slate">Utility</dt><dd>{view.utility.utility_score} / 100</dd><dt className="text-tv-slate">Policy</dt><dd>{view.policy_findings.filter((item) => item.severity === "block").length} blocking findings</dd><dt className="text-tv-slate">TTL / Export</dt><dd>{view.ttl_days} days · controlled</dd><dt className="text-tv-slate">Evidence</dt><dd>{view.evidence ? "ISSUED" : "PENDING"}</dd></dl>
          </CorePanel>
          <CorePanel className="min-h-[245px] p-4">
            <SectionHeading title="Source Lineage" description="원본 DB를 직접 공유하지 않고 변환 결과만 연결합니다." />
            <div className="mt-4 space-y-2">
              {(artifacts.source_lineage.length ? artifacts.source_lineage : usingDemoArtifacts ? coreSources.map((source) => ({ source_id: source.key, source_name: source.name, country_flag: source.flag, fields: source.meta.split(" · "), transforms: [], usage: "used" as const })) : []).map((source) => <div className="flex min-h-[47px] items-center gap-2 rounded-xl bg-tv-canvas px-3" key={source.source_id}><CountryFlag code={source.country_flag} /><div className="min-w-0 flex-1"><strong className="block truncate text-[9px] text-tv-ink">{source.source_name}</strong><span className="block truncate text-[8px] text-tv-slate">{source.fields.join(" · ")}</span></div><CorePill tone="safe">USED</CorePill></div>)}
              {!artifacts.source_lineage.length && !usingDemoArtifacts ? <CoreEmpty description="Artifact가 Source Lineage 항목을 반환하지 않았습니다." title="Source Lineage가 없습니다." /> : null}
            </div>
          </CorePanel>
        </div>
      </div>
    </CorePage>
  );
}

function SchemaPanel({ artifacts }: { artifacts: NeedexArtifacts }) {
  return <CorePanel className="min-h-[446px] overflow-hidden"><div className="p-4"><SectionHeading title="생성된 Fields" description="업무에서 직접 사용할 수 있는 구조화된 필드" aside={<CorePill tone="primary">{artifacts.schema_fields.length} fields</CorePill>} /></div><div className="grid h-10 grid-cols-[1.1fr_84px_1.25fr] items-center bg-tv-canvas px-4 text-[8px] font-medium text-tv-slate"><span>FIELD</span><span>TYPE</span><span>SOURCE / TRANSFORM</span></div><div className="divide-y divide-tv-border">{artifacts.schema_fields.slice(0, 7).map((field) => <div className="grid min-h-[48px] grid-cols-[1.1fr_84px_1.25fr] items-center px-4 text-[8px]" key={field.name}><strong className="truncate text-tv-ink">{field.name}</strong><span className="text-tv-gray">{field.data_type}</span><span className="truncate text-tv-gray">{field.source}{field.transform && field.transform !== "SELECT" ? ` → ${field.transform}` : ""}</span></div>)}</div></CorePanel>;
}

function SqlPanel({ sql }: { sql: string }) {
  return <CorePanel className="min-h-[446px] p-4"><SectionHeading title="안전한 SQL Artifact" description="허용된 파생 필드만 조회하는 감사 가능한 SQL입니다." aside={<FileCode2 className="size-5 text-tv-blue-500" />} /><pre className="mt-5 min-h-[330px] overflow-auto rounded-xl bg-[#111827] p-5 text-[11px] leading-6 text-[#e0e7ff]"><code>{sql}</code></pre></CorePanel>;
}

function ApiPanel({ artifacts, copyApi }: { artifacts: NeedexArtifacts; copyApi: () => Promise<void> }) {
  return <CorePanel className="min-h-[446px] p-4"><SectionHeading title="Task View API" description="세션 토큰으로 승인된 최소화 데이터에 접근합니다." aside={<Button className="h-8 rounded-lg text-[10px]" onClick={() => void copyApi()} size="sm" variant="outline"><Copy className="size-3.5" />복사</Button>} /><div className="mt-5 flex items-center gap-3 rounded-xl bg-tv-canvas p-4"><CorePill tone="success">{artifacts.api.method}</CorePill><code className="min-w-0 flex-1 truncate text-[11px] text-tv-ink">{artifacts.api.path}</code></div><dl className="mt-5 grid grid-cols-[120px_1fr] gap-y-4 text-[10px]"><dt className="text-tv-slate">Authentication</dt><dd>{artifacts.api.authentication}</dd><dt className="text-tv-slate">Response fields</dt><dd>{artifacts.api.response_schema.map((field) => field.name).join(", ")}</dd><dt className="text-tv-slate">Privacy</dt><dd>Evidence Contract 범위 밖 필드는 직렬화하지 않습니다.</dd></dl></CorePanel>;
}

function DashboardPanel({ artifacts, viewId }: { artifacts: NeedexArtifacts; viewId: string }) {
  return <CorePanel className="min-h-[446px] p-4"><SectionHeading title="분석 Dashboard Artifact" description="최소화 View의 dimensions와 measures로 구성합니다." aside={<Database className="size-5 text-tv-blue-500" />} /><div className="mt-5 grid gap-4 sm:grid-cols-2"><div className="rounded-xl bg-tv-canvas p-4"><p className="text-[9px] text-tv-slate">DIMENSIONS</p><div className="mt-3 flex flex-wrap gap-2">{artifacts.dashboard.dimensions.map((item) => <CorePill key={item} tone="primary">{item}</CorePill>)}</div></div><div className="rounded-xl bg-tv-canvas p-4"><p className="text-[9px] text-tv-slate">MEASURES</p><div className="mt-3 flex flex-wrap gap-2">{artifacts.dashboard.measures.map((item) => <CorePill key={item} tone="safe">{item}</CorePill>)}</div></div></div><Button asChild className="mt-6 h-11 rounded-[10px]"><Link href={`/taskviews/${viewId}/dashboard`}>Dashboard 열기<ExternalLink className="size-4" /></Link></Button></CorePanel>;
}
