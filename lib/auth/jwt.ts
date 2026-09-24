"use server";
import { User } from "../generated/prisma/browser";
import { prisma } from "../prisma";
import { hashString, verifyHash } from "./crypto";

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
};

const header = btoa(
  JSON.stringify({
    alg: "HS256",
    type: "JWT",
  }),
);

export async function generateToken(user: User): Promise<string> {
  const tenant = prisma.tenant.findFirst({
    where: {
      userId: user.id,
    },
  });

  if (!tenant) {
    throw new Error("Tenant not found for user");
  }

  const payload = btoa(
    JSON.stringify({
      user: { id: user.id, email: user.email },
      tenant: {
        ...tenant,
      },
    }),
  );

  const signature = await hashString(`${header}.${payload}`);

  return `${header}.${payload}.${Buffer.from(signature).toString("base64")}`;
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
