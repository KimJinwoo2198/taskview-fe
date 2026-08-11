"use client";

import { FormEvent, useState } from "react";

import type { Audience, TaskView } from "@/lib/types";

const DEFAULT_PURPOSE =
  "VOC를 지역과 이슈 유형별로 묶어 다음 스프린트의 제품 개선 우선순위를 정하고 싶다";

const audienceLabels: Record<Audience, string> = {
  product: "제품",
  operations: "운영",
  support: "고객지원",
  executive: "경영진",
};

function statusLabel(status: TaskView["status"]) {
  return {
    proposed: "승인 대기",
    approved: "승인됨",
    rejected: "거절됨",
    blocked: "정책 차단",
  }[status];
}

async function readJson(response: Response) {
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail ?? "요청을 처리하지 못했습니다.");
  return data;
}

export function TaskViewWorkbench() {
  const [purpose, setPurpose] = useState(DEFAULT_PURPOSE);
  const [audience, setAudience] = useState<Audience>("product");
  const [ttlDays, setTtlDays] = useState(7);
  const [view, setView] = useState<TaskView | null>(null);
  const [refinement, setRefinement] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function compile(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/taskviews/preview", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ purpose, audience, ttl_days: ttlDays }),
      });
      setView((await readJson(response)) as TaskView);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "알 수 없는 오류입니다.");
    } finally {
      setLoading(false);
    }
  }

  async function decide(approved: boolean) {
    if (!view) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/taskviews/${view.id}/decision`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          approved,
          reviewer: "cx-owner@taskview.local",
          reason: approved ? "목적과 최소화 범위를 확인했습니다." : "요청 범위를 다시 조정해 주세요.",
        }),
      });
      setView((await readJson(response)) as TaskView);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "알 수 없는 오류입니다.");
    } finally {
      setLoading(false);
    }
  }

  async function refine() {
    if (!view || !refinement.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/taskviews/${view.id}/refine`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ instruction: refinement }),
      });
      setView((await readJson(response)) as TaskView);
      setRefinement("");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "알 수 없는 오류입니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="TaskView 홈">
          <span className="brandMark">TV</span>
          <span>TaskView</span>
        </a>
        <div className="topbarMeta">
          <span className="liveDot" /> Local AI
          <span className="divider" /> Policy 2026.08
        </div>
      </header>

      <section className="hero" id="top">
        <div>
          <p className="eyebrow">PURPOSE → SAFE VIEW</p>
          <h1>데이터를 요청하지 말고,<br />해야 할 일을 설명하세요.</h1>
        </div>
        <p className="heroCopy">
          TaskView가 목적을 해석하고 필요한 필드만 선택해, 정책 검증과 소유자 승인을 거친
          임시 데이터 View를 만듭니다.
        </p>
      </section>

      <div className="workspace">
        <aside className="composerPanel">
          <div className="panelHeading">
            <span className="stepNumber">01</span>
            <div>
              <p className="sectionKicker">INTENT</p>
              <h2>업무 목적</h2>
            </div>
          </div>
          <form onSubmit={compile}>
            <label htmlFor="purpose">어떤 결정을 내리려고 하나요?</label>
            <textarea
              id="purpose"
              value={purpose}
              onChange={(event) => setPurpose(event.target.value)}
              minLength={10}
              required
            />

            <div className="formRow">
              <div>
                <label htmlFor="audience">사용 조직</label>
                <select
                  id="audience"
                  value={audience}
                  onChange={(event) => setAudience(event.target.value as Audience)}
                >
                  {Object.entries(audienceLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="ttl">유효 기간</label>
                <select
                  id="ttl"
                  value={ttlDays}
                  onChange={(event) => setTtlDays(Number(event.target.value))}
                >
                  <option value={1}>1일</option>
                  <option value={3}>3일</option>
                  <option value={7}>7일</option>
                  <option value={14}>14일 · 정책 검토</option>
                </select>
              </div>
            </div>
            <button className="primaryButton" disabled={loading} type="submit">
              {loading ? "컴파일 중…" : "Task View 컴파일"}
              <span aria-hidden="true">↗</span>
            </button>
          </form>
          <div className="agentNote">
            <span className="agentGlyph">✦</span>
            <p><strong>Agent 역할</strong> 목적 구조화 · 카탈로그 검색 · 안전한 변환 제안</p>
          </div>
        </aside>

        <section className="resultPanel" aria-live="polite">
          {!view ? (
            <div className="emptyState">
              <div className="orbit"><span>✦</span></div>
              <p className="sectionKicker">READY TO COMPILE</p>
              <h2>목적이 입력되면<br />View 설계가 여기에 나타납니다.</h2>
              <ol>
                <li><span>1</span>AI가 목적과 필요한 데이터를 해석</li>
                <li><span>2</span>정책 엔진이 최소화·변환 규칙 검사</li>
                <li><span>3</span>소유자 승인 후 Evidence 생성</li>
              </ol>
            </div>
          ) : (
            <div className="resultContent">
              <div className="resultHeader">
                <div>
                  <p className="sectionKicker">TASK VIEW · {view.id}</p>
                  <h2>{view.plan.purpose_spec.decision_to_support}</h2>
                </div>
                <span className={`status status-${view.status}`}>{statusLabel(view.status)}</span>
              </div>

              <div className="metricStrip">
                <div><span>UTILITY</span><strong>{view.utility.utility_score}</strong><small>/100</small></div>
                <div><span>SOURCES</span><strong>{view.plan.selected_sources.length}</strong><small>개</small></div>
                <div><span>FIELDS</span><strong>{view.utility.selected_field_count}</strong><small>개</small></div>
                <div><span>TTL</span><strong>{view.ttl_days}</strong><small>일</small></div>
              </div>

              <section className="resultSection">
                <div className="sectionTitle"><span>02</span><h3>변환 계획</h3></div>
                <div className="transformList">
                  {view.plan.transformations.map((item, index) => (
                    <article className="transformItem" key={`${item.output_field}-${index}`}>
                      <div className="transformPath">
                        <code>{item.input_fields.join(" + ")}</code>
                        <span>→</span>
                        <code>{item.output_field}</code>
                      </div>
                      <span className={`transformTag tag-${item.transformation}`}>{item.transformation}</span>
                      <p>{item.rationale}</p>
                    </article>
                  ))}
                </div>
              </section>

              <section className="resultSection">
                <div className="sectionTitle"><span>03</span><h3>정책 검사</h3></div>
                {view.policy_findings.map((finding) => (
                  <div className={`finding finding-${finding.severity}`} key={finding.code}>
                    <span>{finding.severity === "block" ? "!" : "✓"}</span>
                    <div><strong>{finding.message}</strong><p>{finding.action}</p></div>
                  </div>
                ))}
              </section>

              <section className="resultSection">
                <div className="sectionTitle"><span>04</span><h3>최소화 데이터 미리보기</h3></div>
                <div className="tableWrap">
                  <table>
                    <thead><tr>{view.plan.preview_columns.map((column) => <th key={column}>{column}</th>)}</tr></thead>
                    <tbody>
                      {view.preview_rows.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          {view.plan.preview_columns.map((column) => <td key={column}>{row[column]}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {view.evidence ? (
                <section className="evidenceCard">
                  <div className="evidenceStamp">VERIFIED</div>
                  <div>
                    <p className="sectionKicker">EVIDENCE CONTRACT</p>
                    <h3>승인된 목적과 데이터가 연결되었습니다.</h3>
                    <p>승인자 {view.evidence.approved_by} · 최소 그룹 {view.evidence.minimum_group_size}건 · 총 {view.evidence.row_count}건</p>
                    <code>sha256:{view.evidence.content_sha256.slice(0, 24)}…</code>
                  </div>
                </section>
              ) : (
                <section className="approvalCard">
                  <div>
                    <p className="sectionKicker">OWNER DECISION</p>
                    <h3>cx-data 소유자 검토가 필요합니다.</h3>
                  </div>
                  <div className="approvalActions">
                    <button className="secondaryButton" disabled={loading} onClick={() => decide(false)}>거절</button>
                    <button className="approveButton" disabled={loading || view.status === "blocked"} onClick={() => decide(true)}>승인 및 생성</button>
                  </div>
                </section>
              )}

              {!view.evidence && (
                <div className="refineRow">
                  <input
                    aria-label="보완 요청"
                    placeholder="예: 서울/경기를 수도권으로 묶어줘"
                    value={refinement}
                    onChange={(event) => setRefinement(event.target.value)}
                  />
                  <button disabled={loading || !refinement.trim()} onClick={refine}>Agent에게 보완 요청</button>
                </div>
              )}
            </div>
          )}
          {error && <div className="errorToast" role="alert">{error}</div>}
        </section>
      </div>
      <footer><span>TaskView Prototype</span><span>Local-first · Auditable · Purpose-bound</span></footer>
    </main>
  );
}

