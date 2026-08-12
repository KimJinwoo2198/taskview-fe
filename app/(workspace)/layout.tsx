import { AppShell } from "@/components/app-shell";
import { SessionProvider } from "@/components/session-provider";

export default function WorkspaceLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <SessionProvider><AppShell>{children}</AppShell></SessionProvider>;
}
