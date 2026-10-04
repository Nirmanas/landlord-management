import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileTypeFromBuffer } from "file-type";

export const MAX_LEASE_DOCUMENT_BYTES = 2 * 1024 * 1024;

export async function readUpload(request: Request): Promise<Uint8Array | null> {
  if (!request.body) return new Uint8Array();
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_LEASE_DOCUMENT_BYTES) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const data = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    data.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return data;
}

export async function isPdf(data: Uint8Array) {
  try {
    return (await fileTypeFromBuffer(data))?.mime === "application/pdf";
  } catch {
    return false;
  }
}

function filePath(leaseId: number, path: string) {
  if (!new RegExp(`^${leaseId}/[a-f0-9-]+\\.pdf$`).test(path))
    throw new Error("Invalid lease file path.");
  return join(process.cwd(), ".lease-files", path);
}

export async function saveLeasePdf(leaseId: number, data: Uint8Array) {
  const path = `${leaseId}/${randomUUID()}.pdf`;
  await mkdir(join(process.cwd(), ".lease-files", String(leaseId)), { recursive: true });
  await writeFile(filePath(leaseId, path), data);
  return path;
}

export async function readLeasePdf(leaseId: number, path: string) {
  return readFile(filePath(leaseId, path));
}

export async function removeLeasePdf(leaseId: number, path: string) {
  try {
    await unlink(filePath(leaseId, path));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}

export function pdfResponse(data: Uint8Array, download = false) {
  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="lease.pdf"`,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
    },
  });
}
