import { beginGoogleOAuth } from "@/lib/backend";

export const runtime = "nodejs";

export async function GET(request: Request) {
  return beginGoogleOAuth(request);
}
