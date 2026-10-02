import { prisma } from "@/lib/prisma";
import { roleRoute } from "@/lib/api-route";
import { todayISO } from "@/lib/domain";
import type { LandlordDashboard } from "@/lib/types";

export const GET = roleRoute("LANDLORD", async (_request, _params, user) => {
  const today = new Date(`${todayISO()}T00:00:00.000Z`);
  const activeLease = {
    archivedAt: null,
    startDate: { lte: today },
    endDate: { gte: today },
  };
  const [apartments, activeLeases, tenants, outstanding, pending] =
    await Promise.all([
      prisma.property.findMany({
        where: { ownerId: user.id, archivedAt: null },
        select: {
          id: true,
          name: true,
          _count: { select: { leases: { where: activeLease } } },
        },
        orderBy: { id: "desc" },
      }),
      prisma.lease.count({
        where: {
          ...activeLease,
          property: { ownerId: user.id, archivedAt: null },
        },
      }),
      prisma.tenant.count({
        where: { archivedAt: null, user: { role: { role: "TENANT" } } },
      }),
      prisma.payment.aggregate({
        where: {
          lease: { property: { ownerId: user.id } },
          status: { not: "COMPLETED" },
        },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.payment.findMany({
        where: { lease: { property: { ownerId: user.id } }, status: "REVIEW" },
        select: {
          id: true,
          amount: true,
          tenant: { select: { name: true } },
          lease: { select: { property: { select: { name: true } } } },
        },
        orderBy: [{ paymentDate: "desc" }, { id: "desc" }],
      }),
    ]);
  const data: LandlordDashboard = {
    metrics: {
      apartments: apartments.length,
      activeLeases,
      tenants,
      outstandingCount: outstanding._count,
      outstandingCents: Number(outstanding._sum.amount ?? 0),
      pendingCount: pending.length,
    },
    pendingPayments: pending.map((payment) => ({
      id: String(payment.id),
      amountCents: Number(payment.amount),
      tenantName: payment.tenant.name,
      apartmentName: payment.lease.property.name,
    })),
    apartments: apartments.map((apartment) => ({
      id: String(apartment.id),
      name: apartment.name,
      hasActiveLease: apartment._count.leases > 0,
    })),
  };
  return Response.json({ data });
});
