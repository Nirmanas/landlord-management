import { forbidden, redirect } from "next/navigation";
import auth from "@/lib/auth/auth";
import { loadLandlordData } from "@/lib/data";
import { AppShell } from "@/components/app-shell";
import { DataProvider } from "@/components/data-provider";

export default async function LandlordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await auth();
  if (!user) redirect("/login");
  if (user.role !== "LANDLORD") forbidden();
  const data = await loadLandlordData(user.id);
  return (
    <DataProvider data={data} role="landlord">
      <AppShell>{children}</AppShell>
    </DataProvider>
  );
}
