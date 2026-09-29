import { z } from "zod";
import auth from "@/lib/auth/auth";
import { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";

type Context = { params: Promise<{ id: string }> };
const nameSchema = z.object({ name: z.string().trim().min(1) }).strict();

export async function GET(_request: Request, { params }: Context) {
  const user = await auth();
  if (!user) return Response.json({ error: "Sign in required." }, { status: 401, headers: { "WWW-Authenticate": "Bearer" } });
  const rawId = (await params).id;
  const id = Number(rawId);
  if (!/^[1-9]\d*$/.test(rawId) || !Number.isSafeInteger(id)) return Response.json({ error: "Invalid record ID." }, { status: 400 });

  try {
    let tenantId: number | null = null;
    if (user.role === "TENANT") {
      const tenant = await prisma.tenant.findUnique({ where: { userId: user.id }, select: { id: true } });
      if (!tenant) return Response.json({ error: "Tenant profile not found." }, { status: 404 });
      tenantId = tenant.id;
    }
    const period = await prisma.period.findFirst({ where: {
      id, ...(user.role === "LANDLORD"
        ? { lease: { property: { ownerId: user.id } } }
        : { OR: [{ lease: { tenants: { some: { id: tenantId! } } } }, { payments: { some: { tenantId: tenantId! } } }] }),
    } });
    if (!period) return Response.json({ error: "Payment period not found." }, { status: 404 });
    return Response.json({ data: {
      id: String(period.id), leaseId: String(period.leaseId), name: period.name,
      startDate: period.startDate.toISOString().slice(0, 10), endDate: period.endDate.toISOString().slice(0, 10),
      dueDate: period.dueDate.toISOString().slice(0, 10), archivedAt: period.archivedAt?.toISOString() ?? null,
    } });
  } catch (error) {
    console.error("Read period failed", error);
    return Response.json({ error: "The request failed." }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: Context) {
  const user = await auth();
  if (!user) return Response.json({ error: "Sign in required." }, { status: 401, headers: { "WWW-Authenticate": "Bearer" } });
  if (user.role !== "LANDLORD") return Response.json({ error: "Only landlords can do that." }, { status: 403 });
  const rawId = (await params).id;
  const id = Number(rawId);
  if (!/^[1-9]\d*$/.test(rawId) || !Number.isSafeInteger(id)) return Response.json({ error: "Invalid record ID." }, { status: 400 });

  let body: unknown;
  try { body = await request.json(); }
  catch { return Response.json({ error: "Invalid JSON body." }, { status: 400 }); }
  const parsed = nameSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Check the entered information." }, { status: 422 });

  try {
    const existing = await prisma.period.findFirst({ where: { id, lease: { property: { ownerId: user.id } } }, include: { lease: { include: { property: true } } } });
    if (!existing) return Response.json({ error: "Payment period not found." }, { status: 404 });
    if (existing.archivedAt || existing.lease.archivedAt || existing.lease.property.archivedAt) return Response.json({ error: "Payment period is unavailable." }, { status: 409 });
    const period = await prisma.period.update({ where: { id }, data: { name: parsed.data.name } });
    return Response.json({ data: {
      id: String(period.id), leaseId: String(period.leaseId), name: period.name,
      startDate: period.startDate.toISOString().slice(0, 10), endDate: period.endDate.toISOString().slice(0, 10),
      dueDate: period.dueDate.toISOString().slice(0, 10), archivedAt: period.archivedAt?.toISOString() ?? null,
    } }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") return Response.json({ error: "Payment period not found." }, { status: 404 });
    console.error("Update period failed", error);
    return Response.json({ error: "The request failed." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Context) {
  const user = await auth();
  if (!user) return Response.json({ error: "Sign in required." }, { status: 401, headers: { "WWW-Authenticate": "Bearer" } });
  if (user.role !== "LANDLORD") return Response.json({ error: "Only landlords can do that." }, { status: 403 });
  const rawId = (await params).id;
  const id = Number(rawId);
  if (!/^[1-9]\d*$/.test(rawId) || !Number.isSafeInteger(id)) return Response.json({ error: "Invalid record ID." }, { status: 400 });

  try {
    const existing = await prisma.period.findFirst({ where: { id, lease: { property: { ownerId: user.id } } } });
    if (!existing) return Response.json({ error: "Payment period not found." }, { status: 404 });
    const period = existing.archivedAt ? existing : await prisma.period.update({ where: { id }, data: { archivedAt: new Date() } });
    return Response.json({ data: {
      id: String(period.id), leaseId: String(period.leaseId), name: period.name,
      startDate: period.startDate.toISOString().slice(0, 10), endDate: period.endDate.toISOString().slice(0, 10),
      dueDate: period.dueDate.toISOString().slice(0, 10), archivedAt: period.archivedAt?.toISOString() ?? null,
    } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") return Response.json({ error: "Payment period not found." }, { status: 404 });
    console.error("Archive period failed", error);
    return Response.json({ error: "The request failed." }, { status: 500 });
  }
}
