import type {
  AppData,
  PaymentPeriod,
  Tenant,
  TenantPayment,
} from "@/lib/types";

export const tenantName = (tenant: Tenant) =>
  `${tenant.firstName} ${tenant.lastName}`;

export const formatCurrency = (cents: number) =>
  new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);

export const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-IE", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));

export const todayISO = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

export function splitRent(totalCents: number, tenantIds: string[]) {
  if (tenantIds.length === 0) return [];
  const base = Math.floor(totalCents / tenantIds.length);
  return tenantIds.map((tenantId) => ({
    tenantId,
    amountCents: base,
  }));
}

export function isOverdue(
  payment: TenantPayment,
  period: PaymentPeriod | undefined,
  today = todayISO(),
) {
  return (
    payment.status === "unpaid" && Boolean(period && period.dueDate < today)
  );
}

export function landlordMetrics(data: AppData) {
  const outstanding = data.tenantPayments.filter(
    (payment) => payment.status !== "confirmed",
  );
  return {
    apartments: data.apartments.length,
    activeLeases: data.leases.filter((lease) => lease.status === "active")
      .length,
    tenants: data.tenants.length,
    outstandingCount: outstanding.length,
    outstandingCents: outstanding.reduce(
      (total, payment) => total + payment.amountCents,
      0,
    ),
    pendingCount: data.tenantPayments.filter(
      (payment) => payment.status === "pending",
    ).length,
  };
}
