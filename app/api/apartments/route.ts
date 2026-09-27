import { z } from "zod";
import auth from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";

const apartmentSchema = z.object({
  name: z.string().trim().min(1),
  address: z.string().trim().min(1),
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
    const apartments = await prisma.property.findMany({
      where: user.role === "LANDLORD"
        ? { ownerId: user.id }
        : { leases: { some: { OR: [{ tenants: { some: { id: tenantId! } } }, { payments: { some: { tenantId: tenantId! } } }] } } },
      orderBy: { id: "desc" },
    });
    return Response.json({ data: apartments.map((apartment) => ({
      id: String(apartment.id), name: apartment.name, address: apartment.address,
      archivedAt: apartment.archivedAt?.toISOString() ?? null,
    })) });
  } catch (error) {
    console.error("List apartments failed", error);
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
  const parsed = apartmentSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Check the entered information." }, { status: 422 });

  try {
    const apartment = await prisma.property.create({ data: { ...parsed.data, ownerId: user.id } });
    return Response.json({ data: {
      id: String(apartment.id), name: apartment.name, address: apartment.address,
      archivedAt: apartment.archivedAt?.toISOString() ?? null,
    } }, { status: 201 });
  } catch (error) {
    console.error("Create apartment failed", error);
    return Response.json({ error: "The request failed." }, { status: 500 });
  }
}
