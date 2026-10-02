import { forbidden, redirect } from "next/navigation";
import auth from "@/lib/auth/auth";
import { AppShell } from "@/components/app-shell";

export default async function TenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await auth();
  if (!user) redirect("/login");
  if (user.role !== "TENANT") forbidden();
  return <AppShell>{children}</AppShell>;
}
