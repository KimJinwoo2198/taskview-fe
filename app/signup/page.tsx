import { SignupScreen } from "@/components/taskview/auth/signup-screen";
import { safeReturnTo } from "@/lib/safe-return-to";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{
    email?: string | string[];
    returnTo?: string | string[];
  }>;
}) {
  const query = await searchParams;
  const initialEmail = typeof query.email === "string" ? query.email : "";
  const returnTo = safeReturnTo(
    typeof query.returnTo === "string" ? query.returnTo : undefined,
  );
  return <SignupScreen initialEmail={initialEmail} returnTo={returnTo} />;
}
