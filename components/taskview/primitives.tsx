import type { LucideIcon } from "lucide-react";
import { Check, CircleAlert } from "lucide-react";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn("tv-card", className)}>{children}</section>;
}

export function SectionTitle({
  title,
  description,
  action,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div className="min-w-0">
        <h2 className="text-[16px] font-bold leading-6 tracking-[-0.02em] text-tv-ink">{title}</h2>
        {description ? <p className="mt-1 text-[11px] leading-[1.55] text-tv-slate">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function PageHeading({
  title,
  description,
  badge,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  badge?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("flex min-h-14 items-start justify-between gap-6", className)}>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-[28px] font-bold leading-[1.2] tracking-[-0.035em] text-tv-ink">{title}</h1>
          {badge}
        </div>
        {description ? <p className="mt-1 text-[12px] leading-[1.6] text-tv-gray">{description}</p> : null}
      </div>
    </header>
  );
}

type Tone = "neutral" | "primary" | "success" | "warning" | "danger" | "safe";

const toneClasses: Record<Tone, string> = {
  neutral: "border-transparent bg-tv-subtle text-tv-slate-dark",
  primary: "border-transparent bg-tv-blue-50 text-tv-blue-600",
  success: "border-transparent bg-tv-green-50 text-tv-green-700",
  warning: "border-transparent bg-tv-amber-50 text-tv-amber-700",
  danger: "border-transparent bg-tv-red-50 text-tv-red-600",
  safe: "border-transparent bg-tv-teal-50 text-tv-teal-700",
};

export function ToneBadge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <Badge className={cn("!h-auto min-h-6 max-w-full whitespace-normal rounded-full px-2.5 py-1 text-center text-[11px] font-medium shadow-none", toneClasses[tone], className)} variant="outline">
      {children}
    </Badge>
  );
}

export function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = "primary",
}: {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  icon?: LucideIcon;
  tone?: Tone;
}) {
  return (
    <Panel className="flex min-h-21 items-center justify-between px-4 py-3.5">
      <div className="min-w-0">
        <p className="tv-label">{label}</p>
        <div className="mt-1 text-[15px] font-bold leading-6 text-tv-ink">{value}</div>
        {detail ? <p className="mt-0.5 text-[10px] leading-4 text-tv-slate">{detail}</p> : null}
      </div>
      <span className={cn("grid size-8 shrink-0 place-items-center rounded-full", toneClasses[tone])}>
        {Icon ? <Icon aria-hidden="true" className="size-4" strokeWidth={1.8} /> : <Check aria-hidden="true" className="size-4" strokeWidth={2} />}
      </span>
    </Panel>
  );
}

export function InlineNotice({
  children,
  tone = "primary",
  className,
}: {
  children: ReactNode;
  tone?: Exclude<Tone, "neutral">;
  className?: string;
}) {
  const Icon = tone === "danger" || tone === "warning" ? CircleAlert : Check;
  return (
    <div className={cn("flex items-start gap-2.5 rounded-xl px-3.5 py-3 text-[11px] leading-[1.55]", toneClasses[tone], className)}>
      <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0" strokeWidth={1.8} />
      <div>{children}</div>
    </div>
  );
}

export interface WorkflowStep {
  label: string;
  shortLabel?: string;
}

export function WorkflowSteps({ current, steps }: { current: number; steps: WorkflowStep[] }) {
  return (
    <ol aria-label="Task View 생성 단계" className="tv-card grid min-h-16 grid-cols-2 items-center gap-y-3 px-4 py-3 sm:grid-cols-4 sm:px-5">
      {steps.map((step, index) => {
        const complete = index < current;
        const active = index === current;
        return (
          <li aria-current={active ? "step" : undefined} className="flex min-w-0 items-center gap-3" key={step.label}>
            <span
              className={cn(
                "grid size-7 shrink-0 place-items-center rounded-full border text-[10px] font-semibold",
                complete && "border-tv-teal-50 bg-tv-teal-50 text-tv-teal-700",
                active && "border-tv-blue-500 bg-tv-blue-500 text-white",
                !complete && !active && "border-tv-border bg-white text-tv-slate",
              )}
            >
              {complete ? <Check aria-label="완료" className="size-3.5" strokeWidth={2} /> : String(index + 1).padStart(2, "0")}
            </span>
            <span className={cn("truncate text-[12px] font-medium", active ? "text-tv-blue-600" : complete ? "text-tv-teal-700" : "text-tv-gray")}>
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export const taskViewWorkflowSteps: WorkflowStep[] = [
  { label: "업무 목적" },
  { label: "데이터 탐색" },
  { label: "검증·정책" },
  { label: "Task View" },
];
