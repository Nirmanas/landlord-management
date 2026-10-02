import { forbidden, redirect } from "next/navigation";
import auth from "@/lib/auth/auth";
import { AppShell } from "@/components/app-shell";

export default async function LandlordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await auth();
  if (!user) redirect("/login");
  if (user.role !== "LANDLORD") forbidden();
  return <AppShell>{children}</AppShell>;
}
