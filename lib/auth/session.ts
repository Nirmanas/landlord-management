import { createHash, randomBytes, randomUUID } from "node:crypto";
import { prisma } from "../prisma";

export const ACCESS_DURATION_SECONDS = 1 * 60 * 60;
export const REFRESH_DURATION_SECONDS = 7 * 24 * 60 * 60;
export const REFRESH_COOKIE_PATH = "/";

const REFRESH_RENEWAL_WINDOW_MS = 24 * 60 * 60 * 1000;

function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function newRefreshToken(): string {
  return randomBytes(32).toString("base64url");
}

export async function createSession(userId: number): Promise<{
  token: string;
  expiresAt: Date;
}> {
  const token = newRefreshToken();
  const expiresAt = new Date(Date.now() + REFRESH_DURATION_SECONDS * 1000);

  await prisma.session.create({
    data: {
      userId,
      expiresAt,
      tokenHash: hashRefreshToken(token),
      familyId: randomUUID(),
    },
  });

  return { token, expiresAt };
}

async function revokeFamily(familyId: string): Promise<void> {
  await prisma.session.updateMany({
    where: { familyId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function revokeSession(token: string): Promise<void> {
  const session = await prisma.session.findUnique({
    where: { tokenHash: hashRefreshToken(token) },
    select: { familyId: true },
  });
  if (session) await revokeFamily(session.familyId);
}

export async function refreshSession(currentToken: string): Promise<{
  token: string;
  expiresAt: Date;
  userId: number;
} | null> {
  const session = await prisma.session.findUnique({
    where: { tokenHash: hashRefreshToken(currentToken) },
  });
  if (!session) return null;

  if (session.revokedAt) return null;
  if (session.usedAt) {
    await revokeFamily(session.familyId);
    return null;
  }

  const now = new Date();
  if (session.expiresAt <= now) return null;

  const token = newRefreshToken();
  const expiresAt =
    session.expiresAt.getTime() - now.getTime() < REFRESH_RENEWAL_WINDOW_MS
      ? new Date(now.getTime() + REFRESH_DURATION_SECONDS * 1000)
      : session.expiresAt;

  const claimed = await prisma.$transaction(async (tx) => {
    const result = await tx.session.updateMany({
      where: {
        id: session.id,
        usedAt: null,
        revokedAt: null,
        expiresAt: { gt: now },
      },
      data: { usedAt: now },
    });
    if (result.count !== 1) return false;

    await tx.session.create({
      data: {
        userId: session.userId,
        familyId: session.familyId,
        tokenHash: hashRefreshToken(token),
        expiresAt,
      },
    });
    return true;
  });

  if (!claimed) {
    await revokeFamily(session.familyId);
    return null;
  }

  return { token, expiresAt, userId: session.userId };
}
