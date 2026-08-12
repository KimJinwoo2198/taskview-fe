"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { useSession } from "@/components/session-provider";
import { roleLabels } from "@/lib/presentation";

const baseNavigation = [
  { href: "/dashboard", label: "대시보드", glyph: "⌂" },
  { href: "/taskviews", label: "Task Views", glyph: "▤" },
  { href: "/taskviews/new", label: "새 요청", glyph: "+" },
];

function isCurrent(pathname: string, href: string) {
  if (href === "/taskviews") return pathname === href || (/^\/taskviews\/[^/]+$/.test(pathname));
  return pathname === href;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const canReview = user.role === "data_owner" || user.role === "admin";
  const navigation = canReview
    ? [...baseNavigation, { href: "/reviews", label: "검토함", glyph: "✓" }]
    : baseNavigation;

  async function handleLogout() {
    setLoggingOut(true);
    await logout();
  }

  return (
    <div className="appFrame">
      <a className="skipLink" href="#main-content">본문으로 건너뛰기</a>
      <aside className={`sideNav ${mobileOpen ? "isOpen" : ""}`}>
        <div className="navHeader">
          <Link className="brand" href="/dashboard" onClick={() => setMobileOpen(false)}>
            <span className="brandMark">TV</span>
            <span>TaskView</span>
          </Link>
          <button className="navClose" aria-label="메뉴 닫기" onClick={() => setMobileOpen(false)} type="button">×</button>
        </div>
        <div className="localBadge"><span className="liveDot" />LOCAL INTELLIGENCE</div>
        <nav className="primaryNav" aria-label="주요 메뉴">
          <p>WORKSPACE</p>
          {navigation.map((item) => (
            <Link
              aria-current={isCurrent(pathname, item.href) ? "page" : undefined}
              className={isCurrent(pathname, item.href) ? "active" : ""}
              href={item.href}
              key={item.href}
              onClick={() => setMobileOpen(false)}
            >
              <span className="navGlyph" aria-hidden="true">{item.glyph}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="navFootnote">
          <p>POLICY ENGINE</p>
          <strong><span className="liveDot" /> 2026.08 적용 중</strong>
          <small>목적 제한 · 최소화 · Evidence</small>
        </div>
      </aside>

      {mobileOpen && <button className="navBackdrop" aria-label="메뉴 닫기" onClick={() => setMobileOpen(false)} type="button" />}

      <div className="appBody">
        <header className="appTopbar">
          <button className="menuButton" aria-label="메뉴 열기" onClick={() => setMobileOpen(true)} type="button">☰</button>
          <div className="topbarContext"><span className="liveDot" /><span>Qwen 3.5 · PostgreSQL</span></div>
          <div className="accountArea">
            <div className="userAvatar" aria-hidden="true">{user.display_name.slice(0, 1).toUpperCase()}</div>
            <div className="accountName"><strong>{user.display_name}</strong><small>{roleLabels[user.role]}</small></div>
            <button className="textButton" disabled={loggingOut} onClick={handleLogout} type="button">{loggingOut ? "종료 중…" : "로그아웃"}</button>
          </div>
        </header>
        <main className="pageCanvas" id="main-content">{children}</main>
        <footer className="appFooter"><span>TaskView Prototype</span><span>Local-first · Auditable · Purpose-bound</span></footer>
      </div>
    </div>
  );
}
