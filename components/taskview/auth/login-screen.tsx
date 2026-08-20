"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import {
  AuthFeedback,
  AuthHeading,
  AuthPageShell,
  FieldLabel,
  GoogleSsoLink,
  OrDivider,
  PasswordInput,
  SubmitButton,
  authInputClass,
} from "@/components/taskview/auth/shared";
import { Input } from "@/components/ui/input";
import { requestJson } from "@/lib/client-api";
import { resolvePostAuthPath, withReturnTo } from "@/lib/safe-return-to";
import type { User } from "@/lib/types";

function withVerificationEmail(path: string, email: string) {
  const parsed = new URL(path, "https://taskview.local");
  if (parsed.pathname !== "/verify-email") return path;
  parsed.searchParams.set("email", email);
  return `${parsed.pathname}${parsed.search}${parsed.hash}`;
}

export function LoginScreen({
  returnTo,
  resetComplete = false,
  oauthError = false,
}: {
  returnTo?: string;
  resetComplete?: boolean;
  oauthError?: boolean;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const result = await requestJson<{ user: User; next_path?: string }>("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      setPassword("");
      router.replace(
        withVerificationEmail(
          resolvePostAuthPath(result.next_path, returnTo),
          result.user.email,
        ),
      );
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "로그인하지 못했습니다.");
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthPageShell
      cardClassName="min-h-[610px] px-6 pb-7 pt-[42px] sm:px-10"
      cardDesktopTop="xl:top-[170px]"
      footer={
        <p className="text-[11px] leading-5 text-tv-slate">
          계속하면 Needex 이용약관 및 개인정보 처리방침에 동의한 것으로 간주됩니다.
        </p>
      }
      footerClassName="xl:top-[814px]"
    >
      <AuthHeading description="Needex 워크스페이스에 로그인하세요." title="다시 만나서 반가워요" />

      {resetComplete ? <AuthFeedback className="mt-4" tone="success">비밀번호가 변경되었습니다. 새 비밀번호로 로그인해주세요.</AuthFeedback> : null}
      {oauthError ? <AuthFeedback className="mt-4">Google 로그인을 완료하지 못했습니다. 관리자에게 OAuth 설정을 확인해주세요.</AuthFeedback> : null}

      <div className="mt-6">
        <GoogleSsoLink label="Google로 계속하기" />
      </div>
      <div className="mt-4">
        <OrDivider />
      </div>

      <form className="mt-[18px]" onSubmit={submit}>
        <div>
          <FieldLabel htmlFor="login-email">이메일</FieldLabel>
          <Input
            autoComplete="email"
            className={authInputClass}
            id="login-email"
            inputMode="email"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@company.com"
            required
            type="email"
            value={email}
          />
        </div>

        <div className="mt-3.5">
          <div className="mb-1 flex items-center justify-between gap-4">
            <FieldLabel className="mb-0" htmlFor="login-password">비밀번호</FieldLabel>
            <Link className="text-[12px] font-medium leading-5 text-tv-blue-500 hover:text-tv-blue-700" href="/forgot-password">
              비밀번호를 잊으셨나요?
            </Link>
          </div>
          <PasswordInput
            autoComplete="current-password"
            id="login-password"
            onChange={(event) => setPassword(event.target.value)}
            onToggle={() => setPasswordVisible((current) => !current)}
            value={password}
            visible={passwordVisible}
          />
        </div>

        {error ? <AuthFeedback className="mt-3">{error}</AuthFeedback> : null}

        <SubmitButton className="mt-5" pending={pending}>{pending ? "로그인 중…" : "로그인"}</SubmitButton>
      </form>

      <p className="mt-5 text-center text-[13px] leading-5 text-tv-gray">
        아직 계정이 없나요? <Link className="ml-1.5 font-bold text-tv-blue-500 hover:text-tv-blue-700" href={withReturnTo("/signup", returnTo)}>회원가입</Link>
      </p>

      <div className="mt-[22px] flex min-h-[54px] items-center gap-2.5 rounded-[10px] bg-tv-canvas px-3.5 text-[11px] leading-5 text-tv-gray">
        <Check aria-hidden="true" className="size-4 shrink-0 text-tv-green-700" strokeWidth={2} />
        로그인 후에도 원본 데이터 권한은 별도 정책에 따라 관리됩니다.
      </div>
    </AuthPageShell>
  );
}
