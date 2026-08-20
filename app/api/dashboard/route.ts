import { proxyAuthenticatedToBackend } from "@/lib/backend";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const period = new URL(request.url).searchParams.get("period_days");
  const query = period ? `?period_days=${encodeURIComponent(period)}` : "";
  return proxyAuthenticatedToBackend(`/v1/dashboard${query}`);
}
