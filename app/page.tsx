import auth from "@/lib/auth/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  // TODO: Implement auth
  const user = await auth();
  const landlord = false;
  if (!auth) {
    redirect("login");
  }
  console.log(user);
  if (user && landlord) {
    redirect("landlord");
  } else {
    redirect("tenant");
  }
}
