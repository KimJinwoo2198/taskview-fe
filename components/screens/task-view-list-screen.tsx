"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { useSession } from "@/components/session-provider";
import { EmptyState, ErrorNotice, PageLoading } from "@/components/ui/feedback";
import { ViewRow } from "@/components/ui/view-row";
import { useNeedexs } from "@/hooks/use-task-views";
import { statusLabels } from "@/lib/presentation";
import type { ViewStatus } from "@/lib/types";

type Filter = "all" | ViewStatus;

export function NeedexListScreen() {
  const { user } = useSession();
  const { views, loading, error, reload } = useNeedexs();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const canReview = user.role === "data_owner" || user.role === "admin";

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("ko-KR");
    return views.filter((view) => {
      const matchesStatus = filter === "all" || view.status === filter;
      const haystack = `${view.id} ${view.purpose} ${view.plan.purpose_spec.decision_to_support} ${view.requester?.display_name ?? ""}`.toLocaleLowerCase("ko-KR");
      return matchesStatus && (!normalized || haystack.includes(normalized));
    });
  }, [filter, query, views]);

  const filters: Array<{ value: Filter; label: string }> = [
    { value: "all", label: "전체" },
    ...(["proposed", "approved", "rejected", "blocked"] as ViewStatus[]).map((value) => ({ value, label: statusLabels[value] })),
  ];

  return (
    <div className="pageStack">
      <header className="pageHeader">
        <div><p className="kicker">TASK VIEW LIBRARY</p><h1>Task Views</h1><p>생성한 View의 상태와 Evidence 발급 여부를 한곳에서 추적합니다.</p></div>
        <Link className="primaryLink" href="/taskviews/new">새 Task View <span>→</span></Link>
      </header>

      <section className="filterBar" aria-label="목록 필터">
        <div className="searchField"><span aria-hidden="true">⌕</span><label className="srOnly" htmlFor="view-search">Task View 검색</label><input id="view-search" onChange={(event) => setQuery(event.target.value)} placeholder="목적, 요청자 또는 View ID 검색" type="search" value={query} /></div>
        <div className="filterTabs" role="group" aria-label="상태">
          {filters.map((item) => <button aria-pressed={filter === item.value} className={filter === item.value ? "active" : ""} key={item.value} onClick={() => setFilter(item.value)} type="button">{item.label}<span>{item.value === "all" ? views.length : views.filter((view) => view.status === item.value).length}</span></button>)}
        </div>
      </section>

      {error && <ErrorNotice message={error} onClose={() => void reload()} />}
      {loading ? <PageLoading /> : filtered.length ? (
        <section className="contentSection listSection">
          <div className="listColumns" aria-hidden="true"><span>View / 목적</span><span>사용 조직</span><span>효용</span><span>상태</span><span>생성일</span><span /></div>
          <div className="viewList">{filtered.map((view) => <ViewRow key={view.id} showRequester={canReview} view={view} />)}</div>
        </section>
      ) : <EmptyState eyebrow="NO RESULTS" title={views.length ? "조건에 맞는 View가 없습니다." : "아직 Task View가 없습니다."} description={views.length ? "검색어나 상태 필터를 바꿔 보세요." : "첫 업무 목적을 작성하고 안전한 View를 만들어 보세요."} action={!views.length ? <Link className="secondaryLink" href="/taskviews/new">첫 View 만들기</Link> : undefined} />}
    </div>
  );
}
