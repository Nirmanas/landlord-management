import { prisma } from "@/lib/prisma";
import type { AppData, LeaseStatus, PaymentStatus } from "@/lib/types";

const day = (date: Date) => date.toISOString().slice(0, 10);
const stamp = (date: Date | null) => date?.toISOString() ?? null;
const id = (value: number) => String(value);

function leaseStatus(start: Date, end: Date): LeaseStatus {
  const today = new Date().toISOString().slice(0, 10);
  return day(start) > today ? "upcoming" : day(end) < today ? "ended" : "active";
}

function paymentStatus(status: "PENDING" | "REVIEW" | "COMPLETED" | "FAILED"): PaymentStatus {
  return { PENDING: "unpaid", REVIEW: "pending", COMPLETED: "confirmed", FAILED: "failed" }[status] as PaymentStatus;
}

export async function loadLandlordData(ownerId: number): Promise<AppData> {
  return loadData({ ownerId });
}

export async function loadTenantData(userId: number): Promise<AppData> {
  const tenant = await prisma.tenant.findUnique({ where: { userId }, select: { id: true } });
  return loadData({ tenantId: tenant?.id ?? -1 });
}

async function loadData(scope: { ownerId: number } | { tenantId: number }): Promise<AppData> {
  const landlord = "ownerId" in scope;
  const leases = await prisma.lease.findMany({
    where: landlord
      ? { property: { ownerId: scope.ownerId } }
      : { OR: [{ tenants: { some: { id: scope.tenantId } } }, { payments: { some: { tenantId: scope.tenantId } } }] },
    include: { tenants: { include: { user: true } }, property: true },
    orderBy: { startDate: "desc" },
  });
  const apartmentIds = landlord ? undefined : [...new Set(leases.map((lease) => lease.propertyId))];
  const [apartments, tenants, periods, payments] = await Promise.all([
    prisma.property.findMany({ where: landlord ? { ownerId: scope.ownerId } : { id: { in: apartmentIds } }, orderBy: { id: "desc" } }),
    prisma.tenant.findMany({
      where: landlord ? { user: { role: { role: "TENANT" } } } : { id: scope.tenantId },
      include: { user: true },
      orderBy: { id: "desc" },
    }),
    prisma.period.findMany({ where: landlord ? { leaseId: { in: leases.map((lease) => lease.id) } } : { payments: { some: { tenantId: scope.tenantId } } }, orderBy: { startDate: "desc" } }),
    prisma.payment.findMany({
      where: landlord ? { lease: { property: { ownerId: scope.ownerId } } } : { tenantId: scope.tenantId },
      orderBy: { paymentDate: "desc" },
    }),
  ]);
  return {
    apartments: apartments.map((a) => ({ id: id(a.id), name: a.name, address: a.address, archivedAt: stamp(a.archivedAt) })),
    tenants: tenants.map((t) => {
      const parts = t.name.trim().split(/\s+/);
      return { id: id(t.id), firstName: parts[0] ?? "", lastName: parts.slice(1).join(" "), email: t.user.email, phone: t.phoneNumber, archivedAt: stamp(t.archivedAt) };
    }),
    leases: leases.map((l) => ({ id: id(l.id), apartmentId: id(l.propertyId), startDate: day(l.startDate), endDate: day(l.endDate), status: leaseStatus(l.startDate, l.endDate), totalRentCents: Number(l.rentalPrice), tenantIds: l.tenants.map((t) => id(t.id)), archivedAt: stamp(l.archivedAt) })),
    paymentPeriods: periods.map((p) => ({ id: id(p.id), leaseId: id(p.leaseId), name: p.name, startDate: day(p.startDate), endDate: day(p.endDate), dueDate: day(p.dueDate), archivedAt: stamp(p.archivedAt) })),
    tenantPayments: payments.map((p) => ({ id: id(p.id), paymentPeriodId: id(p.periodId), leaseId: id(p.leaseId), tenantId: id(p.tenantId), amountCents: Number(p.amount), status: paymentStatus(p.status) })),
  };
}
