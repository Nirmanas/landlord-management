import { timingSafeEqual } from "crypto";

const key = Buffer.from(process.env.AUTH_KEY!, "hex");

export const cryptoKey = await crypto.subtle.importKey(
  "raw",
  key,
  { name: "HMAC", hash: "SHA-256" },
  false,
  ["sign"],
);

export async function hashValue(value: string): Promise<Buffer<ArrayBuffer>> {
  const encoder = new TextEncoder();
  const salt = "svx";
  const saltedData = encoder.encode(salt + value);
  const hashBuffer = await crypto.subtle.sign("HMAC", cryptoKey, saltedData);
  const hashArray = Buffer.from(new Uint8Array(hashBuffer));
  return hashArray;
}

export function toHexString(hashArray: number[]): string {
  return hashArray.map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function verifyHash(
  value: string,
  compHash: string,
): Promise<boolean> {
  const newHash = await hashValue(value);
  const oldHash = Buffer.from(compHash, "base64");
  return timingSafeEqual(newHash, oldHash);
}
