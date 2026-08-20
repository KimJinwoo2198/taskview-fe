"use client";

import { ArrowRight, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { postFlowJson } from "@/components/taskview/auth/api";
import {
  AuthFeedback,
  AuthPageShell,
  FieldLabel,
  PasswordInput,
  SubmitButton,
  authInputClass,
} from "@/components/taskview/auth/shared";
import { Input } from "@/components/ui/input";

export function ResetPasswordScreen({ token }: { token?: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: "error" | "success"; message: string } | null>(null);

  const longEnough = password.length >= 8;
  const hasLettersAndNumbers = /[A-Za-z]/.test(password) && /\d/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const ready = longEnough && hasLettersAndNumbers && passwordsMatch;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    if (!token) {
      setFeedback({ tone: "error", message: "비밀번호 재설정 링크가 없거나 유효하지 않습니다." });
      return;
    }
    if (!ready) {
      setFeedback({ tone: "error", message: "비밀번호 요구사항을 모두 충족해주세요." });
      return;
    }

    setPending(true);
    try {
      const result = await postFlowJson<{ next_path?: string }>(
        "/api/auth/password-resets",
        { token, new_password: password },
        "비밀번호 재설정 API가 아직 연결되지 않았습니다.",
      );
      setFeedback({ tone: "success", message: "비밀번호가 변경되었습니다. 로그인 화면으로 이동합니다." });
      setPassword("");
      setConfirmPassword("");
      const nextPath = result.next_path?.startsWith("/") ? result.next_path : "/dashboard";
      window.setTimeout(() => router.replace(nextPath), 900);
    } catch (cause) {
      setFeedback({ tone: "error", message: cause instanceof Error ? cause.message : "비밀번호를 변경하지 못했습니다." });
    } finally {
      setPending(false);
    }
  }

  const rules = [
    ["8자 이상", longEnough],
    ["영문과 숫자 포함", hasLettersAndNumbers],
    ["두 비밀번호 일치", passwordsMatch],
  ] as const;

  return (
    <AuthPageShell
      backHref="/login"
      backLabel="로그인으로"
      cardClassName="min-h-[574px] px-6 pb-5 pt-[34px] sm:px-10"
      cardDesktopTop="xl:top-[182px]"
      footer={<p className="text-[11px] leading-5 text-tv-slate">비밀번호 변경 후 기존 로그인 세션을 종료하고 다시 로그인합니다.</p>}
      footerClassName="xl:top-[788px]"
    >
      <div className="mx-auto grid size-24 place-items-center rounded-full bg-tv-blue-50 text-tv-blue-500">
        <Check aria-hidden="true" className="size-7" strokeWidth={1.8} />
      </div>
      <div className="mt-5 text-center">
        <h1 className="text-[26px] font-bold leading-[1.4] tracking-[-0.035em] text-tv-ink">새 비밀번호를 설정하세요</h1>
        <p className="mt-0.5 text-[13px] leading-[1.55] text-tv-gray">다른 서비스에서 사용하지 않는 비밀번호를 권장해요.</p>
      </div>

      <form className="mt-6" onSubmit={submit}>
        <div>
          <FieldLabel htmlFor="new-password">새 비밀번호</FieldLabel>
          <PasswordInput
            autoComplete="new-password"
            describedBy="password-requirements"
            id="new-password"
            invalid={password.length > 0 && (!longEnough || !hasLettersAndNumbers)}
            onChange={(event) => setPassword(event.target.value)}
            onToggle={() => setPasswordVisible((current) => !current)}
            value={password}
            visible={passwordVisible}
          />
        </div>
        <div className="mt-4">
          <FieldLabel htmlFor="confirm-password">비밀번호 확인</FieldLabel>
          <Input
            aria-describedby="password-requirements"
            aria-invalid={confirmPassword.length > 0 && !passwordsMatch || undefined}
            autoComplete="new-password"
            className={authInputClass}
            id="confirm-password"
            maxLength={128}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="••••••••••••"
            required
            type="password"
            value={confirmPassword}
          />
        </div>

        <div className="mt-4 grid min-h-[62px] grid-cols-2 content-center gap-x-3 gap-y-1 rounded-[10px] bg-tv-canvas px-3.5 py-2 text-[11px] font-medium" id="password-requirements">
          {rules.map(([label, complete]) => (
            <span className={complete ? "inline-flex items-center gap-1 text-tv-green-700" : "inline-flex items-center gap-1 text-tv-slate"} key={label}>
              <Check aria-hidden="true" className="size-3" strokeWidth={2} /> {label}
            </span>
          ))}
        </div>

        {feedback ? <AuthFeedback className="mt-3" tone={feedback.tone}>{feedback.message}</AuthFeedback> : null}

        <SubmitButton className="mt-4 gap-2" pending={pending}>
          {pending ? "변경 중…" : <>비밀번호 변경하고 로그인 <ArrowRight aria-hidden="true" className="size-4" /></>}
        </SubmitButton>
      </form>
    </AuthPageShell>
  );
}
