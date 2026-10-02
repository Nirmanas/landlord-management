import { prisma } from "@/lib/prisma";
import { roleRoute } from "@/lib/api-route";

export const GET = roleRoute("LANDLORD", async (_request, _params, user) => {
  try {
    const leases = await prisma.lease.findMany({
      where: { propertyId: undefined, AND: [{ property: { ownerId: user.id } }] },
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
