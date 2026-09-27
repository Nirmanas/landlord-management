"use server";

import { cookies } from "next/headers";
import { User, UserRole } from "../generated/prisma/browser";
import { redirect } from "next/navigation";
import { prisma } from "../prisma";
import { generateToken, verifyToken } from "./jwt";
import { hashValue, toHexString } from "./crypto";

// TODO: add refresh later
export default async function auth(): Promise<Omit<User, "password"> | null> {
  const authCookie = (await cookies()).get("auth");
  if (!authCookie) {
    return null;
  }
  return verifyToken(authCookie.value);
}

export async function login(email: string, password: string): Promise<void> {
  const hashedPassword = await getHexValue(password);

  const user = await prisma.user.findFirst({
    where: {
      email: email,
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

  (await cookies()).set("auth", await generateToken(user), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24,
    path: "/",
    sameSite: "lax",
  });
}

export async function logout(): Promise<void> {
  (await cookies()).delete("auth");
  redirect("/");
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
      email: email,
      password: await getHexValue(password),
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

async function getHexValue(value: string): Promise<string> {
  const hashBuffer = await hashValue(value);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return toHexString(hashArray);
}
