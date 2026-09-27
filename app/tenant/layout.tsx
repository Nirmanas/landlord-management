import { redirect } from "next/navigation";
import auth from "@/lib/auth/auth";
import { loadTenantData } from "@/lib/data";
import { AppShell } from "@/components/app-shell";
import { DataProvider } from "@/components/data-provider";

export default async function TenantLayout({ children }: { children: React.ReactNode }) {
  const user = await auth();
  if (!user) redirect("/login");
  if (user.role !== "TENANT") redirect("/landlord");
  const data = await loadTenantData(user.id);
  return <DataProvider data={data}><AppShell>{children}</AppShell></DataProvider>;
}
