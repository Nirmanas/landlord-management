"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import auth from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";

type Result = { ok: true; id?: string } | { ok: false; error: string };
class ActionFailure extends Error {}
const tenantSchema = z.object({ name: z.string().trim().min(1), phoneNumber: z.string().trim().min(1) });

const numericId = (value: string) => {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) throw new ActionFailure("Invalid record ID.");
  return parsed;
};
async function landlordId() {
  const user = await auth();
  if (!user || user.role !== "LANDLORD") throw new ActionFailure("Only landlords can do that.");
  return user.id;
}
async function tenantId() {
  const user = await auth();
  if (!user || user.role !== "TENANT") throw new ActionFailure("Only tenants can do that.");
  const tenant = await prisma.tenant.findUnique({ where: { userId: user.id } });
  if (!tenant) throw new ActionFailure("Tenant profile not found.");
  return tenant.id;
}
async function run(action: () => Promise<string | void>): Promise<Result> {
  try {
    const id = await action();
    revalidatePath("/landlord", "layout");
    revalidatePath("/tenant", "layout");
    return { ok: true, ...(id ? { id } : {}) };
  } catch (error) {
    return { ok: false, error: error instanceof ActionFailure ? error.message : error instanceof z.ZodError ? "Check the entered information." : "The request failed." };
  }
}

export async function saveTenant(recordId: string, input: unknown): Promise<Result> {
  return run(async () => {
    await landlordId();
    const id = numericId(recordId);
    const tenant = await prisma.tenant.findFirst({ where: { id, user: { role: { role: "TENANT" } } } });
    if (!tenant || tenant.archivedAt) throw new ActionFailure("Tenant is unavailable.");
    await prisma.tenant.update({ where: { id }, data: tenantSchema.parse(input) });
    return recordId;
  });
}

export async function archiveRecord(kind: "tenant", value: string): Promise<Result> {
  return run(async () => {
    await landlordId();
    const id = numericId(value);
    if (kind !== "tenant") throw new ActionFailure("Invalid archive type.");
    const tenant = await prisma.tenant.findFirst({ where: { id, user: { role: { role: "TENANT" } } } });
    if (!tenant) throw new ActionFailure("Tenant not found.");
    await prisma.tenant.update({ where: { id }, data: { archivedAt: new Date() } });
  });
}

export async function reportPayment(value: string): Promise<Result> {
  return run(async () => {
    const ownTenantId = await tenantId();
    const id = numericId(value);
    const payment = await prisma.payment.findFirst({ where: { id, tenantId: ownTenantId } });
    if (!payment || !["PENDING", "FAILED"].includes(payment.status)) throw new ActionFailure("Payment cannot be reported.");
    await prisma.payment.update({ where: { id }, data: { status: "REVIEW" } });
  });
}

export async function confirmPayment(value: string): Promise<Result> {
  return run(async () => {
    const ownerId = await landlordId();
    const id = numericId(value);
    const payment = await prisma.payment.findFirst({ where: { id, lease: { property: { ownerId } } } });
    if (!payment || payment.status !== "REVIEW") throw new ActionFailure("Payment is not awaiting confirmation.");
    await prisma.payment.update({ where: { id }, data: { status: "COMPLETED" } });
  });
}
