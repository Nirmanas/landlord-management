import { z } from "zod";
import auth from "@/lib/auth/auth";
import { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";

type Context = { params: Promise<{ id: string }> };
const apartmentSchema = z.object({
  name: z.string().trim().min(1),
  address: z.string().trim().min(1),
}).strict();

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
      if (!tenant) return Response.json({ error: "Tenant profile not found." }, { status: 403 });
      tenantId = tenant.id;
    }
    const apartment = await prisma.property.findFirst({ where: {
      id, ...(user.role === "LANDLORD"
        ? { ownerId: user.id }
        : { leases: { some: { OR: [{ tenants: { some: { id: tenantId! } } }, { payments: { some: { tenantId: tenantId! } } }] } } }),
    } });
    if (!apartment) return Response.json({ error: "Apartment not found." }, { status: 404 });
    return Response.json({ data: {
      id: String(apartment.id), name: apartment.name, address: apartment.address,
      archivedAt: apartment.archivedAt?.toISOString() ?? null,
    } });
  } catch (error) {
    console.error("Read apartment failed", error);
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
  const parsed = apartmentSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Check the entered information." }, { status: 400 });

  try {
    const existing = await prisma.property.findFirst({ where: { id, ownerId: user.id } });
    if (!existing) return Response.json({ error: "Apartment not found." }, { status: 404 });
    if (existing.archivedAt) return Response.json({ error: "Apartment is unavailable." }, { status: 409 });
    const apartment = await prisma.property.update({ where: { id }, data: parsed.data });
    return Response.json({ data: {
      id: String(apartment.id), name: apartment.name, address: apartment.address,
      archivedAt: apartment.archivedAt?.toISOString() ?? null,
    } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") return Response.json({ error: "Apartment not found." }, { status: 404 });
    console.error("Update apartment failed", error);
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
    const existing = await prisma.property.findFirst({ where: { id, ownerId: user.id } });
    if (!existing) return Response.json({ error: "Apartment not found." }, { status: 404 });
    const apartment = existing.archivedAt ? existing : await prisma.property.update({ where: { id }, data: { archivedAt: new Date() } });
    return Response.json({ data: {
      id: String(apartment.id), name: apartment.name, address: apartment.address,
      archivedAt: apartment.archivedAt?.toISOString() ?? null,
    } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") return Response.json({ error: "Apartment not found." }, { status: 404 });
    console.error("Archive apartment failed", error);
    return Response.json({ error: "The request failed." }, { status: 500 });
  }
}
