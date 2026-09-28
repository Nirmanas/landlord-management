"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function RenewPage() {
  const router = useRouter();
  useEffect(() => {
    const refresh = (async () => {
      const redirectUrl = new URL(window.location.href).searchParams.get(
        "redirect",
      );
      try {
        const response = await fetch("/api/auth/refresh", {
          method: "POST",
          headers: { "Cache-Control": "no-store" },
        });
        if (response.ok) router.push(redirectUrl || "/");
      } catch (error) {}
      router.push("/login");
    })();
  }, [router]);
  return <h1>Refreshing your session, please wait...</h1>;
}
