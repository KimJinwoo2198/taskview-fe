import { LoginScreen } from "@/components/taskview/auth/login-screen";
import { safeReturnTo } from "@/lib/safe-return-to";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    next?: string | string[];
    returnTo?: string | string[];
    reset?: string | string[];
    oauth_error?: string | string[];
  }>;
}) {
  const query = await searchParams;
  const returnTo = safeReturnTo(
    typeof query.returnTo === "string"
      ? query.returnTo
      : typeof query.next === "string"
        ? query.next
        : undefined,
  );
  const resetComplete = query.reset === "complete";
  return <LoginScreen returnTo={returnTo} oauthError={typeof query.oauth_error === "string"} resetComplete={resetComplete} />;
}
