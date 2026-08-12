"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { useSession } from "@/components/session-provider";
import { EmptyState, ErrorNotice, PageLoading } from "@/components/ui/feedback";
import { StatusBadge } from "@/components/ui/status-badge";
import { requestJson } from "@/lib/client-api";
import { audienceLabels, formatDate, shortId, sourceLabels } from "@/lib/presentation";
import type { TaskView } from "@/lib/types";

type Tab = "overview" | "policy" | "preview" | "evidence";
type BusyAction = "decision" | "refine" | null;

const tabs: Array<{ value: Tab; label: string }> = [
  { value: "overview", label: "개요" },
  { value: "policy", label: "정책·변환" },
  { value: "preview", label: "데이터 미리보기" },
  { value: "evidence", label: "Evidence" },
];

export function TaskViewDetailScreen({ viewId }: { viewId: string }) {
  const { user } = useSession();
  const [view, setView] = useState<TaskView | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<BusyAction>(null);
  const [error, setError] = useState<string | null>(null);
  const [refinement, setRefinement] = useState("");
  const [reviewReason, setReviewReason] = useState("목적과 최소화 범위를 확인했습니다.");
  const canReview = user.role === "data_owner" || user.role === "admin";

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setView(await requestJson<TaskView>(`/api/taskviews/${encodeURIComponent(viewId)}`));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Task View를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [viewId]);

  useEffect(() => { void load(); }, [load]);

  async function decide(approved: boolean) {
    if (!view) return;
    setBusy("decision");
    setError(null);
    try {
      const nextView = await requestJson<TaskView>(`/api/taskviews/${encodeURIComponent(view.id)}/decision`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ approved, reason: reviewReason.trim() || (approved ? "승인했습니다." : "요청 범위를 다시 조정해 주세요.") }),
      });
      setView(nextView);
      setTab(approved ? "evidence" : "overview");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "검토 결정을 저장하지 못했습니다.");
    } finally {
      setBusy(null);
    }
  }

  async function refine(options?: { instruction: string; ttlDays?: number }) {
    if (!view) return;
    const instruction = options?.instruction ?? refinement.trim();
    if (!instruction) return;
    setBusy("refine");
    setError(null);
    try {
      const nextView = await requestJson<TaskView>(`/api/taskviews/${encodeURIComponent(view.id)}/refine`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ instruction, ttl_days: options?.ttlDays ?? view.ttl_days }),
      });
      setView(nextView);
      setRefinement("");
      setTab("overview");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "보완 요청을 처리하지 못했습니다.");
    } finally {
      setBusy(null);
    }
  }

  if (loading) return <PageLoading label="Task View 설계를 불러오고 있습니다." />;
  if (!view) return <><ErrorNotice message={error ?? "Task View를 찾을 수 없습니다."} /><EmptyState eyebrow="UNAVAILABLE" title="View를 열 수 없습니다." description="접근 권한이나 View ID를 확인해 주세요." action={<Link className="secondaryLink" href="/taskviews">목록으로 돌아가기</Link>} /></>;

  const hasTtlBlock = view.policy_findings.some((finding) => finding.code === "TTL_LIMIT");

  return (
    <div className="detailPage">
      <header className="detailHeader">
        <div className="detailTitleBlock">
          <Link className="backLink" href={canReview ? "/reviews" : "/taskviews"}>← {canReview ? "검토함" : "Task Views"}</Link>
          <div className="detailMeta"><span className="monoMeta">TASK VIEW · {shortId(view.id)}</span><StatusBadge status={view.status} /></div>
          <h1>{view.plan.purpose_spec.decision_to_support}</h1>
          <p>{view.purpose}</p>
          {canReview && view.requester && <div className="requesterChip"><span>{view.requester.display_name.slice(0, 1)}</span><p><strong>{view.requester.display_name}</strong><small>{view.requester.email}</small></p></div>}
        </div>
      </header>

      {error && <ErrorNotice message={error} onClose={() => setError(null)} />}

      <nav className="detailTabs" aria-label="Task View 상세">
        {tabs.map((item) => <button aria-current={tab === item.value ? "page" : undefined} className={tab === item.value ? "active" : ""} key={item.value} onClick={() => setTab(item.value)} type="button">{item.label}{item.value === "policy" && <span>{view.policy_findings.length}</span>}</button>)}
      </nav>

      <div className="detailLayout">
        <section className="detailContent">
          {tab === "overview" && <Overview view={view} />}
          {tab === "policy" && <Policy view={view} />}
          {tab === "preview" && <Preview view={view} />}
          {tab === "evidence" && <Evidence view={view} />}
        </section>

        <aside className="actionRail">
          <section className="railCard">
            <p className="kicker">VIEW SUMMARY</p>
            <dl className="railFacts"><div><dt>상태</dt><dd>{view.status === "approved" ? "Evidence 발급" : "워크플로 진행 중"}</dd></div><div><dt>사용 조직</dt><dd>{audienceLabels[view.audience]}</dd></div><div><dt>유효 기간</dt><dd>{view.ttl_days}일</dd></div><div><dt>생성 시각</dt><dd>{formatDate(view.created_at, true)}</dd></div></dl>
          </section>

          {view.status === "proposed" && canReview && (
            <section className="railCard decisionCard">
              <p className="kicker">OWNER DECISION</p><h2>승인 결정을 남겨 주세요.</h2><p>목적과 미리보기, 정책 검사 결과를 확인한 뒤 처리합니다.</p>
              <label htmlFor="review-reason">검토 메모</label><textarea id="review-reason" onChange={(event) => setReviewReason(event.target.value)} rows={3} value={reviewReason} />
              <div className="decisionActions"><button className="dangerButton" disabled={busy !== null} onClick={() => void decide(false)} type="button">거절</button><button className="approveButton" disabled={busy !== null} onClick={() => void decide(true)} type="button">{busy === "decision" ? "처리 중…" : "승인 및 생성"}</button></div>
            </section>
          )}

          {view.status === "proposed" && !canReview && <section className="railCard pendingRail"><span className="pendingGlyph" aria-hidden="true">⌛</span><p className="kicker">OWNER REVIEW</p><h2>소유자 검토 중입니다.</h2><p>승인되면 Evidence Contract가 이 페이지에 발급됩니다.</p></section>}

          {view.status === "blocked" && hasTtlBlock && <section className="railCard repairCard"><p className="kicker">QUICK REPAIR</p><h2>유효 기간을 정책에 맞추세요.</h2><p>7일로 낮춘 뒤 Agent가 정책을 다시 검사합니다.</p><button className="dangerOutlineButton" disabled={busy !== null} onClick={() => void refine({ instruction: "TTL을 정책 기준에 맞게 7일로 줄여 주세요", ttlDays: 7 })} type="button">{busy === "refine" ? "재검토 중…" : "7일로 낮추고 재검토"}</button></section>}

          {!view.evidence && !(view.status === "proposed" && canReview) && (
            <section className="railCard refineCard"><p className="kicker">REFINE WITH AGENT</p><h2>설계를 보완할까요?</h2><label className="srOnly" htmlFor="refinement">Agent 보완 요청</label><textarea id="refinement" onChange={(event) => setRefinement(event.target.value)} placeholder="예: 서울/경기를 수도권으로 묶어줘" rows={4} value={refinement} /><button className="secondaryLink fullButton" disabled={busy !== null || !refinement.trim()} onClick={() => void refine()} type="button">{busy === "refine" ? "Agent가 보완 중…" : "보완 요청 보내기"}</button></section>
          )}
        </aside>
      </div>
    </div>
  );
}

function Overview({ view }: { view: TaskView }) {
  return (
    <div className="tabStack">
      <section className="metricGrid detailMetrics" aria-label="View 품질 지표"><article><p>Utility</p><strong>{view.utility.utility_score}</strong><small>/100</small></article><article><p>선택 소스</p><strong>{view.plan.selected_sources.length}</strong><small>개</small></article><article><p>선택 필드</p><strong>{view.utility.selected_field_count}</strong><small>개</small></article><article><p>제거 필드</p><strong>{view.utility.removed_field_count}</strong><small>개</small></article></section>
      <section className="detailSection"><div className="sectionHeader"><div><p className="kicker">PURPOSE SPEC</p><h2>Agent가 해석한 목적</h2></div></div><dl className="purposeSpec"><div><dt>목표</dt><dd>{view.plan.purpose_spec.objective}</dd></div><div><dt>지원할 결정</dt><dd>{view.plan.purpose_spec.decision_to_support}</dd></div><div><dt>예상 데이터</dt><dd>{view.utility.estimated_rows.toLocaleString("ko-KR")}행</dd></div></dl></section>
      <section className="detailSection"><p className="kicker">SELECTED SOURCES</p><h2>선택된 데이터 소스</h2><div className="sourceCards">{view.plan.selected_sources.map((source) => <article key={source}><span aria-hidden="true">◇</span><strong>{sourceLabels[source]}</strong><small>{source}</small></article>)}</div></section>
      {view.plan.assumptions.length > 0 && <section className="detailSection"><p className="kicker">AGENT ASSUMPTIONS</p><h2>컴파일 가정</h2><ul className="assumptionList">{view.plan.assumptions.map((assumption) => <li key={assumption}><span>i</span>{assumption}</li>)}</ul></section>}
    </div>
  );
}

function Policy({ view }: { view: TaskView }) {
  return (
    <div className="tabStack">
      <section className="detailSection firstSection"><p className="kicker">TRANSFORMATION PLAN</p><h2>최소화 변환 계획</h2><p className="sectionIntro">원본 필드가 목적에 필요한 형태로 어떻게 바뀌는지 확인합니다.</p><div className="transformList">{view.plan.transformations.map((item, index) => <article className="transformItem" key={`${item.output_field}-${index}`}><span className="transformIndex">{String(index + 1).padStart(2, "0")}</span><div className="transformFields"><code>{item.input_fields.join(" + ")}</code><span>→</span><code>{item.output_field}</code></div><span className={`transformTag tag-${item.transformation}`}>{item.transformation}</span><p>{item.rationale}</p></article>)}</div></section>
      <section className="detailSection"><p className="kicker">POLICY CHECKS</p><h2>정책 검사 결과</h2><div className="findingList">{view.policy_findings.map((finding) => <article className={`finding finding-${finding.severity}`} key={finding.code}><span>{finding.severity === "block" ? "!" : "✓"}</span><div><strong>{finding.message}</strong><p>{finding.action}</p><code>{finding.code}</code></div></article>)}</div></section>
    </div>
  );
}

function Preview({ view }: { view: TaskView }) {
  return (
    <section className="detailSection firstSection"><div className="sectionHeader"><div><p className="kicker">MINIMIZED PREVIEW</p><h2>최소화 데이터 미리보기</h2><p className="sectionIntro">승인 전에 실제 반환 형태만 제한된 샘플로 확인합니다.</p></div><span className="countPill">{view.preview_rows.length}행 샘플</span></div><div className="tableWrap"><table><thead><tr>{view.plan.preview_columns.map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>{view.preview_rows.map((row, rowIndex) => <tr key={rowIndex}>{view.plan.preview_columns.map((column) => <td key={column}>{String(row[column] ?? "—")}</td>)}</tr>)}</tbody></table></div><p className="tableCaption">직접 식별자와 목적에 불필요한 세부 값은 정책에 따라 제거·그룹화됩니다.</p></section>
  );
}

function Evidence({ view }: { view: TaskView }) {
  if (!view.evidence) return <EmptyState eyebrow="EVIDENCE PENDING" title="아직 Evidence가 발급되지 않았습니다." description={view.status === "proposed" ? "데이터 소유자가 승인하면 계약 해시와 만료 시점이 여기에 기록됩니다." : "차단 또는 수정 항목을 처리한 뒤 승인을 받아야 합니다."} />;
  const evidence = view.evidence;
  return (
    <div className="tabStack"><section className="evidenceHero"><div className="evidenceSeal"><span>✓</span>VERIFIED</div><div><p className="kicker">EVIDENCE CONTRACT</p><h2>목적과 데이터 범위가 승인되었습니다.</h2><p>이 계약은 승인 시점의 목적, 변환, 데이터 범위와 만료 시점을 증명합니다.</p></div></section><section className="detailSection evidenceDetails"><dl><div><dt>View ID</dt><dd><code>{evidence.view_id}</code></dd></div><div><dt>승인자</dt><dd>{evidence.approved_by}</dd></div><div><dt>정책 버전</dt><dd>{evidence.policy_version}</dd></div><div><dt>데이터 행 수</dt><dd>{evidence.row_count.toLocaleString("ko-KR")}행</dd></div><div><dt>최소 그룹</dt><dd>{evidence.minimum_group_size}건</dd></div><div><dt>만료 시각</dt><dd>{formatDate(evidence.expires_at, true)}</dd></div></dl><div className="hashBlock"><span>CONTENT SHA-256</span><code>{evidence.content_sha256}</code></div></section></div>
  );
}
