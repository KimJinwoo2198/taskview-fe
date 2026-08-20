import { proxyAuthenticatedToBackend, rejectCrossSiteMutation } from "@/lib/backend";

export const runtime = "nodejs";

export async function GET() {
  return proxyAuthenticatedToBackend("/v1/ui/account");
}

export async function PATCH(request: Request) {
  const rejected = rejectCrossSiteMutation(request);
  if (rejected) return rejected;
  return proxyAuthenticatedToBackend("/v1/ui/account", {
    method: "PATCH",
    body: await request.text(),
  });
}
