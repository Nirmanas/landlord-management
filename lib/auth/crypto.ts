import { timingSafeEqual } from "crypto";

const key = Buffer.from(process.env.AUTH_KEY!, "hex");

export const cryptoKey = await crypto.subtle.importKey(
  "raw",
  key,
  { name: "HMAC", hash: "SHA-256" },
  false,
  ["sign"],
);

export async function hashValue(
  value: string,
  salt?: string,
): Promise<Buffer<ArrayBuffer>> {
  const encoder = new TextEncoder();
  const saltedData = encoder.encode((salt ?? "") + value);
  const hashBuffer = await crypto.subtle.sign("HMAC", cryptoKey, saltedData);
  const hashArray = Buffer.from(new Uint8Array(hashBuffer));
  return hashArray;
}

export async function verifyHash(
  value: string,
  compHash: string,
): Promise<boolean> {
  const newHash = await hashValue(value);
  const oldHash = Buffer.from(compHash, "base64url");
  return timingSafeEqual(newHash, oldHash);
}
