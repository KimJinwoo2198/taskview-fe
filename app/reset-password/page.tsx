import { ResetPasswordScreen } from "@/components/taskview/auth/reset-password-screen";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const query = await searchParams;
  const token = typeof query.token === "string" ? query.token : undefined;
  return <ResetPasswordScreen token={token} />;
}
