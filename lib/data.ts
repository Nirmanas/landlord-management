import { prisma } from "@/lib/prisma";
import type { AppData, PaymentStatus } from "@/lib/types";

type SupplementalData = Pick<AppData, "tenants" | "tenantPayments">;
const stamp = (date: Date | null) => date?.toISOString() ?? null;
function paymentStatus(status: "PENDING" | "REVIEW" | "COMPLETED" | "FAILED"): PaymentStatus {
  return { PENDING: "unpaid", REVIEW: "pending", COMPLETED: "confirmed", FAILED: "failed" }[status] as PaymentStatus;
}

export async function loadLandlordData(ownerId: number): Promise<SupplementalData> {
  return loadData({ ownerId });
}

export async function loadTenantData(userId: number): Promise<SupplementalData> {
  const tenant = await prisma.tenant.findUnique({ where: { userId }, select: { id: true } });
  return loadData({ tenantId: tenant?.id ?? -1 });
}

async function loadData(scope: { ownerId: number } | { tenantId: number }): Promise<SupplementalData> {
  const landlord = "ownerId" in scope;
  const [tenants, payments] = await Promise.all([
    prisma.tenant.findMany({
      where: landlord ? { user: { role: { role: "TENANT" } } } : { id: scope.tenantId },
      include: { user: true }, orderBy: { id: "desc" },
    }),
    prisma.payment.findMany({
      where: landlord ? { lease: { property: { ownerId: scope.ownerId } } } : { tenantId: scope.tenantId },
      orderBy: { paymentDate: "desc" },
    }),
  ]);
  return {
    tenants: tenants.map((tenant) => {
      const parts = tenant.name.trim().split(/\s+/);
      return { id: String(tenant.id), firstName: parts[0] ?? "", lastName: parts.slice(1).join(" "), email: tenant.user.email, phone: tenant.phoneNumber, archivedAt: stamp(tenant.archivedAt) };
    }),
    tenantPayments: payments.map((payment) => ({
      id: String(payment.id), paymentPeriodId: String(payment.periodId), leaseId: String(payment.leaseId), tenantId: String(payment.tenantId),
      amountCents: Number(payment.amount), status: paymentStatus(payment.status),
    })),
  };
}
