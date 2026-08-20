"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { requestJson } from "@/lib/client-api";
import type { User } from "@/lib/types";

export function AuthScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void requestJson<User | null>("/api/auth/me")
      .then((user) => {
        if (!active) return;
        if (user) router.replace("/dashboard");
        else setChecking(false);
      })
      .catch(() => { if (active) setChecking(false); });
    return () => { active = false; };
  }, [router]);

  async function authenticate(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const body = mode === "signup"
        ? { display_name: displayName, email, password }
        : { email, password };
      await requestJson<{ user: User }>(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      setPassword("");
      router.replace("/dashboard");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "로그인하지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return <main className="standaloneState"><div className="pageLoading" role="status"><span className="loadingMark">✦</span><p>세션을 확인하고 있습니다.</p></div></main>;
  }

  return (
    <main className="authShell">
      <section className="authStory">
        <a className="brand" href="#access"><span className="brandMark">TV</span><span>Needex</span></a>
        <div className="authStatement">
          <p className="eyebrow">PURPOSE → SAFE VIEW</p>
          <h1>필요한 데이터만,<br />목적이 허용한 시간만.</h1>
          <p>로컬 AI가 업무 목적을 해석하고, 정책 엔진과 데이터 소유자가 안전한 임시 View로 완성합니다.</p>
        </div>
        <div className="authTrust">
          <span><i className="liveDot" /> Local AI</span>
          <span>PostgreSQL</span>
          <span>감사 가능한 승인</span>
        </div>
      </section>

      <section className="authPanel" id="access">
        <div className="authCard">
          <p className="kicker">SECURE ACCESS</p>
          <h2>{mode === "login" ? "다시 오신 것을 환영합니다." : "Needex를 시작하세요."}</h2>
          <p className="authIntro">인증 정보는 JavaScript에서 읽을 수 없는 보안 쿠키로 관리됩니다.</p>
          <div className="authTabs" role="tablist" aria-label="인증 방식">
            <button aria-selected={mode === "login"} className={mode === "login" ? "active" : ""} onClick={() => { setMode("login"); setError(null); }} role="tab" type="button">로그인</button>
            <button aria-selected={mode === "signup"} className={mode === "signup" ? "active" : ""} onClick={() => { setMode("signup"); setError(null); }} role="tab" type="button">회원가입</button>
          </div>
          <form className="authForm" onSubmit={authenticate}>
            {mode === "signup" && <div className="field"><label htmlFor="display-name">이름</label><input id="display-name" autoComplete="name" minLength={2} maxLength={80} onChange={(event) => setDisplayName(event.target.value)} required value={displayName} /></div>}
            <div className="field"><label htmlFor="email">이메일</label><input id="email" autoComplete="email" inputMode="email" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} /></div>
            <div className="field"><label htmlFor="password">비밀번호</label><input id="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={mode === "signup" ? 12 : 1} maxLength={128} onChange={(event) => setPassword(event.target.value)} required type="password" value={password} /></div>
            {mode === "signup" && <p className="fieldHint">12자 이상, 영문·숫자·특수문자를 각각 포함하세요.</p>}
            {error && <div className="inlineError" role="alert"><span>!</span>{error}</div>}
            <button className="primaryButton fullButton" disabled={loading} type="submit"><span>{loading ? "처리 중…" : mode === "login" ? "로그인" : "계정 만들기"}</span><span aria-hidden="true">→</span></button>
          </form>
        </div>
      </section>
    </main>
  );
}
