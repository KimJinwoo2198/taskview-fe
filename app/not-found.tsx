import Link from "next/link";

export default function NotFound() {
  return (
    <main className="standaloneState">
      <div className="emptyState">
        <span className="emptyGlyph">404</span>
        <p className="kicker">NOT FOUND</p>
        <h1>요청한 페이지를 찾을 수 없습니다.</h1>
        <p>주소가 바뀌었거나 접근할 수 없는 Task View일 수 있습니다.</p>
        <Link className="primaryLink" href="/dashboard">대시보드로 이동 <span>→</span></Link>
      </div>
    </main>
  );
}
