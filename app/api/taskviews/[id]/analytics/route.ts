import { proxyAuthenticatedToBackend } from "@/lib/backend";

export const runtime = "nodejs";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const input = new URL(request.url).searchParams;
  const output = new URLSearchParams();
  for (const key of ["period_days", "region", "os", "cohort"]) {
    const value = input.get(key);
    if (value) output.set(key, value);
  }
  const query = output.size ? `?${output.toString()}` : "";
  return proxyAuthenticatedToBackend(`/v1/taskviews/${encodeURIComponent(id)}/analytics${query}`);
}
