export function ErrorNotice({ message, onClose }: { message: string; onClose?: () => void }) {
  return (
    <div className="errorNotice" role="alert">
      <span className="noticeIcon" aria-hidden="true">!</span>
      <p>{message}</p>
      {onClose && <button aria-label="오류 닫기" onClick={onClose} type="button">×</button>}
    </div>
  );
}

export function PageLoading({ label = "데이터를 불러오고 있습니다." }: { label?: string }) {
  return (
    <div className="pageLoading" role="status">
      <span className="loadingMark" aria-hidden="true">✦</span>
      <p>{label}</p>
    </div>
  );
}

export function EmptyState({ eyebrow, title, description, action }: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="emptyState">
      <span className="emptyGlyph" aria-hidden="true">✦</span>
      <p className="kicker">{eyebrow}</p>
      <h2>{title}</h2>
      <p>{description}</p>
      {action}
    </div>
  );
}
