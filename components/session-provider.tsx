"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { requestJson } from "@/lib/client-api";
import type { User } from "@/lib/types";

interface SessionValue {
  user: User;
  logout: () => Promise<void>;
}

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void requestJson<User | null>("/api/auth/me")
      .then((nextUser) => {
        if (!active) return;
        if (!nextUser) {
          router.replace("/login");
          return;
        }
        setUser(nextUser);
      })
      .catch((cause) => {
        if (active) setError(cause instanceof Error ? cause.message : "세션을 확인하지 못했습니다.");
      });
    return () => { active = false; };
  }, [router]);

  async function logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  if (error) {
    return <main className="standaloneState"><div className="errorNotice" role="alert"><span className="noticeIcon">!</span><p>{error}</p><button onClick={() => location.reload()} type="button">다시 시도</button></div></main>;
  }
  if (!user) {
    return <main className="standaloneState"><div className="pageLoading" role="status"><span className="loadingMark">✦</span><p>안전한 세션을 확인하고 있습니다.</p></div></main>;
  }

  return <SessionContext.Provider value={{ user, logout }}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useSession은 SessionProvider 안에서 사용해야 합니다.");
  return value;
}
