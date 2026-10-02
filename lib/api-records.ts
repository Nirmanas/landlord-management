import type { Tenant, TenantPayment } from "@/lib/types";

export const tenantSelect = {
  id: true,
  name: true,
  phoneNumber: true,
  archivedAt: true,
  user: { select: { email: true } },
} as const;

export function tenantRecord(tenant: {
  id: number;
  name: string;
  phoneNumber: string;
  archivedAt: Date | null;
  user: { email: string };
}): Tenant {
  const [firstName = "", ...lastName] = tenant.name.trim().split(/\s+/);
  return {
    id: String(tenant.id),
    firstName,
    lastName: lastName.join(" "),
    email: tenant.user.email,
    phone: tenant.phoneNumber,
    archivedAt: tenant.archivedAt?.toISOString() ?? null,
  };
}

export const paymentSelect = {
  id: true,
  periodId: true,
  leaseId: true,
  tenantId: true,
  amount: true,
  status: true,
} as const;

export function paymentRecord(payment: {
  id: number;
  periodId: number;
  leaseId: number;
  tenantId: number;
  amount: bigint;
  status: "PENDING" | "REVIEW" | "COMPLETED" | "FAILED";
}): TenantPayment {
  const statuses = {
    PENDING: "unpaid",
    REVIEW: "pending",
    COMPLETED: "confirmed",
    FAILED: "failed",
  } as const;
  return {
    id: String(payment.id),
    paymentPeriodId: String(payment.periodId),
    leaseId: String(payment.leaseId),
    tenantId: String(payment.tenantId),
    amountCents: Number(payment.amount),
    status: statuses[payment.status],
  };
}
