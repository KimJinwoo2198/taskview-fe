"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ErrorNotice } from "@/components/ui/feedback";
import { requestJson } from "@/lib/client-api";
import { audienceLabels } from "@/lib/presentation";
import type { Audience, Needex } from "@/lib/types";

const defaultPurpose = "VOC를 지역과 이슈 유형별로 묶어 다음 스프린트의 제품 개선 우선순위를 정하고 싶다";

const audienceDescriptions: Record<Audience, string> = {
  product: "제품 개선과 실험 우선순위",
  operations: "운영 품질과 프로세스 결정",
  support: "문의 유형과 고객지원 개선",
  executive: "요약 지표와 경영 의사결정",
};

const steps = [
  { number: "01", label: "목적", hint: "결정 정의" },
  { number: "02", label: "범위", hint: "사용자·기간" },
  { number: "03", label: "검토", hint: "Agent 컴파일" },
];

export function NewNeedexScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [purpose, setPurpose] = useState(defaultPurpose);
  const [audience, setAudience] = useState<Audience>("product");
  const [ttlDays, setTtlDays] = useState(7);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dirty = purpose !== defaultPurpose || audience !== "product" || ttlDays !== 7;

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (!dirty || busy) return;
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [busy, dirty]);

  function next() {
    setError(null);
    if (step === 1 && purpose.trim().length < 10) {
      setError("업무 목적을 10자 이상으로 구체적으로 작성해 주세요.");
      return;
    }
    setStep((current) => Math.min(3, current + 1));
  }

  function cancel() {
    if (!dirty || window.confirm("작성 중인 내용을 버리고 Task Views로 돌아갈까요?")) router.push("/taskviews");
  }

  async function compile() {
    setBusy(true);
    setError(null);
    try {
      const view = await requestJson<Needex>("/api/taskviews/preview", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ purpose: purpose.trim(), audience, ttl_days: ttlDays }),
      });
      router.push(`/taskviews/${view.id}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Task View를 컴파일하지 못했습니다.");
      setBusy(false);
    }
  }

  return (
    <div className="createPage">
      <header className="createHeader">
        <div><Link className="backLink" href="/taskviews">← Task Views</Link><p className="kicker">NEW TASK VIEW</p><h1>업무 목적을 안전한 View로</h1><p>3단계를 마치면 로컬 Agent가 데이터 범위와 변환 계획을 제안합니다.</p></div>
        <button className="textButton" onClick={cancel} type="button">취소</button>
      </header>

      <div className="createLayout">
        <aside className="progressPanel" aria-label="생성 진행 단계">
          <ol className="progressSteps">
            {steps.map((item, index) => {
              const position = index + 1;
              const state = position < step ? "complete" : position === step ? "current" : "future";
              return <li aria-current={state === "current" ? "step" : undefined} className={state} key={item.number}><span className="progressNumber">{state === "complete" ? "✓" : item.number}</span><div><strong>{item.label}</strong><small>{item.hint}</small></div></li>;
            })}
          </ol>
          <div className="agentAside"><span aria-hidden="true">✦</span><div><strong>LOCAL AGENT</strong><p>작성 내용은 Qwen 3.5가 로컬에서 해석하며 외부 LLM API로 전송하지 않습니다.</p></div></div>
        </aside>

        <section className="stepCard">
          {error && <ErrorNotice message={error} onClose={() => setError(null)} />}
          {step === 1 && (
            <div className="stepContent">
              <div className="stepHeading"><span>STEP 01</span><h2>어떤 결정을 내리려고 하나요?</h2><p>필드 이름 대신 업무 맥락과 원하는 결정을 자연어로 설명하세요.</p></div>
              <div className="field"><label htmlFor="purpose">업무 목적</label><textarea autoFocus id="purpose" maxLength={1000} minLength={10} onChange={(event) => setPurpose(event.target.value)} placeholder="예: VOC를 이슈 유형별로 묶어 다음 스프린트의 개선 우선순위를 정하고 싶다" value={purpose} /><div className="fieldMeta"><span>결정, 대상, 활용 방법이 포함되면 더 정확합니다.</span><span>{purpose.length}/1000</span></div></div>
              <div className="examplePrompt"><span>좋은 목적의 예</span><p>“최근 7일간 결제 실패 원인을 고객군별로 비교해 다음 배포의 수정 우선순위를 정하고 싶다.”</p></div>
            </div>
          )}

          {step === 2 && (
            <div className="stepContent">
              <div className="stepHeading"><span>STEP 02</span><h2>누가, 얼마나 오래 사용하나요?</h2><p>사용자와 유효 기간은 선택 가능한 데이터 범위를 결정하는 정책 입력입니다.</p></div>
              <fieldset className="choiceField"><legend>사용 조직</legend><div className="audienceGrid">{(Object.keys(audienceLabels) as Audience[]).map((value) => <label className={audience === value ? "selected" : ""} key={value}><input checked={audience === value} name="audience" onChange={() => setAudience(value)} type="radio" value={value} /><span className="choiceCheck" aria-hidden="true">{audience === value ? "✓" : ""}</span><strong>{audienceLabels[value]}</strong><small>{audienceDescriptions[value]}</small></label>)}</div></fieldset>
              <fieldset className="choiceField"><legend>유효 기간 (TTL)</legend><div className="ttlChoices">{[1, 3, 7, 14].map((days) => <label className={ttlDays === days ? "selected" : ""} key={days}><input checked={ttlDays === days} name="ttl" onChange={() => setTtlDays(days)} type="radio" value={days} /><strong>{days}일</strong>{days === 7 && <small>권장</small>}{days === 14 && <small>정책 검토</small>}</label>)}</div></fieldset>
              {ttlDays === 14 && <div className="policyWarning"><span>!</span><div><strong>14일 요청은 정책 검토 대상입니다.</strong><p>Agent가 목적의 필요성을 검사하며 차단될 경우 7일로 조정할 수 있습니다.</p></div></div>}
            </div>
          )}

          {step === 3 && (
            <div className="stepContent">
              <div className="stepHeading"><span>STEP 03</span><h2>Agent에 전달할 내용을 확인하세요.</h2><p>컴파일 후에도 승인 전까지 보완 요청을 통해 설계를 수정할 수 있습니다.</p></div>
              <dl className="reviewSummary"><div><dt>업무 목적</dt><dd>{purpose}</dd><button onClick={() => setStep(1)} type="button">수정</button></div><div><dt>사용 조직</dt><dd>{audienceLabels[audience]}</dd><button onClick={() => setStep(2)} type="button">수정</button></div><div><dt>유효 기간</dt><dd>{ttlDays}일</dd><button onClick={() => setStep(2)} type="button">수정</button></div></dl>
              <div className="compileFlow" aria-label="Agent 처리 과정"><div><span>1</span><strong>목적 구조화</strong></div><i>→</i><div><span>2</span><strong>최소 필드 선택</strong></div><i>→</i><div><span>3</span><strong>정책 검사</strong></div></div>
              <div className="privacyNote"><span aria-hidden="true">◇</span><p><strong>로컬 처리</strong> 목적은 로컬 Qwen 모델과 내부 정책 엔진에서만 처리됩니다.</p></div>
            </div>
          )}

          <footer className="stepActions">
            <button className="secondaryButton" disabled={step === 1 || busy} onClick={() => setStep((current) => Math.max(1, current - 1))} type="button">이전</button>
            {step < 3 ? <button className="primaryButton" onClick={next} type="button">다음 단계 <span>→</span></button> : <button className="primaryButton compileButton" disabled={busy} onClick={() => void compile()} type="button">{busy ? "Agent가 컴파일 중…" : "Task View 컴파일"}<span>{busy ? "✦" : "↗"}</span></button>}
          </footer>
          {busy && <p className="compileHint" role="status">목적 구조화, 데이터 최소화, 정책 검사를 진행 중입니다. 보통 3~15초가 걸립니다.</p>}
        </section>
      </div>
    </div>
  );
}
