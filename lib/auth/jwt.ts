"use server";
import { Tenant, User, UserRole } from "../generated/prisma/client";
import { hashValue, verifyHash } from "./crypto";

type TokenPayload = {
  user: {
    id: number;
    email: string;
    role: UserRole;
  };
  iat: number;
  exp: number;
};

const header = btoa(
  JSON.stringify({
    alg: "HS256",
    typ: "JWT",
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
  if (!user.role) throw new Error("User does not have a role.");
  const payload: TokenPayload = {
    user: { id: user.id, email: user.email, role: user.role.role },
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + duration,
  };

  const payloadString = btoa(JSON.stringify(payload));

  const signature = await hashValue(`${header}.${payloadString}`);

  return `${header}.${payloadString}.${Buffer.from(signature).toString("base64url")}`;
}

export async function verifyToken(
  token: string,
): Promise<TokenPayload["user"] | null> {
  try {
    const [tokenHeader, payload, signature, extra] = token.split(".");
    if (
      !tokenHeader ||
      !payload ||
      !signature ||
      extra ||
      tokenHeader !== header
    )
      return null;
    if (!(await verifyHash(`${tokenHeader}.${payload}`, signature)))
      return null;
    const decoded: TokenPayload = JSON.parse(
      Buffer.from(payload, "base64").toString("utf-8"),
    );
    if (!Number.isInteger(decoded.exp) || decoded.exp <= Date.now() / 1000)
      return null;
    if (
      !Number.isInteger(decoded.user?.id) ||
      !["LANDLORD", "TENANT"].includes(decoded.user.role)
    )
      return null;
    return decoded.user;
  } catch {
    return null;
  }
}
