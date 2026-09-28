import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { generateToken } from "@/lib/auth/jwt";
import {
  ACCESS_DURATION_SECONDS,
  REFRESH_COOKIE_PATH,
  refreshSession,
  revokeSession,
} from "@/lib/auth/session";

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get("refresh")?.value;

  if (!token) {
    return Response.json(
      { error: "No refresh token provided." },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  const session = await refreshSession(token);

  if (!session) {
    cookieStore.delete("auth");
    cookieStore.set("refresh", "", { maxAge: 0, path: REFRESH_COOKIE_PATH });
    return Response.json(
      { error: "Refresh session is invalid or expired." },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      tenant: { select: { id: true, name: true } },
      role: { select: { role: true } },
    },
  });

  if (!user?.role) {
    await revokeSession(session.token);
    cookieStore.delete("auth");
    cookieStore.set("refresh", "", { maxAge: 0, path: REFRESH_COOKIE_PATH });
    return Response.json(
      { error: "Refresh session is invalid or expired." },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  const accessToken = await generateToken(user, ACCESS_DURATION_SECONDS);

  cookieStore.set("auth", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: ACCESS_DURATION_SECONDS,
    path: "/",
    sameSite: "lax",
  });

  cookieStore.set("refresh", session.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: session.expiresAt,
    path: REFRESH_COOKIE_PATH,
    sameSite: "lax",
  });

  return Response.json(
    {
      success: true,
      access_token: accessToken,
      token_type: "Bearer",
      expires_in: ACCESS_DURATION_SECONDS,
    },
    { headers: { "Cache-Control": "no-store", Pragma: "no-cache" } },
  );
}
