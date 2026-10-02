import { prisma } from "@/lib/prisma";
import { roleRoute } from "@/lib/api-route";

export const GET = roleRoute("TENANT", async (_request, _params, user) => {
  try {
    let tenantId: number | null = null;
    {
      const tenant = await prisma.tenant.findUnique({ where: { userId: user.id }, select: { id: true } });
      if (!tenant)
        return Response.json({ error: "Tenant profile not found." }, { status: 404 });
      tenantId = tenant.id;
    }
    const apartments = await prisma.property.findMany({
      where: { leases: { some: { OR: [{ tenants: { some: { id: tenantId! } } }, { payments: { some: { tenantId: tenantId! } } }] } } },
      orderBy: { id: "desc" },
    });
    return Response.json({ data: apartments.map((apartment) => ({
        id: String(apartment.id), name: apartment.name, address: apartment.address,
        archivedAt: apartment.archivedAt?.toISOString() ?? null,
      })) });
  }
  catch (error) {
    console.error("List apartments failed", error);
    return Response.json({ error: "The request failed." }, { status: 500 });
  }
});
