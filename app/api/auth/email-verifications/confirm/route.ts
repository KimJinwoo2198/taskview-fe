import { proxyToBackend, rejectCrossSiteMutation } from "@/lib/backend";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rejected = rejectCrossSiteMutation(request);
  if (rejected) return rejected;
  return proxyToBackend("/v1/auth/email-verifications/confirm", {
    method: "POST",
    body: await request.text(),
  });
}
