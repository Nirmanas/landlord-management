"use server";

import { cookies } from "next/headers";

export default async function auth(): Promise<undefined> {
  const authCookie = (await cookies()).get("auth");
  // TODO: implement and vlaidate auth
}
