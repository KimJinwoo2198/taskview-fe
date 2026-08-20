"use client";

import {
  Check,
  ChevronDown,
  Database,
  ExternalLink,
  Inbox,
  LayoutDashboard,
  Menu,
  Plus,
  Rows3,
  ScrollText,
  Settings,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { NeedexLogo } from "@/components/taskview/logo";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useSession } from "@/components/session-provider";
import { cn } from "@/lib/utils";

const navigation = [
  {
    label: "업무 공간",
    items: [
      { href: "/dashboard", label: "대시보드", icon: LayoutDashboard },
      { href: "/taskviews/new", label: "새 데이터 만들기", icon: Plus },
      { href: "/taskviews", label: "내 데이터 보기", icon: Rows3 },
      { href: "/approvals", label: "검토 요청", icon: Inbox },
    ],
  },
  {
    label: "데이터 관리",
    items: [
      { href: "/data-sources", label: "데이터 소스", icon: Database },
      { href: "/audit", label: "사용 기록", icon: ScrollText },
    ],
  },
];

function isCurrent(pathname: string, href: string) {
  const creationJourney = /^\/taskviews\/[^/]+\/(discovery|validation|approval-pending)$/.test(pathname);
  if (href === "/taskviews/new") return pathname.startsWith("/taskviews/new") || creationJourney;
  if (href === "/taskviews") return pathname === href || (/^\/taskviews\/[^/]+/.test(pathname) && !pathname.startsWith("/taskviews/new") && !creationJourney);
  if (href === "/approvals") return pathname.startsWith("/approvals") || pathname.startsWith("/reviews");
  if (href === "/data-sources") return pathname.startsWith(href);
  if (href === "/audit") return pathname.startsWith(href) || pathname.startsWith("/evidence");
  return pathname === href;
}

interface Crumb {
  href?: string;
  label: string;
}

function routeContext(pathname: string): { crumbs: Crumb[]; title?: string } {
  if (pathname === "/dashboard") return { crumbs: [{ label: "Needex" }, { label: "대시보드" }] };
  if (pathname === "/taskviews/new") return { crumbs: [{ label: "Needex" }, { label: "새 데이터 만들기" }] };
  if (pathname.startsWith("/taskviews/new/discovery")) return { crumbs: [{ label: "Needex" }, { href: "/taskviews/new", label: "새 Task View" }, { label: "데이터 탐색" }] };
  if (pathname.startsWith("/taskviews/new/validation")) return { crumbs: [{ label: "Needex" }, { href: "/taskviews/new", label: "새 Task View" }, { label: "검증·정책" }] };
  if (pathname.startsWith("/taskviews/new/pending")) return { crumbs: [{ label: "Needex" }, { href: "/taskviews/new", label: "새 Task View" }, { label: "승인 대기" }] };
  if (pathname === "/taskviews") return { crumbs: [{ label: "Needex" }, { label: "내 데이터 보기" }] };
  if (/^\/taskviews\/[^/]+\/discovery/.test(pathname)) return { crumbs: [{ label: "Needex" }, { href: "/taskviews/new", label: "새 Task View" }, { label: "데이터 탐색" }] };
  if (/^\/taskviews\/[^/]+\/validation/.test(pathname)) return { crumbs: [{ label: "Needex" }, { href: "/taskviews/new", label: "새 Task View" }, { label: "검증·정책" }] };
  if (/^\/taskviews\/[^/]+\/approval-pending/.test(pathname)) return { crumbs: [{ label: "Needex" }, { href: "/taskviews", label: "Task Views" }, { label: "승인 대기" }] };
  if (/^\/taskviews\/[^/]+\/dashboard/.test(pathname)) return { crumbs: [{ label: "Task Views" }, { href: pathname.replace(/\/dashboard$/, ""), label: "Task View" }, { label: "Dashboard" }] };
  if (/^\/taskviews\/[^/]+/.test(pathname)) return { crumbs: [{ label: "Task Views" }, { label: "Task View" }] };
  if (pathname === "/approvals") return { crumbs: [{ label: "Needex" }, { label: "검토 요청" }] };
  if (/^\/reviews\/[^/]+/.test(pathname)) return { crumbs: [{ label: "승인 요청" }, { label: "REQ-024" }] };
  if (pathname === "/data-sources") return { crumbs: [{ label: "Needex" }, { label: "데이터 소스" }] };
  if (pathname === "/data-sources/connect") return { crumbs: [{ label: "데이터 소스" }, { label: "새 소스 연결" }] };
  if (pathname === "/data-sources/connect/complete") return { crumbs: [{ label: "데이터 소스" }, { label: "스캔 완료" }] };
  if (/^\/data-sources\/[^/]+/.test(pathname)) return { crumbs: [{ label: "데이터 소스" }, { label: "Seoul Product DB" }] };
  if (pathname === "/audit") return { crumbs: [{ label: "Needex" }, { label: "사용 기록" }] };
  if (pathname.startsWith("/evidence")) return { crumbs: [{ href: "/audit", label: "Audit Log" }, { label: "Evidence Contract" }] };
  if (pathname.startsWith("/settings")) return { crumbs: [{ label: "Settings" }, { label: pathname.split("/").at(-1)?.replaceAll("-", " ") ?? "Workspace" }] };
  if (pathname === "/account") return { crumbs: [{ label: "Account" }, { label: "보안" }] };
  return { crumbs: [{ label: "Needex" }] };
}

function TopbarActions({ pathname }: { pathname: string }) {
  if (pathname === "/dashboard") {
    return (
      <>
        <Button className="h-10 rounded-[10px] px-4 text-[12px] text-tv-slate-dark" variant="outline">최근 7일</Button>
        <Button asChild className="h-10 rounded-[10px] px-4 text-[12px]">
          <Link href="/taskviews/new"><Plus className="size-4" />새 Task View 만들기</Link>
        </Button>
      </>
    );
  }

  if (pathname === "/taskviews/new" || pathname.includes("/discovery")) {
    return (
      <>
        <span className="rounded-full bg-tv-subtle px-3 py-2 text-[11px] text-tv-gray">임시 저장됨</span>
        <Button asChild className="h-10 rounded-[10px] px-5 text-[12px]" variant="outline"><Link href="/dashboard">나가기</Link></Button>
      </>
    );
  }

  if (pathname.includes("/validation")) {
    return (
      <>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-tv-teal-50 px-3 py-2 text-[11px] font-medium text-tv-teal-700"><Check className="size-3.5" />Purpose 저장됨</span>
        <Button asChild className="h-10 rounded-[10px] px-5 text-[12px]" variant="outline"><Link href="/taskviews">작업 취소</Link></Button>
      </>
    );
  }

  if (/^\/reviews\/[^/]+/.test(pathname)) {
    return (
      <>
        <span className="rounded-full bg-tv-subtle px-3 py-2 text-[11px] font-medium text-tv-slate-dark">Queue 1 / 3</span>
        <Button asChild className="h-10 rounded-[10px] px-5 text-[12px]" variant="outline"><Link href="/approvals">나중에 검토</Link></Button>
      </>
    );
  }

  if (pathname === "/taskviews") {
    return <Button asChild className="h-10 rounded-[10px] px-5 text-[12px]"><Link href="/taskviews/new"><Plus className="size-4" />새 Task View</Link></Button>;
  }

  if (pathname === "/data-sources") {
    return <Button asChild className="h-10 rounded-[10px] px-5 text-[12px]"><Link href="/data-sources/connect"><Plus className="size-4" />데이터 소스 연결</Link></Button>;
  }

  return null;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopNavigation, setDesktopNavigation] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const context = useMemo(() => routeContext(pathname), [pathname]);
  const navigationRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const query = window.matchMedia("(min-width: 768px)");
    const sync = () => setDesktopNavigation(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!mobileOpen || desktopNavigation) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.requestAnimationFrame(() => closeButtonRef.current?.focus());
    return () => { document.body.style.overflow = previousOverflow; };
  }, [desktopNavigation, mobileOpen]);

  function closeMobileNavigation(restoreFocus = true) {
    setMobileOpen(false);
    if (restoreFocus) window.requestAnimationFrame(() => menuButtonRef.current?.focus());
  }

  function handleNavigationKeyDown(event: React.KeyboardEvent<HTMLElement>) {
    if (desktopNavigation || !mobileOpen) return;
    if (event.key === "Escape") {
      event.preventDefault();
      closeMobileNavigation();
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = Array.from(navigationRef.current?.querySelectorAll<HTMLElement>('a[href], button:not(:disabled), [tabindex]:not([tabindex="-1"])') ?? []).filter((element) => !element.hasAttribute("inert"));
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  async function handleLogout() {
    setLoggingOut(true);
    await logout();
  }

  return (
    <div className="min-h-screen w-full max-w-[100vw] overflow-x-clip overscroll-none bg-tv-canvas text-tv-ink md:grid md:grid-cols-[240px_minmax(0,1fr)]">
      <a className="fixed left-4 top-[-48px] z-[100] rounded-lg bg-white px-4 py-2 text-sm shadow focus:top-4" href="#main-content">본문으로 건너뛰기</a>

      <aside
        aria-hidden={!desktopNavigation && !mobileOpen || undefined}
        aria-label="주요 탐색"
        aria-modal={!desktopNavigation && mobileOpen || undefined}
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-tv-border bg-white px-4 py-5 transition-transform duration-200 md:sticky md:top-0 md:h-screen md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
        id="workspace-navigation"
        inert={!desktopNavigation && !mobileOpen || undefined}
        onKeyDown={handleNavigationKeyDown}
        ref={navigationRef}
        role={!desktopNavigation ? "dialog" : undefined}
      >
        <div className="flex items-start justify-between px-1">
          <NeedexLogo />
          <Button aria-label="메뉴 닫기" className="md:hidden" onClick={() => closeMobileNavigation()} ref={closeButtonRef} size="icon" variant="ghost"><X aria-hidden="true" className="size-5" /></Button>
        </div>

        <nav className="mt-9 flex-1 space-y-8 overflow-y-auto tv-scrollbar">
          {navigation.map((group) => (
            <div key={group.label}>
              <p className="px-0 text-[10px] font-semibold tracking-[0.01em] text-tv-slate">{group.label}</p>
              <ul className="mt-2 space-y-1">
                {group.items.map((item) => {
                  const active = isCurrent(pathname, item.href);
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "group flex h-10 items-center gap-3 rounded-[10px] px-3 text-[13px] font-medium transition-colors",
                          active ? "bg-tv-blue-50 text-tv-blue-600" : "text-tv-slate-dark hover:bg-tv-subtle hover:text-tv-ink",
                        )}
                        href={item.href}
                        onClick={() => closeMobileNavigation()}
                      >
                        <Icon aria-hidden="true" className={cn("size-4", active ? "text-tv-blue-500" : "text-tv-slate")} strokeWidth={1.8} />
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="mt-4 flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-tv-subtle" type="button">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-tv-blue-50 text-[12px] font-semibold text-tv-blue-600">{user.display_name.slice(0, 1).toUpperCase()}</span>
              <span className="min-w-0 flex-1">
                <strong className="block truncate text-[12px] font-semibold text-tv-ink">{user.display_name || "Product Team"}</strong>
                <span className="block truncate text-[10px] text-tv-gray">Seoul · KR</span>
              </span>
              <ChevronDown aria-hidden="true" className="size-4 text-tv-slate" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem asChild><Link href="/account" onClick={() => closeMobileNavigation()}><Settings />계정 및 보안</Link></DropdownMenuItem>
            <DropdownMenuItem asChild><Link href="/settings/workspace" onClick={() => closeMobileNavigation()}><ExternalLink />워크스페이스 설정</Link></DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled={loggingOut} onSelect={() => void handleLogout()}>{loggingOut ? "로그아웃 중…" : "로그아웃"}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </aside>

      {mobileOpen ? <button aria-label="메뉴 닫기" className="fixed inset-0 z-40 bg-tv-ink/25 backdrop-blur-[1px] md:hidden" onClick={() => closeMobileNavigation()} type="button" /> : null}

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-tv-border bg-white/95 px-4 backdrop-blur md:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <Button aria-controls="workspace-navigation" aria-expanded={mobileOpen} aria-label="메뉴 열기" className="-ml-2 md:hidden" onClick={() => setMobileOpen(true)} ref={menuButtonRef} size="icon" variant="ghost"><Menu aria-hidden="true" className="size-5" /></Button>
            <nav aria-label="현재 위치" className="flex min-w-0 items-center gap-2 text-[12px]">
              {context.crumbs.map((crumb, index) => (
                <span className="flex min-w-0 items-center gap-2" key={`${crumb.label}-${index}`}>
                  {index ? <span aria-hidden="true" className="text-tv-border">/</span> : null}
                  {crumb.href ? <Link className="truncate text-tv-slate transition-colors hover:text-tv-blue-500" href={crumb.href}>{crumb.label}</Link> : <span className={cn("truncate", index === context.crumbs.length - 1 ? "font-semibold text-tv-ink" : "text-tv-slate")}>{crumb.label}</span>}
                </span>
              ))}
            </nav>
          </div>
          <div className="ml-4 hidden items-center gap-2 sm:flex"><TopbarActions pathname={pathname} /></div>
        </header>
        <main className="min-w-0" id="main-content" tabIndex={-1}>{children}</main>
      </div>
    </div>
  );
}
