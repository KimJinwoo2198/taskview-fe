import { proxyAuthenticatedToBackend, rejectCrossSiteMutation } from "@/lib/backend";

export const runtime = "nodejs";

export async function GET() {
  return proxyAuthenticatedToBackend("/v1/ui/settings/team");
}

export async function POST(request: Request) {
  const rejected = rejectCrossSiteMutation(request);
  if (rejected) return rejected;
  return proxyAuthenticatedToBackend("/v1/ui/settings/team", {
    method: "POST",
    body: await request.text(),
  });
}
