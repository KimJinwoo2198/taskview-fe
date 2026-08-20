"use client";

import type { LucideIcon } from "lucide-react";
import { ArrowRight, Building2, CircleAlert, Code2, Inbox, RotateCcw, ShieldCheck, Trash2, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export type AdminTone = "neutral" | "primary" | "success" | "warning" | "danger" | "safe";

const toneStyles: Record<AdminTone, string> = {
  neutral: "border-transparent bg-tv-subtle text-tv-gray",
  primary: "border-transparent bg-tv-blue-50 text-tv-blue-600",
  success: "border-transparent bg-tv-green-50 text-tv-green-700",
  warning: "border-transparent bg-tv-amber-50 text-tv-amber-700",
  danger: "border-transparent bg-tv-red-50 text-tv-red-700",
  safe: "border-transparent bg-tv-teal-50 text-tv-teal-700",
};

export function AdminPage({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("tv-page bg-white", className)}>{children}</div>;
}

export function AdminPanel({ children, className, ...props }: React.ComponentProps<"section">) {
  return <section className={cn("rounded-[14px] border border-tv-border bg-white", className)} {...props}>{children}</section>;
}

export function AdminBadge({ children, tone = "neutral", className }: { children: ReactNode; tone?: AdminTone; className?: string }) {
  return (
    <Badge className={cn("!h-auto min-h-[26px] max-w-full whitespace-normal rounded-full px-3 py-1 text-center text-[11px] font-medium shadow-none", toneStyles[tone], className)} variant="outline">
      {children}
    </Badge>
  );
}

export function PageTitle({
  title,
  description,
  action,
  badge,
  className,
}: {
  title: ReactNode;
  description: ReactNode;
  action?: ReactNode;
  badge?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("flex min-h-[58px] items-start justify-between gap-6", className)}>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-[28px] font-bold leading-[34px] tracking-[-0.035em] text-tv-ink">{title}</h1>
          {badge}
        </div>
        <p className="mt-0.5 text-[12px] leading-5 text-tv-gray">{description}</p>
      </div>
      {action ? <div className="shrink-0 max-sm:hidden">{action}</div> : null}
    </header>
  );
}

export function SectionHeading({
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
        {description ? <p className="mt-0.5 text-[10px] leading-[18px] text-tv-slate">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function ApiFallbackNotice({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col gap-2 rounded-[10px] border border-tv-blue-100 bg-tv-blue-50 px-3.5 py-2.5 text-[10px] leading-4 text-tv-blue-700 sm:flex-row sm:items-center sm:justify-between">
      <span>{message ?? "데모 모드가 활성화되어 Figma 예시 데이터를 표시합니다. 실제 운영 데이터가 아닙니다."}</span>
      {onRetry ? (
        <button className="shrink-0 font-semibold underline-offset-2 hover:underline" onClick={onRetry} type="button">
          다시 시도
        </button>
      ) : null}
    </div>
  );
}

export function AdminErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <AdminPanel className="grid min-h-[280px] place-items-center p-6 text-center" role="alert">
      <div className="max-w-md">
        <CircleAlert className="mx-auto size-8 text-tv-red-600" />
        <h2 className="mt-4 text-[16px] font-bold text-tv-ink">데이터를 불러오지 못했습니다.</h2>
        <p className="mt-2 text-[11px] leading-5 text-tv-gray">{message}</p>
        {onRetry ? <Button className="mt-5 h-9 rounded-[10px]" onClick={onRetry} variant="outline"><RotateCcw className="size-4" />다시 시도</Button> : null}
      </div>
    </AdminPanel>
  );
}

export function AdminEmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <AdminPanel className="grid min-h-[260px] place-items-center p-6 text-center">
      <div className="max-w-md">
        <Inbox className="mx-auto size-8 text-tv-slate" />
        <h2 className="mt-4 text-[16px] font-bold text-tv-ink">{title}</h2>
        <p className="mt-2 text-[11px] leading-5 text-tv-gray">{description}</p>
        {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
      </div>
    </AdminPanel>
  );
}

export function MiniSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div aria-label="데이터를 불러오는 중" aria-live="polite" className="space-y-3 py-3" role="status">
      {Array.from({ length: rows }, (_, index) => (
        <div className="h-14 animate-pulse rounded-[10px] bg-tv-subtle" key={index} />
      ))}
    </div>
  );
}

export function ConfirmAction({
  trigger,
  title,
  description,
  confirmLabel,
  onConfirm,
}: {
  trigger: ReactNode;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void | Promise<void>;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-[420px] rounded-[14px] p-5">
        <DialogHeader>
          <DialogTitle className="text-[16px] font-bold text-tv-ink">{title}</DialogTitle>
          <DialogDescription className="text-[12px] leading-5 text-tv-gray">{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="-mx-5 -mb-5 mt-2 px-5 py-4">
          <DialogClose asChild>
            <Button className="h-9 rounded-[10px] px-4" variant="outline">취소</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button className="h-9 rounded-[10px] px-4" onClick={() => void onConfirm()} variant="destructive">
              <Trash2 aria-hidden="true" className="size-3.5" />{confirmLabel}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const settingsItems: Array<{ href: string; label: string; icon: LucideIcon }> = [
  { href: "/settings/workspace", label: "Workspace", icon: Building2 },
  { href: "/settings/policy", label: "Policy", icon: ShieldCheck },
  { href: "/settings/team", label: "Team & Roles", icon: Users },
  { href: "/settings/integrations", label: "API & Integrations", icon: Code2 },
];

export function SettingsColumns({
  children,
  account = false,
}: {
  children: ReactNode;
  account?: boolean;
}) {
  const pathname = usePathname();
  const items = account
    ? [
        { href: "/account#profile", label: "프로필", icon: Users },
        { href: "/account#security", label: "로그인 & 보안", icon: ShieldCheck },
        { href: "/account#notifications", label: "알림", icon: Code2 },
      ]
    : settingsItems;

  return (
    <div className="mt-[22px] grid min-h-[768px] gap-3 lg:grid-cols-[232px_minmax(0,1fr)]">
      <aside className="flex flex-col rounded-[14px] border border-tv-border bg-white p-2" aria-label={account ? "내 계정 설정" : "워크스페이스 설정"}>
        <p className="px-2 pb-2 pt-1 text-[9px] font-semibold text-tv-slate">{account ? "MY ACCOUNT" : "SETTINGS"}</p>
        <nav className="space-y-1">
          {items.map(({ href, label, icon: Icon }) => {
            const active = account ? pathname === "/account" && href.endsWith("#profile") : pathname === href;
            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-10 items-center gap-2 rounded-[10px] px-3 text-[12px] font-medium transition-colors",
                  active ? "bg-tv-blue-50 text-tv-blue-600" : "text-tv-gray hover:bg-tv-subtle hover:text-tv-ink",
                )}
                href={href}
                key={href}
              >
                <Icon aria-hidden="true" className="size-4" strokeWidth={1.8} />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto rounded-[10px] bg-tv-canvas p-3">
          <p className="text-[10px] font-bold text-tv-ink">{account ? "워크스페이스 설정" : "관리 권한"}</p>
          <p className="mt-2 text-[9px] leading-4 text-tv-gray">
            {account ? "Global Product Workspace" : "Policy와 팀 역할 변경은 Admin 권한이 필요합니다."}
          </p>
          {account ? (
            <Link className="mt-2 inline-flex items-center gap-1 text-[9px] font-semibold text-tv-blue-600" href="/settings/workspace">
              관리 설정으로 <ArrowRight className="size-3" />
            </Link>
          ) : (
            <AdminBadge className="mt-3 h-5 px-2 text-[9px]" tone="primary">Security Admin</AdminBadge>
          )}
        </div>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function DefinitionRows({ rows, className }: { rows: Array<[ReactNode, ReactNode]>; className?: string }) {
  return (
    <dl className={cn("space-y-4", className)}>
      {rows.map(([term, value], index) => (
        <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-4 text-[10px] leading-4" key={index}>
          <dt className="text-tv-slate">{term}</dt>
          <dd className="font-medium text-tv-ink">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
