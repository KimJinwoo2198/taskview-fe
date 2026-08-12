"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";

import type { Audience, TaskView, User } from "@/lib/types";

const DEFAULT_PURPOSE =
  "VOC를 지역과 이슈 유형별로 묶어 다음 스프린트의 제품 개선 우선순위를 정하고 싶다";

const audienceLabels: Record<Audience, string> = {
  product: "제품",
  operations: "운영",
  support: "고객지원",
  executive: "경영진",
};

const roleLabels: Record<User["role"], string> = {
  requester: "요청자",
  data_owner: "데이터 소유자",
  admin: "관리자",
};

type BusyAction = "compile" | "open" | "decision" | "refine";

function statusLabel(status: TaskView["status"]) {
  return {
    proposed: "승인 대기",
    approved: "승인됨",
    rejected: "거절됨",
    blocked: "정책 차단",
  }[status];
}

async function readJson(response: Response) {
  const data = (await response.json().catch(() => null)) as { detail?: unknown } | null;
  if (!response.ok) {
    const detail = data?.detail;
    if (typeof detail === "string") throw new Error(detail);
    if (Array.isArray(detail)) {
      const messages = detail
        .map((item) =>
          item && typeof item === "object" && "msg" in item
            ? String(item.msg).replace(/^Value error,\s*/i, "")
            : null,
        )
        .filter(Boolean);
      if (messages.length) throw new Error(messages.join(" "));
    }
    throw new Error("요청을 처리하지 못했습니다.");
  }
  return data;
}

export function TaskViewWorkbench() {
  const [user, setUser] = useState<User | null>();
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [purpose, setPurpose] = useState(DEFAULT_PURPOSE);
  const [audience, setAudience] = useState<Audience>("product");
  const [ttlDays, setTtlDays] = useState(7);
  const [view, setView] = useState<TaskView | null>(null);
  const [recentViews, setRecentViews] = useState<TaskView[]>([]);
  const [refinement, setRefinement] = useState("");
  const [loading, setLoading] = useState(false);
  const [busyAction, setBusyAction] = useState<BusyAction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const operationGeneration = useRef(0);

  const loadViews = useCallback(async () => {
    const response = await fetch("/api/taskviews", { cache: "no-store" });
    return (await readJson(response)) as TaskView[];
  }, []);

  useEffect(() => {
    let active = true;
    async function bootstrap() {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        if (!active) return;
        setUser((await readJson(response)) as User | null);
      } catch (requestError) {
        if (active) {
          setUser(null);
          setError(requestError instanceof Error ? requestError.message : "인증 상태를 확인하지 못했습니다.");
        }
      }
    }
    void bootstrap();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    let active = true;
    void loadViews()
      .then((views) => {
        if (active) setRecentViews(views);
      })
      .catch((requestError) => {
        if (active) {
          setError(requestError instanceof Error ? requestError.message : "Task View 목록을 불러오지 못했습니다.");
        }
      });
    return () => {
      active = false;
    };
  }, [loadViews, user]);

  async function authenticate(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const body =
        authMode === "signup"
          ? { display_name: displayName, email, password }
          : { email, password };
      const response = await fetch(`/api/auth/${authMode}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = (await readJson(response)) as { user: User };
      setPassword("");
      setUser(payload.user);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "로그인하지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    operationGeneration.current += 1;
    setBusyAction(null);
    setLoading(true);
    setError(null);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      setUser(null);
      setView(null);
      setRecentViews([]);
      setAuthMode("login");
      setDisplayName("");
      setEmail("");
      setPassword("");
      setLoading(false);
    }
  }

  async function compile(event: FormEvent) {
    event.preventDefault();
    const generation = ++operationGeneration.current;
    setBusyAction("compile");
    setError(null);
    try {
      const response = await fetch("/api/taskviews/preview", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ purpose, audience, ttl_days: ttlDays }),
      });
      const nextView = (await readJson(response)) as TaskView;
      if (generation !== operationGeneration.current) return;
      setView(nextView);
      const views = await loadViews();
      if (generation === operationGeneration.current) setRecentViews(views);
    } catch (requestError) {
      if (generation === operationGeneration.current) {
        setError(requestError instanceof Error ? requestError.message : "알 수 없는 오류입니다.");
      }
    } finally {
      if (generation === operationGeneration.current) setBusyAction(null);
    }
  }

  async function openView(viewId: string) {
    const generation = ++operationGeneration.current;
    setBusyAction("open");
    setError(null);
    try {
      const response = await fetch(`/api/taskviews/${viewId}`, { cache: "no-store" });
      const nextView = (await readJson(response)) as TaskView;
      if (generation !== operationGeneration.current) return;
      setView(nextView);
      setPurpose(nextView.purpose);
      setAudience(nextView.audience);
      setTtlDays(nextView.ttl_days);
    } catch (requestError) {
      if (generation === operationGeneration.current) {
        setError(requestError instanceof Error ? requestError.message : "Task View를 열지 못했습니다.");
      }
    } finally {
      if (generation === operationGeneration.current) setBusyAction(null);
    }
  }

  async function decide(approved: boolean) {
    if (!view) return;
    const generation = ++operationGeneration.current;
    setBusyAction("decision");
    setError(null);
    try {
      const response = await fetch(`/api/taskviews/${view.id}/decision`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          approved,
          reason: approved ? "목적과 최소화 범위를 확인했습니다." : "요청 범위를 다시 조정해 주세요.",
        }),
      });
      const nextView = (await readJson(response)) as TaskView;
      if (generation !== operationGeneration.current) return;
      setView(nextView);
      const views = await loadViews();
      if (generation === operationGeneration.current) setRecentViews(views);
    } catch (requestError) {
      if (generation === operationGeneration.current) {
        setError(requestError instanceof Error ? requestError.message : "알 수 없는 오류입니다.");
      }
    } finally {
      if (generation === operationGeneration.current) setBusyAction(null);
    }
  }

  async function refine(options?: { instruction?: string; ttlDays?: number }) {
    const instruction = options?.instruction ?? refinement.trim();
    const nextTtlDays = options?.ttlDays ?? ttlDays;
    if (!view || !instruction) return;
    const generation = ++operationGeneration.current;
    setBusyAction("refine");
    setError(null);
    try {
      const response = await fetch(`/api/taskviews/${view.id}/refine`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ instruction, ttl_days: nextTtlDays }),
      });
      const nextView = (await readJson(response)) as TaskView;
      if (generation !== operationGeneration.current) return;
      setView(nextView);
      setTtlDays(nextView.ttl_days);
      setRefinement("");
      const views = await loadViews();
      if (generation === operationGeneration.current) setRecentViews(views);
    } catch (requestError) {
      if (generation === operationGeneration.current) {
        setError(requestError instanceof Error ? requestError.message : "알 수 없는 오류입니다.");
      }
    } finally {
      if (generation === operationGeneration.current) setBusyAction(null);
    }
  }

  if (user === undefined) {
    return (
      <main className="authShell">
        <div className="authLoading" role="status"><span className="orbit"><span>✦</span></span>세션을 확인하고 있습니다.</div>
      </main>
    );
  }

  if (user === null) {
    return (
      <main className="authShell">
        <section className="authStory">
          <a className="brand" href="#auth" aria-label="TaskView 홈"><span className="brandMark">TV</span><span>TaskView</span></a>
          <div>
            <p className="eyebrow">PURPOSE → SAFE VIEW</p>
            <h1>필요한 데이터만,<br />목적이 허용한 시간만.</h1>
            <p>로컬 AI가 업무 목적을 해석하고 데이터 소유자가 검증하는 안전한 임시 View 워크플로입니다.</p>
          </div>
          <p className="authLocal"><span className="liveDot" /> 로컬 AI · PostgreSQL · 감사 가능한 승인</p>
        </section>
        <section className="authPanel" id="auth">
          <div className="authCard">
            <p className="sectionKicker">SECURE ACCESS</p>
            <h2>{authMode === "login" ? "다시 오신 것을 환영합니다." : "TaskView를 시작하세요."}</h2>
            <p className="authIntro">세션은 브라우저에서 읽을 수 없는 보안 쿠키로 관리됩니다.</p>
            <div className="authTabs" role="tablist" aria-label="인증 방식">
              <button className={authMode === "login" ? "active" : ""} onClick={() => { setAuthMode("login"); setError(null); }} type="button">로그인</button>
              <button className={authMode === "signup" ? "active" : ""} onClick={() => { setAuthMode("signup"); setError(null); }} type="button">회원가입</button>
            </div>
            <form className="authForm" onSubmit={authenticate}>
              {authMode === "signup" && (
                <div><label htmlFor="display-name">이름</label><input id="display-name" autoComplete="name" minLength={2} maxLength={80} onChange={(event) => setDisplayName(event.target.value)} required value={displayName} /></div>
              )}
              <div><label htmlFor="email">이메일</label><input id="email" autoComplete="email" inputMode="email" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} /></div>
              <div><label htmlFor="password">비밀번호</label><input id="password" autoComplete={authMode === "login" ? "current-password" : "new-password"} minLength={authMode === "signup" ? 12 : 1} maxLength={128} onChange={(event) => setPassword(event.target.value)} required type="password" value={password} /></div>
              {authMode === "signup" && <p className="passwordHint">12자 이상, 영문·숫자·특수문자를 각각 포함하세요.</p>}
              {error && <div className="authError" role="alert">{error}</div>}
              <button className="primaryButton" disabled={loading} type="submit"><span>{loading ? "처리 중…" : authMode === "login" ? "로그인" : "계정 만들기"}</span><span aria-hidden="true">↗</span></button>
            </form>
          </div>
        </section>
      </main>
    );
  }

  const canDecide = user.role === "data_owner" || user.role === "admin";

  return (
    <main className="shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="TaskView 홈"><span className="brandMark">TV</span><span>TaskView</span></a>
        <div className="topbarActions">
          <div className="topbarMeta"><span className="liveDot" /> Local AI <span className="divider" /> Policy 2026.08</div>
          <div className="userChip"><span>{user.display_name}</span><small>{roleLabels[user.role]}</small></div>
          <button className="logoutButton" disabled={loading} onClick={logout} type="button">{loading ? "종료 중…" : "로그아웃"}</button>
        </div>
      </header>

      <section className="hero" id="top">
        <div><p className="eyebrow">PURPOSE → SAFE VIEW</p><h1>데이터를 요청하지 말고,<br />해야 할 일을 설명하세요.</h1></div>
        <p className="heroCopy">TaskView가 목적을 해석하고 필요한 필드만 선택해, 정책 검증과 소유자 승인을 거친 임시 데이터 View를 만듭니다.</p>
      </section>

      <div className="workspace">
        <aside className="composerPanel">
          <div className="panelHeading"><span className="stepNumber">01</span><div><p className="sectionKicker">INTENT</p><h2>업무 목적</h2></div></div>
          <form onSubmit={compile}>
            <label htmlFor="purpose">어떤 결정을 내리려고 하나요?</label>
            <textarea id="purpose" value={purpose} onChange={(event) => setPurpose(event.target.value)} minLength={10} required />
            <div className="formRow">
              <div><label htmlFor="audience">사용 조직</label><select id="audience" value={audience} onChange={(event) => setAudience(event.target.value as Audience)}>{Object.entries(audienceLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
              <div><label htmlFor="ttl">유효 기간</label><select id="ttl" value={ttlDays} onChange={(event) => setTtlDays(Number(event.target.value))}><option value={1}>1일</option><option value={3}>3일</option><option value={7}>7일</option><option value={14}>14일 · 정책 검토</option></select></div>
            </div>
            <button className="primaryButton" disabled={busyAction !== null} type="submit"><span>{busyAction === "compile" ? "컴파일 중…" : "Task View 컴파일"}</span><span aria-hidden="true">↗</span></button>
            {busyAction === "compile" && <p className="busyHint" role="status">로컬 Qwen이 목적을 분석하고 있습니다. 보통 3~15초 정도 걸립니다.</p>}
          </form>
          <div className="agentNote"><span className="agentGlyph">✦</span><p><strong>Agent 역할</strong> 목적 구조화 · 승인 소스 선택 · 정책 기반 최소 변환</p></div>
          <section className="recentSection">
            <div className="recentHeading"><p className="sectionKicker">RECENT VIEWS</p><span>{recentViews.length}</span></div>
            {recentViews.length === 0 ? <p className="recentEmpty">아직 만든 Task View가 없습니다.</p> : (
              <div className="recentList">{recentViews.map((item) => <button className={view?.id === item.id ? "active" : ""} disabled={busyAction !== null} key={item.id} onClick={() => openView(item.id)} type="button"><span>{item.plan.purpose_spec.decision_to_support}</span>{canDecide && item.requester && <span className="recentRequester">{item.requester.display_name} · {item.requester.email}</span>}<small><span className={`statusDot statusDot-${item.status}`} />{statusLabel(item.status)} · {new Date(item.created_at).toLocaleDateString("ko-KR")}</small></button>)}</div>
            )}
          </section>
        </aside>

        <section className="resultPanel" aria-live="polite">
          {!view ? (
            <div className="emptyState"><div className="orbit"><span>✦</span></div><p className="sectionKicker">READY TO COMPILE</p><h2>목적이 입력되면<br />View 설계가 여기에 나타납니다.</h2><ol><li><span>1</span>AI가 목적과 필요한 데이터를 해석</li><li><span>2</span>정책 엔진이 최소화·변환 규칙 검사</li><li><span>3</span>소유자 승인 후 Evidence 생성</li></ol></div>
          ) : (
            <div className="resultContent">
              <div className="resultHeader"><div><p className="sectionKicker">TASK VIEW · {view.id}</p><h2>{view.plan.purpose_spec.decision_to_support}</h2>{canDecide && view.requester && <p className="requesterIdentity">요청자 {view.requester.display_name} · {view.requester.email}</p>}</div><span className={`status status-${view.status}`}>{statusLabel(view.status)}</span></div>
              <div className="metricStrip"><div><span>UTILITY</span><strong>{view.utility.utility_score}</strong><small>/100</small></div><div><span>SOURCES</span><strong>{view.plan.selected_sources.length}</strong><small>개</small></div><div><span>FIELDS</span><strong>{view.utility.selected_field_count}</strong><small>개</small></div><div><span>TTL</span><strong>{view.ttl_days}</strong><small>일</small></div></div>

              <section className="resultSection"><div className="sectionTitle"><span>02</span><h3>변환 계획</h3></div><div className="transformList">{view.plan.transformations.map((item, index) => <article className="transformItem" key={`${item.output_field}-${index}`}><div className="transformPath"><code>{item.input_fields.join(" + ")}</code><span>→</span><code>{item.output_field}</code></div><span className={`transformTag tag-${item.transformation}`}>{item.transformation}</span><p>{item.rationale}</p></article>)}</div></section>

              <section className="resultSection"><div className="sectionTitle"><span>03</span><h3>정책 검사</h3></div>{view.policy_findings.map((finding) => <div className={`finding finding-${finding.severity}`} key={finding.code}><span>{finding.severity === "block" ? "!" : "✓"}</span><div><strong>{finding.message}</strong><p>{finding.action}</p></div></div>)}</section>

              <section className="resultSection"><div className="sectionTitle"><span>04</span><h3>최소화 데이터 미리보기</h3></div><div className="tableWrap"><table><thead><tr>{view.plan.preview_columns.map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>{view.preview_rows.map((row, rowIndex) => <tr key={rowIndex}>{view.plan.preview_columns.map((column) => <td key={column}>{row[column]}</td>)}</tr>)}</tbody></table></div></section>

              {view.evidence ? (
                <section className="evidenceCard"><div className="evidenceStamp">VERIFIED</div><div><p className="sectionKicker">EVIDENCE CONTRACT</p><h3>승인된 목적과 데이터가 연결되었습니다.</h3><p>승인자 {view.evidence.approved_by} · 최소 그룹 {view.evidence.minimum_group_size}건 · 총 {view.evidence.row_count}건</p><code>sha256:{view.evidence.content_sha256.slice(0, 24)}…</code></div></section>
              ) : view.status === "proposed" && canDecide ? (
                <section className="approvalCard"><div><p className="sectionKicker">OWNER DECISION</p><h3>목적과 최소화 범위를 검토해 주세요.</h3></div><div className="approvalActions"><button className="secondaryButton" disabled={busyAction !== null} onClick={() => decide(false)}>거절</button><button className="approveButton" disabled={busyAction !== null} onClick={() => decide(true)}>{busyAction === "decision" ? "처리 중…" : "승인 및 생성"}</button></div></section>
              ) : (
                <section className={`pendingCard pending-${view.status}`}><div><p className="sectionKicker">{view.status === "proposed" ? "OWNER DECISION" : "WORKFLOW STATUS"}</p><h3>{view.status === "proposed" ? "데이터 소유자의 승인을 기다리고 있습니다." : view.status === "blocked" ? "정책 차단 항목을 보완해야 합니다." : "거절 사유를 반영해 설계를 보완해 주세요."}</h3></div>{view.status === "blocked" && view.policy_findings.some((finding) => finding.code === "TTL_LIMIT") && <button className="policyRepairButton" disabled={busyAction !== null} onClick={() => refine({ instruction: "TTL을 정책 기준에 맞게 7일로 줄여 주세요", ttlDays: 7 })} type="button">{busyAction === "refine" ? "재검토 중…" : "TTL 7일로 낮추고 재검토"}</button>}</section>
              )}

              {!view.evidence && <div className="refineRow"><input aria-label="보완 요청" placeholder="예: 서울/경기를 수도권으로 묶어줘" value={refinement} onChange={(event) => setRefinement(event.target.value)} /><button disabled={busyAction !== null || !refinement.trim()} onClick={() => refine()}>{busyAction === "refine" ? "보완 중…" : "Agent에게 보완 요청"}</button></div>}
            </div>
          )}
          {error && <div className="errorToast" role="alert">{error}<button aria-label="오류 닫기" onClick={() => setError(null)}>×</button></div>}
        </section>
      </div>
      <footer><span>TaskView Prototype</span><span>Local-first · Auditable · Purpose-bound</span></footer>
    </main>
  );
}
