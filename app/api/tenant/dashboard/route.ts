import { prisma } from "@/lib/prisma";
import { roleRoute } from "@/lib/api-route";
import { tenantRecord, tenantSelect } from "@/lib/api-records";
import { splitRent, todayISO } from "@/lib/domain";
import type { Lease, TenantDashboard } from "@/lib/types";

export const GET = roleRoute("TENANT", async (_request, _params, user) => {
  const [profile, leases, payments] = await Promise.all([
    prisma.tenant.findUnique({
      where: { userId: user.id },
      select: tenantSelect,
    }),
    prisma.lease.findMany({
      where: { tenants: { some: { userId: user.id } } },
      include: { tenants: { select: { id: true } }, property: true },
      orderBy: { startDate: "desc" },
    }),
    prisma.payment.findMany({
      where: { tenant: { userId: user.id }, status: { not: "COMPLETED" } },
      select: { id: true, amount: true, period: { select: { dueDate: true } } },
      orderBy: [{ period: { dueDate: "asc" } }, { id: "asc" }],
    }),
  ]);
  const today = todayISO();
  const status = (start: Date, end: Date): Lease["status"] =>
    start.toISOString().slice(0, 10) > today
      ? "upcoming"
      : end.toISOString().slice(0, 10) < today
        ? "ended"
        : "active";
  const selected =
    leases.find(
      (lease) => status(lease.startDate, lease.endDate) === "active",
    ) ??
    leases.find(
      (lease) => status(lease.startDate, lease.endDate) === "upcoming",
    ) ??
    leases[0];
  const currentLease: Lease | null = selected
    ? {
        id: String(selected.id),
        apartmentId: String(selected.propertyId),
        startDate: selected.startDate.toISOString().slice(0, 10),
        endDate: selected.endDate.toISOString().slice(0, 10),
        status: status(selected.startDate, selected.endDate),
        totalRentCents: Number(selected.rentalPrice),
        tenantIds: selected.tenants.map((tenant) => String(tenant.id)),
        archivedAt: selected.archivedAt?.toISOString() ?? null,
      }
    : null;
  const upcoming = payments
    .filter(
      (payment) => payment.period.dueDate.toISOString().slice(0, 10) >= today,
    )
    .map((payment) => ({
      id: String(payment.id),
      amountCents: Number(payment.amount),
      dueDate: payment.period.dueDate.toISOString().slice(0, 10),
    }));
  const data: TenantDashboard = {
    tenant: profile ? tenantRecord(profile) : null,
    currentLease,
    apartment: selected
      ? {
          id: String(selected.property.id),
          name: selected.property.name,
          address: selected.property.address,
          archivedAt: selected.property.archivedAt?.toISOString() ?? null,
        }
      : null,
    shareCents:
      currentLease && profile
        ? (splitRent(currentLease.totalRentCents, currentLease.tenantIds).find(
            (share) => share.tenantId === String(profile.id),
          )?.amountCents ?? null)
        : null,
    outstandingCents: payments.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0,
    ),
    outstandingCount: payments.length,
    nextPayment: upcoming[0] ?? null,
    upcomingPayments: upcoming.slice(0, 3),
  };
  return Response.json({ data });
});
