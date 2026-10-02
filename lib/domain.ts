import type { PaymentPeriod, Tenant, TenantPayment } from "@/lib/types";

export const tenantName = (tenant: Tenant) =>
  `${tenant.firstName} ${tenant.lastName}`.trim();

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
  const remainder = totalCents % tenantIds.length;
  const sorted = [...tenantIds].sort((a, b) => Number(a) - Number(b));
  return tenantIds.map((tenantId) => ({
    tenantId,
    amountCents: base + (sorted.indexOf(tenantId) < remainder ? 1 : 0),
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
