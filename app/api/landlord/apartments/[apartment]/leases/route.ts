import { z } from "zod";
import { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { roleRoute } from "@/lib/api-route";

const leaseSchema = z.object({
  apartmentId: z.string(), startDate: z.string(), endDate: z.string(),
  rentalPrice: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  tenantIds: z.array(z.string()).min(1),
}).strict();

export const GET = roleRoute("LANDLORD", async (_request, params, user) => {
  try {
    const leases = await prisma.lease.findMany({
      where: { propertyId: Number(params.apartment), AND: [{ property: { ownerId: user.id } }] },
      include: { tenants: { select: { id: true } } }, orderBy: { startDate: "desc" },
    });
    const today = new Date().toISOString().slice(0, 10);
    return Response.json({ data: leases.map((lease) => {
        const startDate = lease.startDate.toISOString().slice(0, 10);
        const endDate = lease.endDate.toISOString().slice(0, 10);
        return {
          id: String(lease.id), apartmentId: String(lease.propertyId), startDate, endDate,
          status: startDate > today ? "upcoming" : endDate < today ? "ended" : "active",
          totalRentCents: Number(lease.rentalPrice), tenantIds: lease.tenants.map((tenant) => String(tenant.id)),
          archivedAt: lease.archivedAt?.toISOString() ?? null,
        };
      }) });
  }
  catch (error) {
    console.error("List leases failed", error);
    return Response.json({ error: "The request failed." }, { status: 500 });
  }
});

export const POST = roleRoute("LANDLORD", async (request, _params, user) => {
  let body: unknown;
  try {
    body = await request.json();
  }
  catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const parsed = leaseSchema.safeParse(body);
  if (!parsed.success)
    return Response.json({ error: "Check the entered information." }, { status: 422 });
  const values = parsed.data;
  const propertyId = Number(values.apartmentId);
  if (!/^[1-9]\d*$/.test(values.apartmentId) || !Number.isSafeInteger(propertyId))
    return Response.json({ error: "Invalid record ID." }, { status: 422 });
  const ids = [...new Set(values.tenantIds.map(Number))];
  if (values.tenantIds.some((value) => !/^[1-9]\d*$/.test(value) || !Number.isSafeInteger(Number(value))))
    return Response.json({ error: "Invalid record ID." }, { status: 422 });
  const validDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00.000Z`)) && new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10) === value;
  if (!validDate(values.startDate) || !validDate(values.endDate))
    return Response.json({ error: "Enter a valid date." }, { status: 422 });
  const startDate = new Date(`${values.startDate}T00:00:00.000Z`);
  const endDate = new Date(`${values.endDate}T00:00:00.000Z`);
  if (startDate > endDate)
    return Response.json({ error: "End date must follow start date." }, { status: 422 });
  try {
    const property = await prisma.property.findFirst({ where: { id: propertyId, ownerId: user.id } });
    if (!property)
      return Response.json({ error: "Apartment not found." }, { status: 404 });
    if (property.archivedAt)
      return Response.json({ error: "Apartment is unavailable." }, { status: 409 });
    const registered = await prisma.tenant.count({ where: { id: { in: ids }, user: { role: { role: "TENANT" } }, archivedAt: null } });
    if (registered !== ids.length) {
      const existing = await prisma.tenant.count({ where: { id: { in: ids } } });
      if (existing !== ids.length)
        return Response.json({ error: "Tenant not found." }, { status: 404 });
      return Response.json({ error: "Select only registered, available tenants." }, { status: 422 });
    }
    const lease = await prisma.$transaction(async (tx) => {
      const property = await tx.property.findFirst({ where: { id: propertyId, ownerId: user.id } });
      if (!property)
        throw new Error("APARTMENT_NOT_FOUND");
      if (property.archivedAt)
        throw new Error("APARTMENT_UNAVAILABLE");
      const conflict = await tx.lease.findFirst({ where: { propertyId, startDate: { lte: endDate }, endDate: { gte: startDate } } });
      if (conflict)
        throw new Error("LEASE_CONFLICT");
      return tx.lease.create({
        data: { propertyId, startDate, endDate, rentalPrice: BigInt(values.rentalPrice), tenants: { connect: ids.map((id) => ({ id })) } },
        include: { tenants: { select: { id: true } } },
      });
    }, { isolationLevel: "Serializable" });
    const today = new Date().toISOString().slice(0, 10);
    return Response.json({ data: {
        id: String(lease.id), apartmentId: String(lease.propertyId), startDate: values.startDate, endDate: values.endDate,
        status: values.startDate > today ? "upcoming" : values.endDate < today ? "ended" : "active",
        totalRentCents: Number(lease.rentalPrice), tenantIds: lease.tenants.map((tenant) => String(tenant.id)),
        archivedAt: lease.archivedAt?.toISOString() ?? null,
      } }, { status: 201 });
  }
  catch (error) {
    if (error instanceof Error && error.message === "APARTMENT_NOT_FOUND")
      return Response.json({ error: "Apartment not found." }, { status: 404 });
    if (error instanceof Error && error.message === "APARTMENT_UNAVAILABLE")
      return Response.json({ error: "Apartment is unavailable." }, { status: 409 });
    if (error instanceof Error && error.message === "LEASE_CONFLICT")
      return Response.json({ error: "The apartment already has a lease in that date range." }, { status: 409 });
    if (error instanceof Prisma.PrismaClientKnownRequestError && ["P2003", "P2025"].includes(error.code))
      return Response.json({ error: "A referenced record was not found." }, { status: 404 });
    if (error instanceof Prisma.PrismaClientKnownRequestError && ["P2002", "P2034"].includes(error.code))
      return Response.json({ error: "The request conflicts with an existing record. Try again." }, { status: 409 });
    console.error("Create lease failed", error);
    return Response.json({ error: "The request failed." }, { status: 500 });
  }
}, "apartmentId");
