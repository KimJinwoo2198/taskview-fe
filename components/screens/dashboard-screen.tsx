"use client";

import Link from "next/link";

import { useSession } from "@/components/session-provider";
import { EmptyState, ErrorNotice, PageLoading } from "@/components/ui/feedback";
import { ViewRow } from "@/components/ui/view-row";
import { useTaskViews } from "@/hooks/use-task-views";

export function DashboardScreen() {
  const { user } = useSession();
  const { views, loading, error, reload } = useTaskViews();
  const canReview = user.role === "data_owner" || user.role === "admin";
  const proposed = views.filter((view) => view.status === "proposed").length;
  const approved = views.filter((view) => view.status === "approved").length;
  const attention = views.filter((view) => view.status === "blocked" || view.status === "rejected").length;
  const recent = views.slice(0, 4);

  return (
    <div className="pageStack">
      <header className="pageHeader dashboardHeader">
        <div>
          <p className="kicker">WORKSPACE OVERVIEW</p>
          <h1>{user.display_name}님, 오늘의 데이터 결정을 시작하세요.</h1>
          <p>목적을 작성하면 로컬 AI가 필요한 필드와 안전한 변환 계획을 제안합니다.</p>
        </div>
        <Link className="primaryLink" href="/taskviews/new">새 Task View <span>→</span></Link>
      </header>

      {error && <ErrorNotice message={error} onClose={() => void reload()} />}
      {loading ? <PageLoading /> : (
        <>
          <section className="metricGrid" aria-label="Task View 현황">
            <article><p>전체 Views</p><strong>{views.length}</strong><small>내 워크스페이스</small></article>
            <article><p>{canReview ? "검토 대기" : "승인 대기"}</p><strong>{proposed}</strong><small>{canReview ? "내 결정 필요" : "소유자 검토 중"}</small></article>
            <article><p>승인 완료</p><strong>{approved}</strong><small>Evidence 발급</small></article>
            <article className={attention ? "needsAttention" : ""}><p>조치 필요</p><strong>{attention}</strong><small>차단 또는 수정</small></article>
          </section>

          <section className="dashboardGrid">
            <article className="nextActionCard">
              <p className="kicker">NEXT BEST ACTION</p>
              <div className="actionGlyph" aria-hidden="true">{canReview && proposed ? "✓" : "+"}</div>
              <h2>{canReview && proposed ? `${proposed}건의 요청을 검토해 주세요.` : "새로운 업무 목적을 설명해 보세요."}</h2>
              <p>{canReview && proposed ? "목적, 최소화 범위, 정책 검사 결과를 한 항목씩 확인할 수 있습니다." : "원본 필드 대신 내려는 결정을 적으면 Agent가 안전한 View 초안을 만듭니다."}</p>
              <Link className="darkLink" href={canReview && proposed ? "/reviews" : "/taskviews/new"}>{canReview && proposed ? "검토함 열기" : "새 요청 시작"}<span>↗</span></Link>
            </article>
            <article className="workflowCard">
              <p className="kicker">HOW IT MOVES</p>
              <h2>한 View가 만들어지는 과정</h2>
              <ol className="workflowSteps">
                <li><span>01</span><div><strong>목적 작성</strong><small>결정과 사용 조직 정의</small></div></li>
                <li><span>02</span><div><strong>Agent 컴파일</strong><small>필드 선택·변환·정책 검사</small></div></li>
                <li><span>03</span><div><strong>소유자 승인</strong><small>최소 범위와 위험 검토</small></div></li>
                <li><span>04</span><div><strong>Evidence 발급</strong><small>승인 범위와 만료 시점 고정</small></div></li>
              </ol>
            </article>
          </section>

          <section className="contentSection">
            <div className="sectionHeader"><div><p className="kicker">RECENT ACTIVITY</p><h2>최근 Task Views</h2></div>{views.length > 0 && <Link className="textLink" href="/taskviews">전체 보기 →</Link>}</div>
            {recent.length ? <div className="viewList viewListCompact">{recent.map((view) => <ViewRow key={view.id} showRequester={canReview} view={view} />)}</div> : <EmptyState eyebrow="EMPTY WORKSPACE" title="아직 Task View가 없습니다." description="첫 업무 목적을 작성하면 진행 상태가 여기에 모입니다." action={<Link className="secondaryLink" href="/taskviews/new">첫 View 만들기</Link>} />}
          </section>
        </>
      )}
    </div>
  );
}
