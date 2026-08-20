"use client";

import { AlertTriangle, Check, CircleAlert, LoaderCircle, RotateCcw, Sparkles } from "lucide-react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { CoreTone } from "./model";

const toneClass: Record<CoreTone, string> = {
  neutral: "bg-tv-subtle text-tv-slate-dark",
  primary: "bg-tv-blue-50 text-tv-blue-500",
  success: "bg-tv-green-50 text-tv-green-700",
  warning: "bg-tv-amber-50 text-tv-amber-700",
  danger: "bg-tv-red-50 text-tv-red-700",
  safe: "bg-tv-teal-50 text-tv-teal-700",
};

export function CorePage({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("tv-page flex min-w-0 flex-col gap-4 bg-white", className)}>{children}</div>;
}

export function CorePanel({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn("rounded-[16px] border border-tv-border bg-white", className)}>{children}</section>;
}

export function CoreHeading({
  title,
  description,
  size = "md",
  aside,
}: {
  title: ReactNode;
  description?: ReactNode;
  size?: "sm" | "md" | "lg";
  aside?: ReactNode;
}) {
  return (
    <header className="flex min-h-14 items-start justify-between gap-5">
      <div className="min-w-0">
        <h1 className={cn("font-bold tracking-[-0.035em] text-tv-ink", size === "sm" ? "text-[22px] leading-[26px]" : size === "lg" ? "text-[28px] leading-[34px]" : "text-[26px] leading-[31px]")}>{title}</h1>
        {description ? <p className="mt-1 text-[12px] leading-[17px] text-tv-gray">{description}</p> : null}
      </div>
      {aside ? <div className="shrink-0">{aside}</div> : null}
    </header>
  );
}

export function SectionHeading({ title, description, aside, className }: { title: ReactNode; description?: ReactNode; aside?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div className="min-w-0">
        <h2 className="text-[16px] font-bold leading-[21px] tracking-[-0.02em] text-tv-ink">{title}</h2>
        {description ? <p className="mt-1 text-[10px] leading-[15px] text-tv-slate">{description}</p> : null}
      </div>
      {aside ? <div className="shrink-0">{aside}</div> : null}
    </div>
  );
}

export function CorePill({ children, tone = "neutral", className }: { children: ReactNode; tone?: CoreTone; className?: string }) {
  return <span className={cn("inline-flex min-h-6 max-w-full items-center justify-center gap-1.5 whitespace-normal rounded-full px-2.5 py-1 text-center text-[10px] font-medium", toneClass[tone], className)}>{children}</span>;
}

export function StatusDot({ tone = "primary" }: { tone?: CoreTone }) {
  return <span aria-hidden="true" className={cn("size-2 rounded-full", tone === "success" || tone === "safe" ? "bg-tv-teal-600" : tone === "warning" ? "bg-tv-amber-600" : tone === "danger" ? "bg-tv-red-600" : "bg-tv-blue-500")} />;
}

export const steps = ["하고 싶은 일", "데이터 확인", "개인정보 확인", "결과 만들기"];

export function CoreStepper({ current }: { current: number }) {
  return (
    <ol aria-label="Task View 생성 단계" className="grid min-h-14 grid-cols-2 items-center rounded-[14px] border border-tv-border bg-tv-canvas px-4 sm:grid-cols-4 sm:px-5">
      {steps.map((label, index) => {
        const complete = index < current;
        const active = index === current;
        return (
          <li aria-current={active ? "step" : undefined} className="flex min-w-0 items-center gap-3" key={label}>
            <span className={cn("grid size-7 shrink-0 place-items-center rounded-full border text-[10px] font-bold", complete && "border-tv-green-50 bg-tv-green-50 text-tv-green-700", active && "border-tv-blue-500 bg-tv-blue-500 text-white", !complete && !active && "border-tv-border bg-white text-tv-slate")}>
              {complete ? <Check aria-label="완료" className="size-3.5" strokeWidth={2} /> : String(index + 1).padStart(2, "0")}
            </span>
            <span className={cn("truncate text-[12px] font-medium", active ? "text-tv-blue-500" : complete ? "text-tv-green-700" : "text-tv-gray")}>{label}</span>
          </li>
        );
      })}
    </ol>
  );
}

export function DemoNotice({ error, className }: { error?: string | null; className?: string }) {
  return (
    <div className={cn("flex items-center gap-2 rounded-xl border border-tv-blue-200 bg-tv-blue-50 px-3 py-2 text-[10px] leading-4 text-tv-blue-700", className)} role={error ? "alert" : "status"}>
      {error ? <AlertTriangle className="size-3.5 shrink-0" /> : <Sparkles className="size-3.5 shrink-0" />}
      <span>{error ? `${error} 화면 구조 확인을 위해 Figma 합성 예시를 표시합니다.` : "현재 영역은 Figma 합성 예시이며 실제 값으로 오인하지 않도록 분리해 표시합니다."}</span>
    </div>
  );
}

export function CoreLoading({ label = "Task View 데이터를 불러오고 있습니다." }: { label?: string }) {
  return (
    <div className="grid min-h-[520px] place-items-center" role="status">
      <div className="flex flex-col items-center gap-3 text-tv-gray">
        <LoaderCircle aria-hidden="true" className="size-7 animate-spin text-tv-blue-500" />
        <p className="text-[12px]">{label}</p>
      </div>
    </div>
  );
}

export function CoreError({ message, retry, href = "/taskviews" }: { message: string; retry?: () => void; href?: string }) {
  return (
    <div className="grid min-h-[520px] place-items-center p-6">
      <CorePanel className="max-w-md p-6 text-center">
        <CircleAlert className="mx-auto size-8 text-tv-red-600" />
        <h2 className="mt-4 text-lg font-bold text-tv-ink">화면을 불러오지 못했습니다.</h2>
        <p className="mt-2 text-[12px] leading-5 text-tv-gray">{message}</p>
        <div className="mt-5 flex justify-center gap-2">
          {retry ? <Button className="h-10 rounded-[10px]" onClick={retry} variant="outline"><RotateCcw className="size-4" />다시 시도</Button> : null}
          <Button asChild className="h-10 rounded-[10px]"><Link href={href}>목록으로</Link></Button>
        </div>
      </CorePanel>
    </div>
  );
}

export function CoreEmpty({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="grid min-h-[420px] place-items-center p-6">
      <CorePanel className="max-w-md p-6 text-center">
        <CircleAlert className="mx-auto size-8 text-tv-slate" />
        <h2 className="mt-4 text-lg font-bold text-tv-ink">{title}</h2>
        <p className="mt-2 text-[12px] leading-5 text-tv-gray">{description}</p>
        {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
      </CorePanel>
    </div>
  );
}

export function MetricTile({ label, value, meta, tone = "primary", icon: Icon }: { label: string; value: ReactNode; meta?: ReactNode; tone?: CoreTone; icon?: LucideIcon }) {
  return (
    <CorePanel className="flex min-h-[84px] items-center justify-between px-4 py-3">
      <div className="min-w-0">
        <p className="text-[10px] font-medium leading-[14px] text-tv-slate">{label}</p>
        <p className="mt-1 text-[15px] font-bold leading-5 text-tv-ink">{value}</p>
        {meta ? <p className="mt-1 truncate text-[9px] leading-3 text-tv-slate">{meta}</p> : null}
      </div>
      <span className={cn("grid size-8 shrink-0 place-items-center rounded-full", toneClass[tone])}>{Icon ? <Icon className="size-4" strokeWidth={1.8} /> : <Check className="size-4" strokeWidth={2} />}</span>
    </CorePanel>
  );
}

export function FieldTag({ children, tone = "neutral", className }: { children: ReactNode; tone?: CoreTone; className?: string }) {
  return <span className={cn("inline-flex h-[22px] items-center rounded-lg border border-tv-border bg-white px-2 text-[9px] font-medium text-tv-slate-dark", tone !== "neutral" && toneClass[tone], className)}>{children}</span>;
}

export function FooterActions({ note, children }: { note: ReactNode; children: ReactNode }) {
  return (
    <footer className="flex min-h-12 flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
      <p className="max-w-2xl text-[10px] leading-4 text-tv-slate">{note}</p>
      <div className="flex shrink-0 items-center justify-end gap-2">{children}</div>
    </footer>
  );
}
