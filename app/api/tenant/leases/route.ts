import { prisma } from "@/lib/prisma";
import { roleRoute } from "@/lib/api-route";
import { tenantLeaseDocumentLinks } from "@/lib/lease-links";

export const GET = roleRoute("TENANT", async (_request, _params, user) => {
  try {
    let tenantId: number | null = null;
    {
      const tenant = await prisma.tenant.findUnique({ where: { userId: user.id }, select: { id: true } });
      if (!tenant)
        return Response.json({ error: "Tenant profile not found." }, { status: 404 });
      tenantId = tenant.id;
    }
    const leases = await prisma.lease.findMany({
      where: { propertyId: undefined, AND: [{ OR: [{ tenants: { some: { id: tenantId! } } }, { payments: { some: { tenantId: tenantId! } } }] }] },
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
          links: tenantLeaseDocumentLinks(lease.propertyId, lease.id, Boolean(lease.leaseFilePath && lease.tenants.some((tenant) => tenant.id === tenantId))),
        };
      }) });
  }
  catch (error) {
    console.error("List leases failed", error);
    return Response.json({ error: "The request failed." }, { status: 500 });
  }
});
