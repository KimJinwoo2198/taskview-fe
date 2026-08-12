import { statusLabels } from "@/lib/presentation";
import type { ViewStatus } from "@/lib/types";

export function StatusBadge({ status }: { status: ViewStatus }) {
  return <span className={`statusBadge status-${status}`}><span aria-hidden="true" />{statusLabels[status]}</span>;
}
