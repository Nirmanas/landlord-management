import { prisma } from "@/lib/prisma";
import { roleRoute } from "@/lib/api-route";

export const GET = roleRoute("TENANT", async (_request, params, user) => {
  const rawId = params.lease!;
  const id = Number(rawId);
  if (!/^[1-9]\d*$/.test(rawId) || !Number.isSafeInteger(id))
    return Response.json({ error: "Invalid record ID." }, { status: 400 });
  try {
    let tenantId: number | null = null;
    {
      const tenant = await prisma.tenant.findUnique({ where: { userId: user.id }, select: { id: true } });
      if (!tenant)
        return Response.json({ error: "Tenant profile not found." }, { status: 404 });
      tenantId = tenant.id;
    }
    const lease = await prisma.lease.findFirst({
      where: { id, ...({ OR: [{ tenants: { some: { id: tenantId! } } }, { payments: { some: { tenantId: tenantId! } } }] }) },
      include: { tenants: { select: { id: true } } },
    });
    if (!lease)
      return Response.json({ error: "Lease not found." }, { status: 404 });
    const startDate = lease.startDate.toISOString().slice(0, 10);
    const endDate = lease.endDate.toISOString().slice(0, 10);
    const today = new Date().toISOString().slice(0, 10);
    return Response.json({ data: {
        id: String(lease.id), apartmentId: String(lease.propertyId), startDate, endDate,
        status: startDate > today ? "upcoming" : endDate < today ? "ended" : "active",
        totalRentCents: Number(lease.rentalPrice), tenantIds: lease.tenants.map((tenant) => String(tenant.id)),
        archivedAt: lease.archivedAt?.toISOString() ?? null,
      } });
  }
  catch (error) {
    console.error("Read lease failed", error);
    return Response.json({ error: "The request failed." }, { status: 500 });
  }
});
