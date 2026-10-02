import { prisma } from "@/lib/prisma";
import { roleRoute } from "@/lib/api-route";

export const GET = roleRoute("TENANT", async (_request, params, user) => {
  const rawId = params.apartment!;
  const id = Number(rawId);
  if (!/^[1-9]\d*$/.test(rawId) || !Number.isSafeInteger(id))
    return Response.json({ error: "Invalid record ID." }, { status: 400 });
  try {
    let tenantId: number | null = null;
    {
      const tenant = await prisma.tenant.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });
      if (!tenant)
        return Response.json({ error: "Tenant profile not found." }, { status: 404 });
      tenantId = tenant.id;
    }
    const apartment = await prisma.property.findFirst({
      where: {
        id,
        ...({
          leases: {
            some: {
              OR: [
                { tenants: { some: { id: tenantId! } } },
                { payments: { some: { tenantId: tenantId! } } },
              ],
            },
          },
        }),
      },
    });
    if (!apartment)
      return Response.json({ error: "Apartment not found." }, { status: 404 });
    return Response.json({
      data: {
        id: String(apartment.id),
        name: apartment.name,
        address: apartment.address,
        archivedAt: apartment.archivedAt?.toISOString() ?? null,
      },
    });
  }
  catch (error) {
    console.error("Read apartment failed", error);
    return Response.json({ error: "The request failed." }, { status: 500 });
  }
});
