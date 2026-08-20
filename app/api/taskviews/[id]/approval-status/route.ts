import { proxyAuthenticatedToBackend } from "@/lib/backend";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return proxyAuthenticatedToBackend(`/v1/taskviews/${encodeURIComponent(id)}/approval-status`);
}
