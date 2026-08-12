import type { Audience, Role, TaskView, ViewStatus } from "@/lib/types";

export const audienceLabels: Record<Audience, string> = {
  product: "제품",
  operations: "운영",
  support: "고객지원",
  executive: "경영진",
};

export const roleLabels: Record<Role, string> = {
  requester: "요청자",
  data_owner: "데이터 소유자",
  admin: "관리자",
};

export const statusLabels: Record<ViewStatus, string> = {
  proposed: "승인 대기",
  approved: "승인됨",
  rejected: "수정 필요",
  blocked: "정책 차단",
};

export const sourceLabels: Record<TaskView["plan"]["selected_sources"][number], string> = {
  product: "제품 이벤트",
  operations: "운영 데이터",
  voc: "고객의 소리",
};

export function formatDate(value: string, includeTime = false) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...(includeTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(new Date(value));
}

export function shortId(value: string) {
  return value.length > 16 ? `${value.slice(0, 8)}…${value.slice(-4)}` : value;
}
