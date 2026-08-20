"use client";

import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  LoaderCircle,
  MailCheck,
  ShieldCheck,
  UserRoundCheck,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import {
  AuthFeedback,
  AuthPageShell,
  primaryCtaClass,
  secondaryCtaClass,
} from "@/components/taskview/auth/shared";
import { Button } from "@/components/ui/button";
import { safeReturnTo, withReturnTo } from "@/lib/safe-return-to";
import type { User } from "@/lib/types";

type ScreenPhase =
  | "checking"
  | "signed-out"
  | "unverified"
  | "ready"
  | "accepting"
  | "success"
  | "error";
type ErrorKind = "email-mismatch" | "invalid-invitation" | "unavailable";

interface ErrorPayload {
  detail?: unknown;
}

function invitationPath(token?: string) {
  if (!token) return "/workspace-invitations/accept";
  const query = new URLSearchParams({ token });
  return `/workspace-invitations/accept?${query.toString()}`;
}

async function responseDetail(response: Response, fallback: string) {
  const payload = (await response.json().catch(() => null)) as ErrorPayload | null;
  return typeof payload?.detail === "string" ? payload.detail : fallback;
}

export function InvitationAcceptScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenInput = searchParams.get("token");
  const token =
    tokenInput && tokenInput.length >= 32 && tokenInput.length <= 256
      ? tokenInput
      : undefined;
  const [phase, setPhase] = useState<ScreenPhase>(token ? "checking" : "error");
  const [email, setEmail] = useState<string | null>(null);
  const [errorKind, setErrorKind] = useState<ErrorKind>(
    token ? "unavailable" : "invalid-invitation",
  );
  const [errorMessage, setErrorMessage] = useState(
    token
      ? "초대 정보를 확인하지 못했습니다. 잠시 후 다시 시도해주세요."
      : "초대 토큰이 없거나 올바르지 않습니다. 메일의 초대 링크를 다시 확인해주세요.",
  );

  const returnTo = safeReturnTo(invitationPath(token));
  const loginHref = withReturnTo("/login", returnTo);
  const signupHref = withReturnTo("/signup", returnTo);
  const verifyHref = withReturnTo(
    email ? `/verify-email?email=${encodeURIComponent(email)}` : "/verify-email",
    returnTo,
  );

  async function checkSession() {
    if (!token) return;
    setPhase("checking");
    try {
      const response = await fetch("/api/auth/me", { cache: "no-store" });
      if (!response.ok) {
        throw new Error(
          await responseDetail(response, "로그인 상태를 확인하지 못했습니다."),
        );
      }
      const user = (await response.json()) as User | null;
      if (!user) {
        setPhase("signed-out");
        return;
      }
      setEmail(user.email);
      setPhase(user.email_verified === false ? "unverified" : "ready");
    } catch (cause) {
      setErrorKind("unavailable");
      setErrorMessage(
        cause instanceof Error
          ? cause.message
          : "로그인 상태를 확인하지 못했습니다.",
      );
      setPhase("error");
    }
  }

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();

    async function loadSession() {
      try {
        const response = await fetch("/api/auth/me", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(
            await responseDetail(response, "로그인 상태를 확인하지 못했습니다."),
          );
        }
        const user = (await response.json()) as User | null;
        if (!user) {
          setPhase("signed-out");
          return;
        }
        setEmail(user.email);
        setPhase(user.email_verified === false ? "unverified" : "ready");
      } catch (cause) {
        if (controller.signal.aborted) return;
        setErrorKind("unavailable");
        setErrorMessage(
          cause instanceof Error
            ? cause.message
            : "로그인 상태를 확인하지 못했습니다.",
        );
        setPhase("error");
      }
    }

    void loadSession();
    return () => controller.abort();
  }, [token]);

  async function acceptInvitation() {
    if (!token) return;
    setPhase("accepting");
    try {
      const response = await fetch("/api/workspace-invitations/accept", {
        method: "POST",
        cache: "no-store",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        const detail = await responseDetail(
          response,
          "초대를 수락하지 못했습니다. 잠시 후 다시 시도해주세요.",
        );
        if (response.status === 401) {
          setPhase("signed-out");
          return;
        }
        if (response.status === 403 && detail.includes("이메일 확인")) {
          setPhase("unverified");
          return;
        }
        setErrorKind(
          response.status === 403
            ? "email-mismatch"
            : response.status === 400
              ? "invalid-invitation"
              : "unavailable",
        );
        setErrorMessage(detail);
        setPhase("error");
        return;
      }

      window.history.replaceState(null, "", "/workspace-invitations/accept");
      setPhase("success");
      router.replace("/dashboard");
      router.refresh();
    } catch (cause) {
      setErrorKind("unavailable");
      setErrorMessage(
        cause instanceof Error
          ? cause.message
          : "초대를 수락하지 못했습니다. 잠시 후 다시 시도해주세요.",
      );
      setPhase("error");
    }
  }

  const presentation =
    phase === "checking"
      ? {
          Icon: LoaderCircle,
          iconClassName: "animate-spin text-tv-blue-500",
          title: "초대 정보를 확인하고 있어요",
          description: "안전한 세션과 초대 링크를 확인하는 중입니다.",
        }
      : phase === "signed-out"
        ? {
            Icon: MailCheck,
            iconClassName: "text-tv-blue-500",
            title: "워크스페이스에 초대받았어요",
            description: "초대받은 이메일 계정으로 로그인하거나 회원가입해주세요.",
          }
        : phase === "unverified"
          ? {
              Icon: ShieldCheck,
              iconClassName: "text-tv-blue-500",
              title: "이메일 확인이 필요해요",
              description: "초대받은 이메일을 확인한 뒤 안전하게 워크스페이스에 참여할 수 있어요.",
            }
          : phase === "ready" || phase === "accepting"
            ? {
                Icon: phase === "accepting" ? LoaderCircle : UserRoundCheck,
                iconClassName:
                  phase === "accepting"
                    ? "animate-spin text-tv-blue-500"
                    : "text-tv-blue-500",
                title:
                  phase === "accepting"
                    ? "워크스페이스에 참여하고 있어요"
                    : "초대를 수락할까요?",
                description: email
                  ? `${email} 계정으로 워크스페이스에 참여합니다.`
                  : "현재 로그인한 계정으로 워크스페이스에 참여합니다.",
              }
            : phase === "success"
              ? {
                  Icon: CheckCircle2,
                  iconClassName: "text-tv-green-700",
                  title: "워크스페이스에 참여했어요",
                  description: "대시보드로 안전하게 이동하고 있습니다.",
                }
              : {
                  Icon: CircleAlert,
                  iconClassName: "text-tv-red-600",
                  title:
                    errorKind === "email-mismatch"
                      ? "초대받은 이메일과 달라요"
                      : errorKind === "invalid-invitation"
                        ? "초대 링크를 사용할 수 없어요"
                        : "초대를 확인하지 못했어요",
                  description: errorMessage,
                };

  const { Icon } = presentation;

  return (
    <AuthPageShell
      cardClassName="min-h-[500px] px-6 pb-8 pt-11 text-center sm:px-10"
      cardDesktopTop="xl:top-[190px]"
      footer={
        <p className="text-[11px] leading-5 text-tv-slate">
          초대 링크는 전달하지 마세요. 링크에 문제가 있다면 워크스페이스 관리자에게 새 초대를 요청해주세요.
        </p>
      }
      footerClassName="xl:top-[728px]"
    >
      <div className="mx-auto grid size-24 place-items-center rounded-full bg-tv-blue-50">
        <Icon
          aria-hidden="true"
          className={`size-8 ${presentation.iconClassName}`}
          strokeWidth={1.7}
        />
      </div>
      <h1 className="mt-5 text-[26px] font-bold leading-[1.4] tracking-[-0.035em] text-tv-ink">
        {presentation.title}
      </h1>
      <p
        aria-live="polite"
        className="mx-auto mt-1 max-w-[360px] text-[13px] leading-[1.6] text-tv-gray"
        role={phase === "error" ? "alert" : "status"}
      >
        {presentation.description}
      </p>

      {phase === "ready" ? (
        <Button
          className={`${primaryCtaClass} mt-8 w-full gap-2`}
          onClick={acceptInvitation}
          type="button"
        >
          초대 수락하기
          <ArrowRight aria-hidden="true" className="size-4" />
        </Button>
      ) : null}

      {phase === "signed-out" ? (
        <div className="mt-8 grid gap-3">
          <Button asChild className={`${primaryCtaClass} w-full`}>
            <Link href={loginHref}>로그인하고 초대 수락</Link>
          </Button>
          <Button asChild className={`${secondaryCtaClass} w-full`} variant="outline">
            <Link href={signupHref}>계정 만들기</Link>
          </Button>
        </div>
      ) : null}

      {phase === "unverified" ? (
        <div className="mt-8 grid gap-3">
          <Button asChild className={`${primaryCtaClass} w-full`}>
            <Link href={verifyHref}>이메일 확인 계속하기</Link>
          </Button>
          <Button asChild className={`${secondaryCtaClass} w-full`} variant="outline">
            <Link href={loginHref}>다른 계정으로 로그인</Link>
          </Button>
        </div>
      ) : null}

      {phase === "error" ? (
        <div className="mt-8 grid gap-3">
          {errorKind === "unavailable" && token ? (
            <Button
              className={`${primaryCtaClass} w-full`}
              onClick={checkSession}
              type="button"
            >
              다시 시도
            </Button>
          ) : null}
          {errorKind === "email-mismatch" ? (
            <Button asChild className={`${primaryCtaClass} w-full`}>
              <Link href={loginHref}>초대받은 계정으로 로그인</Link>
            </Button>
          ) : null}
          <Button asChild className={`${secondaryCtaClass} w-full`} variant="outline">
            <Link href="/">홈으로 돌아가기</Link>
          </Button>
        </div>
      ) : null}

      {phase === "ready" ? (
        <AuthFeedback className="mt-4 text-left" tone="info">
          초대를 수락하면 이 워크스페이스의 정책과 부여된 역할이 계정에 적용됩니다.
        </AuthFeedback>
      ) : null}

      {phase === "checking" || phase === "accepting" || phase === "success" ? (
        <div className="mt-8 flex h-12 items-center justify-center gap-2 rounded-xl bg-tv-canvas text-[12px] text-tv-gray">
          {phase === "success" ? (
            <CheckCircle2 aria-hidden="true" className="size-4 text-tv-green-700" />
          ) : (
            <LoaderCircle aria-hidden="true" className="size-4 animate-spin text-tv-blue-500" />
          )}
          {phase === "checking"
            ? "세션 확인 중"
            : phase === "accepting"
              ? "초대 수락 중"
              : "대시보드로 이동 중"}
        </div>
      ) : null}
    </AuthPageShell>
  );
}
