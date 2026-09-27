"use server";
import { Tenant, User, UserRole } from "../generated/prisma/client";
import { hashValue, verifyHash } from "./crypto";

type TokenPayload = {
  user: {
    id: number;
    email: string;
    role: UserRole;
  };
  tenant: {
    id: number;
    name: string;
  };
  iat: number;
  exp: number;
};

const header = btoa(
  JSON.stringify({
    alg: "HS256",
    type: "JWT",
  }),
);

export async function generateToken(
  user: Omit<User, "password"> & {
    tenant: Pick<Tenant, "id" | "name"> | null;
  } & {
    role: { role: UserRole } | null;
  },
  duration: number = 60 * 60 * 24,
): Promise<string> {
  if (!user.tenant) {
    throw new Error("User does not have a tenant.");
  }
  const payload: TokenPayload = {
    user: { id: user.id, email: user.email, role: user.role?.role ?? "TENANT" },
    tenant: user.tenant,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + duration,
  };

  const payloadString = btoa(JSON.stringify(payload));

  const signature = await hashValue(`${header}.${payloadString}`);

  return `${header}.${payloadString}.${Buffer.from(signature).toString("base64")}`;
}

export async function verifyToken(
  token: string,
): Promise<Omit<User, "password"> | null> {
  const [header, payload, signature] = token.split(".");

  const computedSignature = await verifyHash(`${header}.${payload}`, signature);

  if (!computedSignature) {
    return null;
  }
  const decodedPayload: TokenPayload = JSON.parse(
    Buffer.from(payload, "base64").toString("utf-8"),
  );
  return decodedPayload.user;
}
