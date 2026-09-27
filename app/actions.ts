"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import auth from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";

type Result = { ok: true; id?: string } | { ok: false; error: string };
class ActionFailure extends Error {}
const apartmentSchema = z.object({
  name: z.string().trim().min(1), address: z.string().trim().min(1),
});
const tenantSchema = z.object({ name: z.string().trim().min(1), phoneNumber: z.string().trim().min(1) });
const leaseSchema = z.object({ startDate: z.string(), endDate: z.string(), rentalPrice: z.number().int().positive().max(Number.MAX_SAFE_INTEGER), tenantIds: z.array(z.string()).min(1) });
const periodSchema = z.object({ name: z.string().trim().min(1), startDate: z.string(), endDate: z.string() });

const numericId = (value: string) => {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) throw new ActionFailure("Invalid record ID.");
  return parsed;
};
function date(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new ActionFailure("Enter a valid date.");
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) throw new ActionFailure("Enter a valid date.");
  return parsed;
}
function refresh() {
  revalidatePath("/landlord", "layout");
  revalidatePath("/tenant", "layout");
}
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
    refresh();
    return { ok: true, ...(id ? { id } : {}) };
  } catch (error) {
    return { ok: false, error: error instanceof ActionFailure ? error.message : error instanceof z.ZodError ? "Check the entered information." : "The request failed." };
  }
}

export async function saveApartment(input: unknown, recordId?: string): Promise<Result> {
  return run(async () => {
    const ownerId = await landlordId();
    const values = apartmentSchema.parse(input);
    if (recordId) {
      const id = numericId(recordId);
      const existing = await prisma.property.findFirst({ where: { id, ownerId } });
      if (!existing || existing.archivedAt) throw new ActionFailure("Apartment is unavailable.");
      await prisma.property.update({ where: { id }, data: values });
      return recordId;
    }
    const created = await prisma.property.create({ data: { ...values, ownerId } });
    return String(created.id);
  });
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

export async function saveLease(apartmentId: string, input: unknown, recordId?: string): Promise<Result> {
  return run(async () => {
    const ownerId = await landlordId();
    const propertyId = numericId(apartmentId);
    const property = await prisma.property.findFirst({ where: { id: propertyId, ownerId } });
    if (!property || property.archivedAt) throw new ActionFailure("Apartment is unavailable.");
    const values = leaseSchema.parse(input);
    const startDate = date(values.startDate), endDate = date(values.endDate);
    if (startDate > endDate) throw new ActionFailure("End date must follow start date.");
    const ids = [...new Set(values.tenantIds.map(numericId))];
    const leaseId = recordId ? numericId(recordId) : undefined;
    let existingTenantIds: number[] = [];
    if (leaseId) {
      const existing = await prisma.lease.findFirst({ where: { id: leaseId, propertyId, property: { ownerId } }, include: { tenants: true } });
      if (!existing || existing.archivedAt) throw new ActionFailure("Lease is unavailable.");
      existingTenantIds = existing.tenants.map((tenant) => tenant.id);
      const periodOutsideDates = await prisma.period.findFirst({ where: { leaseId, OR: [{ startDate: { lt: startDate } }, { endDate: { gt: endDate } }] } });
      if (periodOutsideDates) throw new ActionFailure("The new lease dates must include all existing periods.");
    }
    const registered = await prisma.tenant.count({ where: { id: { in: ids }, user: { role: { role: "TENANT" } }, OR: [{ archivedAt: null }, { id: { in: existingTenantIds } }] } });
    if (registered !== ids.length) throw new ActionFailure("Select only registered, available tenants.");
    return prisma.$transaction(async (tx) => {
      const conflict = await tx.lease.findFirst({ where: { propertyId, ...(leaseId ? { id: { not: leaseId } } : {}), startDate: { lte: endDate }, endDate: { gte: startDate } } });
      if (conflict) throw new ActionFailure("The apartment already has a lease in that date range.");
      if (leaseId) {
        await tx.lease.update({ where: { id: leaseId }, data: { startDate, endDate, rentalPrice: BigInt(values.rentalPrice), tenants: { set: ids.map((id) => ({ id })) } } });
        return recordId!;
      }
      const created = await tx.lease.create({ data: { propertyId, startDate, endDate, rentalPrice: BigInt(values.rentalPrice), tenants: { connect: ids.map((id) => ({ id })) } } });
      return String(created.id);
    }, { isolationLevel: "Serializable" });
  });
}

export async function createPeriod(leaseIdValue: string, input: unknown): Promise<Result> {
  return run(async () => {
    const ownerId = await landlordId();
    const leaseId = numericId(leaseIdValue);
    const lease = await prisma.lease.findFirst({ where: { id: leaseId, property: { ownerId } }, include: { tenants: true, property: true } });
    if (!lease || lease.archivedAt || lease.property.archivedAt) throw new ActionFailure("Lease is unavailable.");
    const values = periodSchema.parse(input);
    const startDate = date(values.startDate), endDate = date(values.endDate);
    if (startDate > endDate || startDate < lease.startDate || endDate > lease.endDate) throw new ActionFailure("Period dates must fall within the lease.");
    const tenantIds = lease.tenants.map((tenant) => tenant.id).sort((a, b) => a - b);
    if (!tenantIds.length) throw new ActionFailure("Assign a tenant before creating a period.");
    const base = lease.rentalPrice / BigInt(tenantIds.length);
    const remainder = Number(lease.rentalPrice % BigInt(tenantIds.length));
    const period = await prisma.$transaction(async (tx) => {
      const conflict = await tx.period.findFirst({ where: { leaseId, startDate: { lte: endDate }, endDate: { gte: startDate } } });
      if (conflict) throw new ActionFailure("A period already covers these dates.");
      const created = await tx.period.create({ data: { leaseId, name: values.name, startDate, endDate, dueDate: endDate } });
      await tx.payment.createMany({ data: tenantIds.map((tenantId, index) => ({ leaseId, periodId: created.id, tenantId, amount: base + BigInt(index < remainder ? 1 : 0) })) });
      return created;
    }, { isolationLevel: "Serializable" });
    return String(period.id);
  });
}

export async function archiveRecord(kind: "apartment" | "tenant" | "lease" | "period", value: string): Promise<Result> {
  return run(async () => {
    const ownerId = await landlordId();
    const id = numericId(value);
    const archivedAt = new Date();
    if (kind === "apartment") {
      const item = await prisma.property.findFirst({ where: { id, ownerId } });
      if (!item) throw new ActionFailure("Apartment not found.");
      await prisma.property.update({ where: { id }, data: { archivedAt } });
    } else if (kind === "tenant") {
      const item = await prisma.tenant.findFirst({ where: { id, user: { role: { role: "TENANT" } } } });
      if (!item) throw new ActionFailure("Tenant not found.");
      await prisma.tenant.update({ where: { id }, data: { archivedAt } });
    } else if (kind === "lease") {
      const item = await prisma.lease.findFirst({ where: { id, property: { ownerId } } });
      if (!item) throw new ActionFailure("Lease not found.");
      await prisma.lease.update({ where: { id }, data: { archivedAt } });
    } else if (kind === "period") {
      const item = await prisma.period.findFirst({ where: { id, lease: { property: { ownerId } } } });
      if (!item) throw new ActionFailure("Period not found.");
      await prisma.period.update({ where: { id }, data: { archivedAt } });
    } else throw new ActionFailure("Invalid archive type.");
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
