"use client";

import { ArrowRight, Database, Plus, Sparkles } from "lucide-react";
import Link from "next/link";

import { useSession } from "@/components/session-provider";
import { Button } from "@/components/ui/button";
import { CountryFlag } from "@/components/taskview/country-flag";
import { isNeedexDemoMode } from "@/lib/demo-mode";

import { useCoreEndpoint } from "./client";
import { coreSources, demoRecentViews, statusCopy, viewName } from "./fixtures";
import type { DashboardPayload } from "./model";
import { CoreEmpty, CoreError, CoreHeading, CorePage, CorePanel, CorePill, DemoNotice, StatusDot } from "./shared";

export function DashboardCore() {
  const { user } = useSession();
  const { data, loading, error, reload } = useCoreEndpoint<DashboardPayload>("/api/dashboard");
  const usingDemo = isNeedexDemoMode && !loading && (Boolean(error) || !data);
  const rows = usingDemo ? demoRecentViews.map((view) => ({ id: view.id, name: viewName(view), purpose: view.purpose, ttl_days: view.ttl_days, status: view.status, requester_name: view.requester?.display_name ?? "Product Team", requester_region: "Seoul", created_at: view.created_at })) : data?.recent_task_views.slice(0, 3) ?? [];
  const active = usingDemo ? 12 : data?.counters.active_task_views ?? 0;
  const pending = usingDemo ? 3 : data?.counters.pending_approvals ?? 0;
  const sources = usingDemo ? coreSources.map((source) => ({ id: source.key, flag: source.flag, name: source.database, description: source.meta, rowCount: 0, officialUrl: null })) : data?.data_sources.map((source) => ({ id: source.id, flag: source.country_flag, name: source.name, description: source.description, rowCount: source.row_count ?? 0, officialUrl: source.official_url ?? null })) ?? [];

  if (error && !usingDemo) return <CoreError message={error} retry={() => void reload()} />;

  return (
    <CorePage className="gap-6 pb-8">
      <CoreHeading
        title={<>안녕하세요, {user.display_name || "Product Team"} 👋</>}
        description="원본 데이터에 접근하지 않고도 필요한 업무용 데이터를 만들 수 있어요."
      />

      {loading ? <div className="h-9 animate-pulse rounded-xl bg-tv-subtle" role="status" aria-label="대시보드 데이터 로딩 중" /> : usingDemo ? <DemoNotice error={error} /> : null}
      {data?.data_origin === "synthetic_demo" ? <div className="rounded-xl border border-tv-amber-200 bg-tv-amber-50 px-4 py-3 text-[10px] font-semibold text-tv-amber-700" role="status">합성 데모 데이터 · 운영 원본 아님</div> : null}

      <section className="grid gap-4 sm:grid-cols-3" aria-label="Task View 핵심 지표">
        <CorePanel className="min-h-28 p-4 xl:h-28">
          <div className="flex items-center gap-2"><p className="text-[11px] text-tv-gray">활성 Task View</p><CorePill className="h-5 px-2" tone="primary"><StatusDot /> </CorePill></div>
          <strong className="mt-3 block text-[26px] leading-8 text-tv-ink">{active}</strong>
        </CorePanel>
        <CorePanel className="min-h-28 p-4 xl:h-28">
          <div className="flex items-center gap-2"><p className="text-[11px] text-tv-gray">승인 대기</p><CorePill className="h-5 px-2" tone="warning"><StatusDot tone="warning" /></CorePill></div>
          <strong className="mt-3 block text-[26px] leading-8 text-tv-ink">{pending}</strong>
        </CorePanel>
        <CorePanel className="min-h-28 p-4 xl:h-28">
          <div className="flex items-center gap-2"><p className="text-[11px] text-tv-gray">연결된 데이터 소스</p><CorePill className="h-5 px-2" tone="safe"><StatusDot tone="safe" /></CorePill></div>
          <strong className="mt-3 block text-[26px] leading-8 text-tv-ink">{usingDemo ? 3 : data?.counters.connected_sources ?? 0}</strong>
        </CorePanel>
      </section>

      <section className="grid min-h-[498px] gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <CorePanel className="flex min-h-[498px] flex-col overflow-hidden">
          <div className="flex h-[68px] items-center justify-between px-5">
            <h2 className="text-[16px] font-bold text-tv-ink">최근 Task View</h2>
            <Link className="inline-flex items-center gap-1 text-[10px] font-medium text-tv-blue-500 hover:underline" href="/taskviews">전체 보기 <ArrowRight className="size-3" /></Link>
          </div>
          <div className="grid h-10 grid-cols-[1.35fr_1fr_84px] items-center bg-tv-canvas px-5 text-[9px] font-medium text-tv-slate"><span>TASK VIEW</span><span>PURPOSE / TTL</span><span>STATUS</span></div>
          {rows.length ? <div className="divide-y divide-tv-border">
            {rows.map((view) => (
              <Link className="grid min-h-[81px] grid-cols-[1.35fr_1fr_84px] items-center gap-3 px-5 transition-colors hover:bg-tv-canvas" href={`/taskviews/${view.id}`} key={view.id}>
                <div className="min-w-0"><strong className="block truncate text-[11px] text-tv-ink">{view.name}</strong><span className="mt-0.5 block text-[9px] text-tv-slate">{view.requester_name} · {view.requester_region}</span></div>
                <span className="truncate text-[10px] text-tv-slate-dark">{view.purpose.replace(/하고 싶습니다?\.?$/, "")} · {view.ttl_days}일</span>
                <CorePill tone={view.status === "approved" ? "primary" : view.status === "proposed" ? "warning" : "danger"}>{statusCopy(view.status)}</CorePill>
              </Link>
            ))}
          </div> : <CoreEmpty description="업무 목적을 입력하면 최근 Task View가 이곳에 표시됩니다." title="아직 Task View가 없습니다." />}
          <div className="mx-0 mt-auto flex min-h-[50px] items-center gap-2 rounded-b-[15px] bg-tv-blue-50 px-4 text-[9px] leading-4 text-tv-blue-700">
            <Sparkles className="size-4 shrink-0" />
            <p><strong className="block">업무에 필요한 의미만 남겨요</strong><span>이름·전화번호·상세주소·상담 원문은 기본적으로 Task View에서 제외됩니다.</span></p>
          </div>
        </CorePanel>

        <CorePanel className="flex min-h-[498px] flex-col overflow-hidden">
          <div className="px-5 pb-3 pt-5"><h2 className="text-[16px] font-bold text-tv-ink">데이터 소스</h2><p className="mt-1 text-[9px] text-tv-slate">Borderless workspace</p></div>
          <div className="divide-y divide-tv-border">
            {sources.map((source) => (
              <div className="flex min-h-[74px] items-center gap-3 px-5" key={source.id}>
                <CountryFlag code={source.flag} size="md" />
                <div className="min-w-0 flex-1"><strong className="block truncate text-[10px] text-tv-ink">{source.name}</strong><span className="block truncate text-[9px] text-tv-slate">{source.description}</span></div>
                <CorePill tone="safe">PUBLIC LIVE</CorePill>
              </div>
            ))}
            {!sources.length && !loading ? <CoreEmpty description="데이터 소스를 연결하면 이곳에 표시됩니다." title="연결된 데이터 소스가 없습니다." /> : null}
          </div>
          <div className="mt-auto bg-tv-canvas p-4">
            <div className="flex items-center gap-2"><Database className="size-4 text-tv-blue-500" /><strong className="text-[11px] text-tv-ink">Privacy Firewall</strong></div>
            <p className="mt-1 text-[9px] text-tv-gray">{data?.privacy_firewall.denied_data.join(" · ") || "직접 식별자 · 원문 · 상세주소"}</p>
            <div className="mt-3 flex flex-wrap gap-2"><CorePill tone="danger">기본 {(data?.privacy_firewall.default_action ?? "deny").toUpperCase()}</CorePill><CorePill tone="primary">TTL ≤ {data?.privacy_firewall.max_ttl_days ?? 7}일</CorePill></div>
          </div>
        </CorePanel>
      </section>

      {error ? <Button className="self-start" onClick={() => void reload()} size="sm" variant="outline">다시 불러오기</Button> : null}
    </CorePage>
  );
}
