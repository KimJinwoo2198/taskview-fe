import { proxyAuthenticatedToBackend, rejectCrossSiteMutation } from "@/lib/backend";

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const rejected = rejectCrossSiteMutation(request);
  if (rejected) return rejected;
  const { id } = await context.params;
  return proxyAuthenticatedToBackend(`/v1/workspaces/${encodeURIComponent(id)}/onboarding/complete`, {
    method: "POST",
    body: await request.text(),
  });
}
