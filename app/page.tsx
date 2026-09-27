import auth from "@/lib/auth/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const user = await auth();
  if (!user) redirect("/login");
  redirect(user.role === "LANDLORD" ? "/landlord" : "/tenant");
}
