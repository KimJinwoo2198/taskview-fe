import { proxyAuthenticatedToBackend } from "@/lib/backend";

export const runtime = "nodejs";

export async function GET() {
  return proxyAuthenticatedToBackend("/v1/auth/email-verifications/status");
}
