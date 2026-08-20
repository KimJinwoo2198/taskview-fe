import { VerifyEmailScreen } from "@/components/taskview/auth/verify-email-screen";
import { safeReturnTo } from "@/lib/safe-return-to";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{
    email?: string | string[];
    token?: string | string[];
    returnTo?: string | string[];
  }>;
}) {
  const query = await searchParams;
  const email = typeof query.email === "string" ? query.email : undefined;
  const token = typeof query.token === "string" ? query.token : undefined;
  const returnTo = safeReturnTo(
    typeof query.returnTo === "string" ? query.returnTo : undefined,
  );
  return <VerifyEmailScreen email={email} token={token} returnTo={returnTo} />;
}
