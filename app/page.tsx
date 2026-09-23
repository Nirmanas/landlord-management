import { redirect } from "next/navigation";

export default function Home() {
  // TODO: Implement auth
  const auth = false;
  const landlord = false;
  if (!auth) {
    redirect("login");
  }
  if (auth && landlord) {
    redirect("landlord");
  } else {
    redirect("tenant");
  }
}
