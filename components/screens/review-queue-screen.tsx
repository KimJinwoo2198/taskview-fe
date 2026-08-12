"use client";

import Link from "next/link";

import { useSession } from "@/components/session-provider";
import { EmptyState, ErrorNotice, PageLoading } from "@/components/ui/feedback";
import { ViewRow } from "@/components/ui/view-row";
import { useTaskViews } from "@/hooks/use-task-views";

export function ReviewQueueScreen() {
  const { user } = useSession();
  const { views, loading, error, reload } = useTaskViews();
  const canReview = user.role === "data_owner" || user.role === "admin";
  const proposed = views.filter((view) => view.status === "proposed");
  const approved = views.filter((view) => view.status === "approved").length;
  const policyBlocked = views.filter((view) => view.status === "blocked").length;

  if (!canReview) {
    return <EmptyState eyebrow="OWNER WORKSPACE" title="검토함은 데이터 소유자 전용입니다." description="요청자는 Task Views에서 자신의 승인 상태와 수정 요청을 확인할 수 있습니다." action={<Link className="secondaryLink" href="/taskviews">Task Views로 이동</Link>} />;
  }

  return (
    <div className="pageStack">
      <header className="pageHeader">
        <div><p className="kicker">OWNER INBOX</p><h1>검토함</h1><p>결정이 필요한 항목만 모아 한 건씩 안전하게 검토합니다.</p></div>
      </header>

      {error && <ErrorNotice message={error} onClose={() => void reload()} />}
      {loading ? <PageLoading /> : (
        <>
          <section className="queueSummary" aria-label="검토 현황">
            <article className="queuePrimary"><span>결정 필요</span><strong>{proposed.length}</strong><small>승인 대기 요청</small></article>
            <article><span>승인 완료</span><strong>{approved}</strong><small>Evidence 발급</small></article>
            <article><span>정책 차단</span><strong>{policyBlocked}</strong><small>요청자 조치 필요</small></article>
          </section>

          <section className="contentSection listSection">
            <div className="sectionHeader"><div><p className="kicker">NEEDS YOUR DECISION</p><h2>승인 대기</h2></div><span className="countPill">{proposed.length}건</span></div>
            {proposed.length ? <><div className="listColumns" aria-hidden="true"><span>View / 목적</span><span>사용 조직</span><span>효용</span><span>상태</span><span>생성일</span><span /></div><div className="viewList">{proposed.map((view) => <ViewRow key={view.id} showRequester view={view} />)}</div></> : <EmptyState eyebrow="INBOX ZERO" title="처리할 요청이 없습니다." description="새 승인 요청이 들어오면 이 목록에 표시됩니다." />}
          </section>
        </>
      )}
    </div>
  );
}
