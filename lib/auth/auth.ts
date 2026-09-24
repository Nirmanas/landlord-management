"use server";

import { cookies } from "next/headers";
import { User, UserRole } from "../generated/prisma/browser";
import { redirect } from "next/navigation";
import { prisma } from "../prisma";
import { generateToken, verifyToken } from "./jwt";
import { hashString, toHexString } from "./crypto";

// TODO: add refresh later
export default async function auth(): Promise<Omit<User, "password"> | null> {
  const authCookie = (await cookies()).get("auth");
  if (!authCookie) {
    return null;
  }
  return verifyToken(authCookie.value);
}

export async function login(email: string, password: string): Promise<void> {
  const hashedPassword = toHexString(await hashString(password));
  const user = await prisma.user.findFirst({
    where: {
      email: email,
      password: hashedPassword,
    },
  });

  if (!user) {
    throw new Error("Invalid email or password");
  }
  (await cookies()).set("auth", await generateToken(user), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24,
    path: "/",
    sameSite: "lax",
  });
  redirect("/");
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
  const user = await prisma.user.create({
    data: {
      email: email,
      password: toHexString(await hashString(password)),
    },
  });

  let role: UserRole = "TENANT";
  // first user to be created will be admin
  if ((await prisma.user.count()) === 0) role = "LANDLORD";
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

  await login(email, password);
}
