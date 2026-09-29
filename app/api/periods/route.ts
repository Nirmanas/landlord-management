import { z } from "zod";
import auth from "@/lib/auth/auth";
import { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";

const periodSchema = z.object({
  leaseId: z.string(), name: z.string().trim().min(1),
  startDate: z.string(), endDate: z.string(),
}).strict();

export async function GET() {
  const user = await auth();
  if (!user) return Response.json({ error: "Sign in required." }, { status: 401, headers: { "WWW-Authenticate": "Bearer" } });

  try {
    let tenantId: number | null = null;
    if (user.role === "TENANT") {
      const tenant = await prisma.tenant.findUnique({ where: { userId: user.id }, select: { id: true } });
      if (!tenant) return Response.json({ error: "Tenant profile not found." }, { status: 404 });
      tenantId = tenant.id;
    }
    const periods = await prisma.period.findMany({
      where: user.role === "LANDLORD"
        ? { lease: { property: { ownerId: user.id } } }
        : { OR: [{ lease: { tenants: { some: { id: tenantId! } } } }, { payments: { some: { tenantId: tenantId! } } }] },
      orderBy: { startDate: "desc" },
    });
    return Response.json({ data: periods.map((period) => ({
      id: String(period.id), leaseId: String(period.leaseId), name: period.name,
      startDate: period.startDate.toISOString().slice(0, 10), endDate: period.endDate.toISOString().slice(0, 10),
      dueDate: period.dueDate.toISOString().slice(0, 10), archivedAt: period.archivedAt?.toISOString() ?? null,
    })) });
  } catch (error) {
    console.error("List periods failed", error);
    return Response.json({ error: "The request failed." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await auth();
  if (!user) return Response.json({ error: "Sign in required." }, { status: 401, headers: { "WWW-Authenticate": "Bearer" } });
  if (user.role !== "LANDLORD") return Response.json({ error: "Only landlords can do that." }, { status: 403 });

  let body: unknown;
  try { body = await request.json(); }
  catch { return Response.json({ error: "Invalid JSON body." }, { status: 400 }); }
  const parsed = periodSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Check the entered information." }, { status: 422 });
  const values = parsed.data;
  const leaseId = Number(values.leaseId);
  if (!/^[1-9]\d*$/.test(values.leaseId) || !Number.isSafeInteger(leaseId)) return Response.json({ error: "Invalid record ID." }, { status: 422 });
  const validDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00.000Z`)) && new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10) === value;
  if (!validDate(values.startDate) || !validDate(values.endDate)) return Response.json({ error: "Enter a valid date." }, { status: 422 });
  const startDate = new Date(`${values.startDate}T00:00:00.000Z`);
  const endDate = new Date(`${values.endDate}T00:00:00.000Z`);

  try {
    const lease = await prisma.lease.findFirst({ where: { id: leaseId, property: { ownerId: user.id } }, include: { tenants: true, property: true } });
    if (!lease) return Response.json({ error: "Lease not found." }, { status: 404 });
    if (lease.archivedAt || lease.property.archivedAt) return Response.json({ error: "Lease is unavailable." }, { status: 409 });
    if (startDate > endDate || startDate < lease.startDate || endDate > lease.endDate) return Response.json({ error: "Period dates must fall within the lease." }, { status: 422 });
    const tenantIds = lease.tenants.map((tenant) => tenant.id).sort((a, b) => a - b);
    if (!tenantIds.length) return Response.json({ error: "Assign a tenant before creating a period." }, { status: 409 });
    const base = lease.rentalPrice / BigInt(tenantIds.length);
    const remainder = Number(lease.rentalPrice % BigInt(tenantIds.length));
    const period = await prisma.$transaction(async (tx) => {
      const conflict = await tx.period.findFirst({ where: { leaseId, startDate: { lte: endDate }, endDate: { gte: startDate } } });
      if (conflict) throw new Error("PERIOD_CONFLICT");
      const created = await tx.period.create({ data: { leaseId, name: values.name, startDate, endDate, dueDate: endDate } });
      await tx.payment.createMany({ data: tenantIds.map((tenantId, index) => ({ leaseId, periodId: created.id, tenantId, amount: base + BigInt(index < remainder ? 1 : 0) })) });
      return created;
    }, { isolationLevel: "Serializable" });
    return Response.json({ data: {
      id: String(period.id), leaseId: String(period.leaseId), name: period.name,
      startDate: period.startDate.toISOString().slice(0, 10), endDate: period.endDate.toISOString().slice(0, 10),
      dueDate: period.dueDate.toISOString().slice(0, 10), archivedAt: period.archivedAt?.toISOString() ?? null,
    } }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "PERIOD_CONFLICT") return Response.json({ error: "A period already covers these dates." }, { status: 409 });
    if (error instanceof Prisma.PrismaClientKnownRequestError && ["P2003", "P2025"].includes(error.code)) return Response.json({ error: "A referenced record was not found." }, { status: 404 });
    if (error instanceof Prisma.PrismaClientKnownRequestError && ["P2002", "P2034"].includes(error.code)) return Response.json({ error: "The request conflicts with an existing record. Try again." }, { status: 409 });
    console.error("Create period failed", error);
    return Response.json({ error: "The request failed." }, { status: 500 });
  }
}
