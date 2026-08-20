import { completeGoogleOAuth } from "@/lib/backend";

export const runtime = "nodejs";

export async function GET(request: Request) {
  return completeGoogleOAuth(request);
}
