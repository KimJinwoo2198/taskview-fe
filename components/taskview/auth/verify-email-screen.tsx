"use client";

import Link from "next/link";
import { ArrowRight, LoaderCircle, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { getFlowJson, postFlowJson } from "@/components/taskview/auth/api";
import { AuthFeedback, AuthPageShell, primaryCtaClass } from "@/components/taskview/auth/shared";
import { Button } from "@/components/ui/button";
import { safeReturnTo, withReturnTo } from "@/lib/safe-return-to";

type VerifyStatus = "idle" | "checking" | "resending";

function onboardingPath(status?: string) {
  if (status === "team_invite") return "/onboarding/invite";
  if (status === "complete") return "/dashboard";
  return "/onboarding/workspace";
}

export function VerifyEmailScreen({
  email = "name@company.com",
  token,
  returnTo,
}: {
  email?: string;
  token?: string;
  returnTo?: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<VerifyStatus>("idle");
  const [activeToken, setActiveToken] = useState(token);
  const [feedback, setFeedback] = useState<{ tone: "error" | "info" | "success"; message: string } | null>(null);

  async function checkVerification() {
    setStatus("checking");
    setFeedback(null);
    try {
      const result = activeToken
        ? await postFlowJson<{ verified: boolean; onboarding_status?: string }>(
            "/api/auth/email-verifications/confirm",
            { token: activeToken },
            "이메일 인증 확인 API가 아직 연결되지 않았습니다.",
          )
        : await getFlowJson<{ verified: boolean; onboarding_status?: string }>(
            "/api/auth/email-verifications/status",
            "이메일 인증 확인 API가 아직 연결되지 않았습니다.",
          );
      if (!result.verified) {
        setFeedback({ tone: "info", message: "아직 인증이 확인되지 않았습니다. 메일의 인증 링크를 먼저 눌러주세요." });
        return;
      }
      const invitationDestination = safeReturnTo(returnTo);
      setFeedback({
        tone: "success",
        message: invitationDestination
          ? "이메일 인증이 확인되었습니다. 워크스페이스 초대로 이동합니다."
          : "이메일 인증이 확인되었습니다. 다음 설정으로 이동합니다.",
      });
      router.replace(invitationDestination ?? onboardingPath(result.onboarding_status));
      router.refresh();
    } catch (cause) {
      setFeedback({ tone: "error", message: cause instanceof Error ? cause.message : "인증 상태를 확인하지 못했습니다." });
    } finally {
      setStatus("idle");
    }
  }

  async function resend() {
    setStatus("resending");
    setFeedback(null);
    try {
      const result = await postFlowJson<{ development_token?: string | null }>(
        "/api/auth/email-verifications/resend",
        { email },
        "인증 메일 재전송 API가 아직 연결되지 않았습니다.",
      );
      if (result.development_token) setActiveToken(result.development_token);
      setFeedback({ tone: "success", message: "인증 메일을 다시 보냈습니다. 새 링크는 30분 동안 유효합니다." });
    } catch (cause) {
      setFeedback({ tone: "error", message: cause instanceof Error ? cause.message : "인증 메일을 다시 보내지 못했습니다." });
    } finally {
      setStatus("idle");
    }
  }

  return (
    <AuthPageShell
      backHref={withReturnTo("/signup", returnTo)}
      backLabel="회원가입"
      cardClassName="min-h-[506px] px-6 pb-7 pt-[42px] text-center sm:px-10"
      cardDesktopTop="xl:top-[196px]"
      footer={<p className="text-[11px] leading-5 text-tv-slate">스팸함에서도 찾을 수 없다면 팀 관리자에게 문의하거나 이메일 주소를 변경하세요.</p>}
      footerClassName="xl:top-[738px]"
    >
      <div className="mx-auto grid size-24 place-items-center rounded-full bg-tv-blue-50 text-tv-blue-500">
        <Mail aria-hidden="true" className="size-8" strokeWidth={1.7} />
      </div>
      <h1 className="mt-5 text-[26px] font-bold leading-[1.4] tracking-[-0.035em] text-tv-ink">이메일을 확인해주세요</h1>
      <p className="mt-1 text-[13px] leading-[1.55] text-tv-gray">
        {email}으로 인증 링크를 보냈어요.
        <br />
        메일의 버튼을 누르면 워크스페이스 설정으로 이동합니다.
      </p>

      <div className="mt-[38px] flex min-h-[54px] items-center rounded-xl bg-tv-canvas px-3.5 text-left text-[12px] text-tv-gray">
        <span aria-hidden="true" className="mr-3 size-2 rounded-full bg-tv-green-700" />
        인증 메일 전송 완료 · 링크는 30분 동안 유효
      </div>

      {feedback ? <AuthFeedback className="mt-3 text-left" tone={feedback.tone}>{feedback.message}</AuthFeedback> : null}

      <Button className={`${primaryCtaClass} mt-5 w-full gap-2`} disabled={status !== "idle"} onClick={checkVerification} type="button">
        {status === "checking" ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : null}
        {status === "checking" ? "인증 확인 중…" : "메일 확인했어요"}
        {status === "idle" ? <ArrowRight aria-hidden="true" className="size-4" /> : null}
      </Button>

      <p className="mt-4 text-[12px] leading-5 text-tv-gray">
        메일이 오지 않았나요?{" "}
        <button className="font-medium text-tv-blue-500 hover:text-tv-blue-700 disabled:text-tv-slate" disabled={status !== "idle"} onClick={resend} type="button">
          {status === "resending" ? "재전송 중…" : "재전송"}
        </button>
      </p>
      <Link className="mt-2 inline-block text-[12px] font-medium leading-5 text-tv-blue-500 hover:text-tv-blue-700" href={withReturnTo(`/signup?email=${encodeURIComponent(email)}`, returnTo)}>
        이메일 주소 변경
      </Link>
    </AuthPageShell>
  );
}
