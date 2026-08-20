"use client";

import { ArrowLeft, ArrowRight, Check, Sparkles } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { CountryFlag } from "@/components/taskview/country-flag";

import { useCoreEndpoint, useCoreNeedex } from "./client";
import { coreSources } from "./fixtures";
import { CoreEmpty, CoreError, CoreHeading, CorePage, CorePanel, CorePill, CoreStepper, DemoNotice, FieldTag, FooterActions, SectionHeading } from "./shared";
import type { CoreTone, DiscoveryDecision, DiscoveryResponse } from "./model";

const discoveryFields = {
  product: [
    { name: "dropoff_step", decision: "필요", tone: "safe" },
    { name: "os_version", decision: "필요", tone: "safe" },
    { name: "signup_channel", decision: "후보", tone: "warning" },
  ],
  operations: [
    { name: "device", decision: "필요", tone: "safe" },
    { name: "exact_address", decision: "일반화", tone: "safe" },
    { name: "birth_date", decision: "버킷", tone: "safe" },
  ],
  voc: [
    { name: "ticket_text", decision: "카테고리 추출", tone: "safe" },
    { name: "customer_name", decision: "제외", tone: "danger" },
    { name: "phone / email", decision: "제외", tone: "danger" },
  ],
} satisfies Record<string, Array<{ name: string; decision: string; tone: CoreTone }>>;

const fieldLabels: Record<string, string> = {
  dropoff_step: "중단 단계", os_version: "운영체제 버전", signup_channel: "가입 경로",
  device: "기기 종류", exact_address: "지역", birth_date: "연령대", ticket_text: "문의 주제",
  customer_name: "고객 이름", phone: "전화번호", email: "이메일", created_date: "접수일",
  borough: "자치구", agency: "담당 기관", complaint_type: "민원 유형", manufacturer: "제조사",
  model_year: "연식", component: "문제 부위", crash: "사고 여부", fire: "화재 여부",
};

function friendlyFieldName(name: string) {
  return name.split(" / ").map((part) => fieldLabels[part] ?? part.replaceAll("_", " ")).join(" / ");
}

export function DiscoveryCore({ viewId }: { viewId: string }) {
  const { view, loading, error, isFallback, reload } = useCoreNeedex(viewId);
  const discovery = useCoreEndpoint<DiscoveryResponse>(viewId === "demo" ? null : `/api/taskviews/${encodeURIComponent(viewId)}/discovery`);
  if (loading || discovery.loading) return <div className="tv-page"><DiscoverySkeleton /></div>;
  if (error && !isFallback) return <CoreError message={error} retry={() => void reload()} />;
  if (discovery.error && !isFallback) return <CoreError message={discovery.error} retry={() => void discovery.reload()} />;
  const sourceCards = discovery.data?.sources.map((source) => ({
    key: source.source_key,
    name: source.source_name,
    flag: source.country_flag,
    dataset: source.dataset,
    description: source.reason,
    fields: source.fields.map((field) => ({ name: field.name, decision: decisionLabel(field.decision), tone: decisionTone(field.decision) })),
  })) ?? (isFallback ? coreSources.map((source) => ({
    key: source.key,
    name: source.name,
    flag: source.flag,
    dataset: source.key === "product" ? "Product DB · signup_events" : source.key === "operations" ? "Operations DB · user_context" : "CS DB · tickets_jp",
    description: source.description,
    fields: discoveryFields[source.key],
  })) : []);

  return (
    <CorePage className="gap-5 pb-8">
      <CoreHeading title="업무에 맞는 데이터를 찾았어요" description="요청하신 일과 관련된 데이터만 골랐습니다. 포함하거나 제외할 내용을 확인해 주세요." />
      <CoreStepper current={1} />

      <section className="flex min-h-[84px] flex-col justify-center gap-2 rounded-[16px] border border-tv-blue-200 bg-tv-blue-50 px-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2"><CorePill tone="primary">요청 내용</CorePill><strong className="truncate text-[12px] text-tv-ink">{view.purpose}</strong></div>
          <p className="ml-[75px] mt-1 text-[9px] text-tv-gray">사용 가능 기간 {view.ttl_days}일</p>
        </div>
        <CorePill className="px-6" tone="safe">관련 데이터 {discovery.data?.sources.length ?? view.plan.selected_sources.length ?? 3}곳</CorePill>
      </section>

      {isFallback ? <DemoNotice error={error ?? discovery.error} /> : null}

      <div className="grid min-h-[566px] gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <CorePanel className="p-4">
          <SectionHeading title="찾은 데이터" description="요청한 업무에 도움이 되는 항목과 개인정보 보호를 위해 바꿀 항목을 보여드립니다." />
          {sourceCards.length ? <div className="mt-4 space-y-3">
            {sourceCards.map((source) => (
              <article className="rounded-[12px] bg-tv-canvas p-3" key={source.key}>
                <div className="flex items-center gap-2">
                  <CountryFlag code={source.flag} />
                  <div className="min-w-0 flex-1"><strong className="block text-[11px] text-tv-ink">{source.name}</strong><span className="block text-[8px] text-tv-slate">{source.dataset}</span></div>
                  <CorePill tone="safe">사용 가능</CorePill>
                </div>
                <p className="mt-2 text-[9px] leading-4 text-tv-gray">{source.description}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {source.fields.map((field) => <FieldTag className="gap-2" key={field.name}>{friendlyFieldName(field.name)}<span className={field.tone === "danger" ? "text-tv-red-600" : field.tone === "warning" ? "text-tv-amber-700" : "text-tv-teal-700"}>{field.decision}</span></FieldTag>)}
                </div>
              </article>
            ))}
          </div> : <CoreEmpty description="현재 Purpose와 연결되는 Catalog 필드가 발견되지 않았습니다. 목적이나 연결된 데이터 소스를 확인해 주세요." title="탐색된 데이터가 없습니다." />}
        </CorePanel>

        <CorePanel className="flex flex-col p-4">
          <div className="flex items-center justify-between"><h2 className="text-[16px] font-bold text-tv-ink">왜 이 데이터를 골랐나요?</h2><CorePill tone="primary">AI 추천</CorePill></div>
          <div className="mt-4 rounded-xl bg-tv-canvas p-3">
            <div className="flex items-center justify-between"><strong className="text-[10px] text-tv-ink">관련 데이터 확인 완료</strong><CorePill className="h-5" tone="success">완료</CorePill></div>
            <p className="mt-1 text-[8px] text-tv-slate">데이터 {sourceCards.length}곳 · 항목 {discovery.data?.reviewed_field_count ?? 11}개 확인 · 사용할 항목 {discovery.data?.candidate_field_count ?? 7}개</p>
          </div>
          <h3 className="mt-4 text-[11px] font-bold text-tv-ink">선택 기준</h3>
          <div className="mt-2 space-y-2">
            <Criterion title="요청과 관련됨" detail="하려는 일에 직접 도움이 되는 정보인지 확인했습니다." />
            <Criterion title="꼭 필요한 범위" detail="필요 이상으로 자세한 정보는 제외했습니다." />
            <Criterion title="개인정보 최소화" detail="개인을 알아보기 어려운 범위로 바꿀 수 있는지 확인했습니다." />
          </div>
          <div className="mt-4 rounded-xl bg-tv-red-50 p-3 text-tv-red-700">
            <strong className="text-[10px]">민감 필드는 아직 View에 포함되지 않아요</strong>
            <p className="mt-1 text-[8px] leading-4">이름·전화번호·상세주소·상담 원문은 자동으로 제외하거나 넓은 범위로 바꿉니다.</p>
          </div>
          <div className="mt-auto flex items-start gap-2 rounded-xl bg-tv-blue-50 p-3 text-tv-blue-700"><Sparkles className="mt-0.5 size-4 shrink-0" /><p className="text-[9px] leading-4">AI가 관련 항목을 추천하고, 정해진 개인정보 보호 규칙이 실제 포함 범위를 결정합니다.</p></div>
        </CorePanel>
      </div>

      <FooterActions note="다음 단계에서 어떤 항목을 제외하거나 바꾸는지 확인할 수 있습니다.">
        <Button asChild className="h-11 rounded-[10px]" variant="outline"><Link href={`/taskviews/new?edit=${encodeURIComponent(view.id)}`}><ArrowLeft className="size-4" />목적 수정</Link></Button>
        {sourceCards.length ? <Button asChild className="h-11 min-w-32 rounded-[10px]"><Link href={`/taskviews/${view.id}/validation`}>개인정보 확인하기<ArrowRight className="size-4" /></Link></Button> : <Button className="h-11 min-w-32 rounded-[10px]" disabled>확인할 데이터 없음</Button>}
      </FooterActions>
    </CorePage>
  );
}

function decisionLabel(decision: DiscoveryDecision) {
  return ({ required: "사용", candidate: "검토", generalize: "넓은 지역으로 변경", bucket: "구간으로 묶음", extract: "주제만 사용", drop: "제외" } as const)[decision];
}

function decisionTone(decision: DiscoveryDecision): CoreTone {
  if (decision === "drop") return "danger";
  if (decision === "candidate") return "warning";
  return "safe";
}

function Criterion({ title, detail }: { title: string; detail: string }) {
  return <div className="flex items-center gap-3 rounded-xl bg-tv-canvas p-3"><span className="grid size-6 place-items-center rounded-full bg-tv-green-50 text-tv-green-700"><Check className="size-3.5" /></span><div><strong className="block text-[9px] text-tv-ink">{title}</strong><span className="text-[8px] text-tv-gray">{detail}</span></div></div>;
}

function DiscoverySkeleton() {
  return <div className="space-y-4" role="status" aria-label="데이터 탐색 결과 로딩 중"><div className="h-14 animate-pulse rounded-xl bg-tv-subtle" /><div className="h-14 animate-pulse rounded-xl bg-tv-subtle" /><div className="h-[566px] animate-pulse rounded-2xl bg-tv-subtle" /></div>;
}
