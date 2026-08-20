"use client";

import { ArrowLeft, ArrowRight, Check, FileCheck2 } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

import { useCoreEndpoint, useCoreNeedex } from "./client";
import { CoreEmpty, CoreError, CoreHeading, CorePage, CorePanel, CorePill, DemoNotice, FooterActions, SectionHeading } from "./shared";
import type { ApprovalStatusResponse, CoreTone } from "./model";

export function ApprovalPendingCore({ viewId }: { viewId: string }) {
  const { view, loading, error, isFallback, reload } = useCoreNeedex(viewId);
  const approval = useCoreEndpoint<ApprovalStatusResponse>(viewId === "demo" ? null : `/api/taskviews/${encodeURIComponent(viewId)}/approval-status`);
  if (loading || approval.loading) return <div className="tv-page"><div className="h-[760px] animate-pulse rounded-2xl bg-tv-subtle" role="status" aria-label="승인 진행 상태 로딩 중" /></div>;
  if (error && !isFallback) return <CoreError message={error} retry={() => void reload()} />;
  if (approval.error && !isFallback) return <CoreError message={approval.error} retry={() => void approval.reload()} />;
  const completed = approval.data ? approval.data.state === "approved" : !isFallback && view.status === "approved";

  const fallbackTimeline: Array<{ index: number; org: string; task: string; meta: string; status: string; tone: CoreTone }> = [
    { index: 1, org: "Seoul Product", task: "요청자 확인", meta: "Product Team · Seoul", status: "완료", tone: "success" },
    { index: 2, org: "Tokyo Operations", task: "고위험 변환 검토", meta: "exact_address · precise age", status: completed ? "완료" : "검토 필요", tone: completed ? "success" : "warning" },
    { index: 3, org: "HCMC CS", task: "상담 원문 정책 검토", meta: "raw_ticket_text", status: completed ? "완료" : "대기", tone: completed ? "success" : "neutral" },
    { index: 4, org: "Needex", task: "최종 View 발급", meta: "모든 승인 완료 후 자동 생성", status: completed ? "발급 완료" : "대기", tone: completed ? "success" : "neutral" },
  ];
  const timeline = approval.data?.timeline.map((item, index) => ({ index: index + 1, org: item.organization, task: item.title, meta: item.affected_fields.length ? item.affected_fields.join(" · ") : item.detail, status: approvalStatusLabel(item.status), tone: approvalStatusTone(item.status) })) ?? (isFallback ? fallbackTimeline : []);
  const queuePosition = approval.data?.queue_position ?? (isFallback ? 1 : 0);
  const queueTotal = approval.data?.queue_total ?? (isFallback ? 3 : 0);

  return (
    <CorePage className="gap-5 pb-8">
      <CoreHeading title={completed ? "검토가 완료되었어요" : "검토를 요청했어요"} description={completed ? "안전한 분석 데이터가 준비되어 바로 사용할 수 있습니다." : "민감한 항목은 데이터 담당자가 마지막으로 확인합니다. 확인 전에는 데이터를 사용할 수 없습니다."} />

      <section className="flex min-h-[140px] items-center gap-5 rounded-[18px] border border-tv-blue-200 bg-tv-blue-50 px-5">
        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-tv-green-50 text-tv-green-700">{completed ? <FileCheck2 className="size-6" /> : <Check className="size-6" />}</span>
        <div className="min-w-0 flex-1"><h2 className="truncate text-[20px] font-bold text-tv-ink">REQ-{view.id === "demo" ? "024" : view.id.slice(0, 4).toUpperCase()} · {completed ? "분석 데이터 준비 완료" : "담당자 확인 대기 중"}</h2><p className="mt-2 text-[10px] text-tv-gray">관련 데이터 담당자에게 요청 내용과 개인정보 처리 방법을 전달했습니다.</p><CorePill className="mt-3" tone="primary">검토 상태를 자동으로 알려드려요</CorePill></div>
        <CorePill className="self-start mt-5" tone="neutral">대기 {queuePosition} / {queueTotal}</CorePill>
      </section>

      {isFallback ? <DemoNotice error={error ?? approval.error} /> : null}

      <div className="grid min-h-[552px] gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <CorePanel className="p-4">
          <SectionHeading title="승인 진행 상황" description="조직별 데이터 소유자의 검토 상태를 한눈에 확인합니다." />
          {timeline.length ? <ol className="mt-4 space-y-2">
            {timeline.map((item, index) => (
              <li className="relative" key={item.index}>
                <div className="flex min-h-[72px] items-center gap-3 rounded-xl bg-tv-canvas px-3">
                  <span className="grid size-7 shrink-0 place-items-center rounded-full border border-tv-border bg-white text-[10px] font-bold text-tv-slate-dark">{item.index}</span>
                  <div className="min-w-0 flex-1"><strong className="block text-[11px] text-tv-ink">{item.org}</strong><span className="block text-[9px] text-tv-slate-dark">{item.task}</span><span className="block text-[8px] text-tv-slate">{item.meta}</span></div>
                  <CorePill tone={item.tone}>{item.status}</CorePill>
                </div>
                {index < timeline.length - 1 ? <span aria-hidden="true" className="absolute -bottom-2 left-[25px] z-10 text-[12px] text-tv-slate">↓</span> : null}
              </li>
            ))}
          </ol> : <CoreEmpty description="승인 요청을 제출하면 조직별 검토 상태가 표시됩니다." title="승인 진행 내역이 없습니다." />}
        </CorePanel>

        <CorePanel className="flex flex-col p-4">
          <SectionHeading title="요청 요약" aside={<CorePill tone="danger">담당자 확인 필요</CorePill>} />
          <dl className="mt-5 grid grid-cols-[76px_1fr] gap-y-5 text-[9px]"><dt className="text-tv-slate">요청 내용</dt><dd className="font-medium text-tv-ink">{view.purpose}</dd><dt className="text-tv-slate">요청자</dt><dd className="font-medium text-tv-ink">{view.requester?.display_name ?? "업무 담당자"}</dd><dt className="text-tv-slate">사용 기간</dt><dd className="font-medium text-tv-ink">{view.ttl_days}일</dd><dt className="text-tv-slate">데이터</dt><dd className="font-medium text-tv-ink">{view.plan.selected_sources.length}곳</dd></dl>
          <div className="mt-6 rounded-xl bg-tv-red-50 p-3 text-tv-red-700"><strong className="text-[10px]">담당자 확인이 필요한 이유</strong><p className="mt-1 text-[8px] leading-4">상세 정보의 범위를 넓히거나 상담 원문에서 주제만 추출하는 과정이 있어 최종 확인이 필요합니다.</p></div>
          <div className="mt-auto rounded-xl bg-tv-blue-50 p-3 text-tv-blue-700"><strong className="flex items-center gap-1.5 text-[10px]"><FileCheck2 className="size-3.5" />검토 기록 준비 완료</strong><p className="mt-1 text-[8px] leading-4">요청 내용, 사용 데이터, 처리 방법, 개인정보 확인, 사용 기간을 한곳에 기록했습니다.</p><Link className="mt-2 inline-flex items-center gap-1 text-[9px] font-semibold hover:underline" href={`/taskviews/${view.id}`}>자세히 보기 <ArrowRight className="size-3" /></Link></div>
        </CorePanel>
      </div>

      <FooterActions note={approval.data?.estimated_response_minutes ? `예상 응답 시간은 약 ${approval.data.estimated_response_minutes}분이며 승인 상태 API에서 갱신됩니다.` : "조직별 승인 상태와 Evidence 준비 여부를 안전하게 확인합니다."}>
        <Button asChild className="h-11 rounded-[10px]" variant="outline"><Link href={`/taskviews/${view.id}/validation`}><ArrowLeft className="size-4" />검증 보기</Link></Button>
        {completed ? <Button asChild className="h-11 rounded-[10px]"><Link href={`/taskviews/${view.id}`}>Task View 열기<ArrowRight className="size-4" /></Link></Button> : <Button asChild className="h-11 rounded-[10px]"><Link href={`/reviews/${view.id}`}>승인 화면 열기<ArrowRight className="size-4" /></Link></Button>}
      </FooterActions>
    </CorePage>
  );
}

function approvalStatusLabel(status: ApprovalStatusResponse["timeline"][number]["status"]) {
  return ({ complete: "완료", review_required: "검토 필요", waiting: "대기", issued: "발급 완료", rejected: "거절" } as const)[status];
}

function approvalStatusTone(status: ApprovalStatusResponse["timeline"][number]["status"]): CoreTone {
  if (status === "complete" || status === "issued") return "success";
  if (status === "review_required") return "warning";
  if (status === "rejected") return "danger";
  return "neutral";
}
