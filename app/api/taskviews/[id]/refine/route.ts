import { proxyToBackend } from "@/lib/backend";

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return proxyToBackend(`/v1/taskviews/${encodeURIComponent(id)}/refine`, {
    method: "POST",
    body: await request.text(),
  });
}

