import "server-only";

import { cookies, headers } from "next/headers";
import { UserRole } from "../generated/prisma/browser";
import { prisma } from "../prisma";
import { generateToken, verifyToken } from "./jwt";
import { hashValue } from "./crypto";
import {
  ACCESS_DURATION_SECONDS,
  REFRESH_COOKIE_PATH,
  createSession,
  revokeSession,
} from "./session";

export default async function auth(): Promise<{
  id: number;
  email: string;
  role: UserRole;
} | null> {
  const authorization = (await headers()).get("authorization");

  const token =
    authorization === null
      ? (await cookies()).get("auth")?.value
      : /^Bearer[ \t]+(\S+)$/i.exec(authorization)?.[1];

  if (!token) return null;

  const tokenUser = await verifyToken(token);

  if (!tokenUser) return null;

  const user = await prisma.user.findUnique({
    where: { id: tokenUser.id },
    select: { id: true, email: true, role: { select: { role: true } } },
  });

  if (!user?.role || user.role.role !== tokenUser.role) return null;
  return { id: user.id, email: user.email, role: user.role.role };
}

export async function login(email: string, password: string): Promise<string> {
  const hashedPassword = await getHashValue(password);

  const user = await prisma.user.findFirst({
    where: {
      email: email.trim().toLowerCase(),
      password: hashedPassword,
    },
    select: {
      id: true,
      email: true,
      tenant: { select: { id: true, name: true } },
      role: { select: { role: true } },
    },
  });

  if (!user) {
    throw new Error("Invalid email or password.");
  }

  const token = await generateToken(user, ACCESS_DURATION_SECONDS);
  const refreshSession = await createSession(user.id);
  const cookieStore = await cookies();

  cookieStore.set("auth", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: ACCESS_DURATION_SECONDS,
    path: "/",
    sameSite: "lax",
  });

  cookieStore.set("refresh", refreshSession.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: refreshSession.expiresAt,
    path: REFRESH_COOKIE_PATH,
    sameSite: "lax",
  });

  return token;
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get("refresh")?.value;
  if (token) await revokeSession(token);
  cookieStore.delete("auth");
  cookieStore.set("refresh", "", {
    maxAge: 0,
    path: REFRESH_COOKIE_PATH,
  });
}

export async function register(
  email: string,
  password: string,
  name: string,
  phone: string,
): Promise<void> {
  // Decide the initial account role before creating the user.
  const role: UserRole =
    (await prisma.user.count()) === 0 ? "LANDLORD" : "TENANT";
  const user = await prisma.user.create({
    data: {
      email: email.trim().toLowerCase(),
      password: await getHashValue(password),
    },
  });

  await prisma.role.create({
    data: {
      userId: user.id,
      role: role,
    },
  });

  if (role !== "LANDLORD")
    await prisma.tenant.create({
      data: {
        name: name,
        phoneNumber: phone,
        userId: user.id,
      },
    });
}

async function getHashValue(value: string): Promise<string> {
  const hashBuffer = await hashValue(value, "svx");
  const passwordHash = Buffer.from(new Uint8Array(hashBuffer)).toString(
    "base64url",
  );
  return passwordHash;
}
