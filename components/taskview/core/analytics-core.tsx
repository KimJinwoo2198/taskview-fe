"use client";

import { ArrowRight, Check, Copy, Download } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { isNeedexDemoMode } from "@/lib/demo-mode";

import { useCoreNeedex } from "./client";
import type { MaterializedData } from "./model";
import { CoreEmpty, CoreError, CoreHeading, CorePage, CorePanel, CorePill, DemoNotice, FieldTag, SectionHeading } from "./shared";

const metrics = new Set(["case_count", "avg_resolution_hours", "crash_count", "fire_count", "injury_count", "death_count"]);

export function AnalyticsCore({ viewId, initialData, dataError }: { viewId: string; initialData?: MaterializedData | null; dataError?: string | null }) {
  const { view, loading, error, isFallback, reload } = useCoreNeedex(viewId);
  const [dimensionFilter, setDimensionFilter] = useState("all");
  const [downloading, setDownloading] = useState(false);
  const rows = initialData ? initialData.rows : isNeedexDemoMode ? view.preview_rows : [];
  const columns = initialData?.columns ?? view.plan.preview_columns;
  const dimensions = columns.filter((column) => !metrics.has(column));
  const filterField = dimensions.find((column) => ["region", "region_group", "manufacturer", "agency"].includes(column)) ?? dimensions[0];
  const filterOptions = useMemo(() => filterField ? [...new Set(rows.map((row) => String(row[filterField] ?? "")).filter(Boolean))].sort().slice(0, 20) : [], [filterField, rows]);
  const filtered = useMemo(() => rows.filter((row) => dimensionFilter === "all" || String(row[filterField] ?? "") === dimensionFilter), [dimensionFilter, filterField, rows]);
  const chartField = dimensions.find((column) => ["complaint_type", "issue_type", "component", "agency"].includes(column)) ?? dimensions[0];
  const chart = useMemo(() => buildChart(filtered, chartField), [chartField, filtered]);
  const recordCount = filtered.reduce((sum, row) => sum + Number(row.case_count ?? 1), 0);
  const safeQuestions = dimensions.slice(0, 4).map((field) => `${field}별 상위 패턴과 업무 우선순위는 무엇인가?`);
  if (loading) return <div className="tv-page"><div className="h-[820px] animate-pulse rounded-2xl bg-tv-subtle" role="status" aria-label="분석 Dashboard 로딩 중" /></div>;
  if (error && !isFallback) return <CoreError message={error} retry={() => void reload()} />;
  if (dataError && !isNeedexDemoMode) return <CoreError message={dataError} />;
  const isMock = !initialData;
  const isSyntheticDemo = initialData?.data_origin === "synthetic_demo";
  const isDemoData = isMock || isSyntheticDemo;

  async function copyApi() {
    await navigator.clipboard.writeText(`/v1/taskviews/${view.id}/data`);
    toast.success("API 경로를 복사했습니다.");
  }

  async function downloadCsv() {
    if (isMock || downloading) return;
    setDownloading(true);
    try {
      const query = new URLSearchParams();
      if (filterField && dimensionFilter !== "all") {
        query.set("filter_field", filterField);
        query.set("filter_value", dimensionFilter);
      }
      const suffix = query.size ? `?${query.toString()}` : "";
      const response = await fetch(`/api/taskviews/${encodeURIComponent(view.id)}/export${suffix}`, { cache: "no-store" });
      if (!response.ok) {
        const payload = await response.json().catch(() => null) as { detail?: string } | null;
        throw new Error(payload?.detail ?? "CSV 파일을 만들지 못했습니다.");
      }
      const blob = await response.blob();
      const disposition = response.headers.get("content-disposition") ?? "";
      const filename = disposition.match(/filename="?([^";]+)"?/i)?.[1] ?? `taskview-${view.id}.csv`;
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(url);
      toast.success(dimensionFilter === "all" ? "전체 데이터를 내려받았습니다." : "선택한 필터의 데이터를 내려받았습니다.");
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "CSV 다운로드에 실패했습니다.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <CorePage className="gap-5 pb-8">
      <CoreHeading title={view.plan.purpose_spec.decision_to_support || view.purpose} description="Task View에 포함된 최소 필드만으로 분석하는 화면입니다." aside={<div className="text-right"><CorePill tone="primary">{isDemoData ? "DEMO · SYNTHETIC PREVIEW" : "LIVE · MATERIALIZED VIEW"}</CorePill><p className="mt-2 text-[8px] text-tv-slate">{isDemoData ? "합성 데모 데이터 · 운영 원본 아님" : "승인된 최소화 데이터"}</p></div>} />

      {isSyntheticDemo ? <div className="rounded-xl border border-tv-amber-200 bg-tv-amber-50 px-4 py-3 text-[10px] font-semibold text-tv-amber-700" role="status">합성 데모 데이터 · 운영 원본 아님</div> : null}

      {isFallback || isMock ? <DemoNotice error={error ?? dataError} /> : null}

      <section className="flex min-h-14 flex-wrap items-center gap-2 rounded-xl bg-tv-canvas px-3">
        {filterField ? <Filter label={filterField} value={dimensionFilter} onChange={setDimensionFilter} width="w-[180px]" options={[{ value: "all", label: `전체 ${filterField}` }, ...filterOptions.map((value) => ({ value, label: value }))]} /> : null}
        <CorePill tone="primary">OFFICIAL PUBLIC SNAPSHOT</CorePill>
        <Button className="ml-auto h-9 rounded-[10px] px-4 text-[10px]" disabled={isMock || downloading} onClick={() => void downloadCsv()} variant="outline"><Download className="size-3.5" />{downloading ? "CSV 준비 중…" : dimensionFilter === "all" ? "CSV 다운로드" : "필터 결과 다운로드"}</Button>
        <CorePill className="px-5" tone="success">Privacy-safe View</CorePill>
      </section>

      <section className="grid min-h-[106px] gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AnalyticsMetric label="분석 가능 레코드" value={isMock ? "UI MOCK" : recordCount.toLocaleString("ko-KR")} meta={`${filtered.length.toLocaleString("ko-KR")}개 안전 그룹`} />
        <AnalyticsMetric label="직접 식별자 노출" value="0" meta="name · phone · email 제거" safe />
        <AnalyticsMetric label="Utility 상태" value="기준 충족" meta="Top-k insight 검증" />
        <AnalyticsMetric label="남은 TTL" value={`${view.ttl_days} days`} meta="만료 후 자동 폐기" />
      </section>

      <section className="grid min-h-[350px] gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <CorePanel className="p-4">
          <SectionHeading title={`${chartField ?? "Task View"} 인사이트`} description={`${dimensions.join(" · ")} 기반`} aside={<CorePill tone="warning">{isMock ? "UI MOCK DATA" : `${recordCount.toLocaleString("ko-KR")} RECORDS`}</CorePill>} />
          {chart.length ? <div className="mt-5 space-y-5 rounded-xl bg-tv-canvas p-4">
            {chart.map((item, index) => <div className="grid grid-cols-[115px_1fr] items-center gap-3" key={item.label}><span className="truncate text-[9px] text-tv-ink">{item.label}</span><div className="h-2 overflow-hidden rounded-full bg-tv-border"><div className={index === 0 ? "h-full rounded-full bg-tv-blue-500" : index === 1 ? "h-full rounded-full bg-tv-blue-400" : index === 2 ? "h-full rounded-full bg-tv-blue-300" : "h-full rounded-full bg-tv-blue-200"} style={{ width: `${item.percent}%` }} /></div></div>)}
          </div> : <CoreEmpty description="선택한 필터 범위에 승인된 레코드가 없습니다." title="분석할 데이터가 없습니다." />}
          <p className="mt-3 rounded-lg bg-tv-blue-50 px-3 py-2 text-[8px] text-tv-blue-500">{isMock ? "※ 막대 길이는 UI 배치 확인용이며 실제 발표값이 아닙니다." : "승인된 공식 공개 데이터 안전 스냅샷을 case_count로 가중 집계했습니다."}</p>
        </CorePanel>
        <CorePanel className="p-4"><SectionHeading title="이 View로 답할 수 있는 질문" description="원본 PII 없이도 업무 질문에 답합니다." /><div className="mt-4 space-y-2">{safeQuestions.map((question) => <div className="flex min-h-[52px] items-center gap-3 rounded-xl bg-tv-canvas px-3 text-[9px] text-tv-ink" key={question}><Check className="size-4 shrink-0 text-tv-green-700" />{question}</div>)}</div></CorePanel>
      </section>

      <section className="grid min-h-[226px] gap-4 xl:grid-cols-2">
        <CorePanel className="p-4"><SectionHeading title="분석에 사용된 필드" description="원본이 아니라 Task View의 파생 필드만 사용" /><div className="mt-5 flex flex-wrap gap-2">{columns.map((field, index) => <FieldTag className="border-0" key={field} tone={index % 2 ? "primary" : "safe"}>{field}</FieldTag>)}</div></CorePanel>
        <CorePanel className="p-4"><SectionHeading title="Privacy Guardrail" aside={<CorePill tone="success">ACTIVE</CorePill>} /><dl className="mt-5 grid grid-cols-[145px_1fr] gap-y-5 text-[9px]"><dt>전화번호 / 상세주소 / VIN</dt><dd className="text-tv-green-700">수집 단계에서 제거</dd><dt>민원 원문 / 정확한 좌표</dt><dd className="text-tv-green-700">저장·조회 불가</dd><dt>20건 미만 그룹</dt><dd className="text-tv-blue-500">Materialization에서 제외</dd></dl><div className="mt-5 flex flex-wrap gap-2"><Button asChild className="h-9 rounded-[10px] text-[10px]" variant="secondary"><Link href={`/taskviews/${view.id}/discovery?refine=1`}>안전한 추가 질문<ArrowRight className="size-3.5" /></Link></Button><Button className="h-9 rounded-[10px] text-[10px]" onClick={() => void copyApi()} variant="outline"><Copy className="size-3.5" />API 복사</Button></div></CorePanel>
      </section>
    </CorePage>
  );
}

function Filter({ label, value, onChange, options, width }: { label: string; value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }>; width: string }) {
  return <Select onValueChange={onChange} value={value}><SelectTrigger aria-label={`${label} 필터`} className={`${width} h-8 rounded-[9px] bg-white text-[9px]`}><SelectValue /></SelectTrigger><SelectContent>{options.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select>;
}

function AnalyticsMetric({ label, value, meta, safe }: { label: string; value: string; meta: string; safe?: boolean }) {
  return <CorePanel className="p-4"><p className="text-[9px] text-tv-slate">{label}</p><strong className={`mt-2 block text-[20px] leading-6 ${safe ? "text-tv-green-700" : "text-tv-ink"}`}>{value}</strong><span className="mt-2 block text-[8px] text-tv-slate">{meta}</span></CorePanel>;
}

function buildChart(rows: Array<Record<string, string | number>>, field?: string) {
  if (!rows.length || !field) return [];
  const counts = new Map<string, number>();
  for (const row of rows) {
    const label = String(row[field] ?? "Unknown");
    counts.set(label, (counts.get(label) ?? 0) + Number(row.case_count ?? 1));
  }
  const ranked = [...counts.entries()].sort((left, right) => right[1] - left[1]).slice(0, 6);
  const maximum = ranked[0]?.[1] ?? 1;
  return ranked.map(([label, count]) => ({ label: `${label} · ${count.toLocaleString("ko-KR")}`, percent: Math.max(4, Math.round((count / maximum) * 100)) }));
}
