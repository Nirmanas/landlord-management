"use server";
import { User } from "../generated/prisma/browser";
import { prisma } from "../prisma";
import { hashValue, verifyHash } from "./crypto";

type TokenPayload = {
  user: {
    id: number;
    email: string;
  };
  tenant: {
    id: number;
    name: string;
    userId: number;
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
  user: User,
  duration: number = 60 * 60 * 24,
): Promise<string> {
  const tenant = await prisma.tenant.findFirst({
    where: {
      userId: user.id,
    },
  });

  if (!tenant) {
    throw new Error("Tenant not found for user");
  }

  const payload: TokenPayload = {
    user: { id: user.id, email: user.email },
    tenant: {
      ...tenant,
    },
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
