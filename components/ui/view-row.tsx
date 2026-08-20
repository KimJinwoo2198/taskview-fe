import Link from "next/link";

import { StatusBadge } from "@/components/ui/status-badge";
import { audienceLabels, formatDate, shortId } from "@/lib/presentation";
import type { Needex } from "@/lib/types";

export function ViewRow({ view, showRequester = false }: { view: Needex; showRequester?: boolean }) {
  return (
    <Link className="viewRow" href={`/taskviews/${view.id}`}>
      <div className="viewIdentity">
        <span className="monoMeta">{shortId(view.id)}</span>
        <strong>{view.plan.purpose_spec.decision_to_support}</strong>
        {showRequester && view.requester && <small>요청자 {view.requester.display_name} · {view.requester.email}</small>}
      </div>
      <span className="viewAudience">{audienceLabels[view.audience]}</span>
      <span className="viewUtility"><strong>{view.utility.utility_score}</strong><small>/100</small></span>
      <StatusBadge status={view.status} />
      <time dateTime={view.created_at}>{formatDate(view.created_at)}</time>
      <span className="rowArrow" aria-hidden="true">→</span>
    </Link>
  );
}
