"use client";

import { useCallback, useEffect, useState } from "react";

import { requestJson } from "@/lib/client-api";
import type { TaskView } from "@/lib/types";

export function useTaskViews() {
  const [views, setViews] = useState<TaskView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setViews(await requestJson<TaskView[]>("/api/taskviews"));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Task View 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  return { views, loading, error, reload };
}
