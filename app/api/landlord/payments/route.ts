import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { roleRoute } from "@/lib/api-route";
import { todayISO } from "@/lib/domain";
import type { Prisma } from "@/lib/generated/prisma/client";
import type { PaymentStatus } from "@/lib/types";

const recordId = z.string().regex(/^[1-9]\d*$/).refine((value) => Number(value) <= 2147483647);
const filterSchema = z.object({
  apartment: recordId.optional(),
  lease: recordId.optional(),
  tenant: recordId.optional(),
  period: recordId.optional(),
  status: z.enum(["unpaid", "overdue", "pending", "confirmed", "failed"]).optional(),
}).strict();

export const GET = roleRoute("LANDLORD", async (request, _params, user) => {
  const query = new URL(request.url).searchParams;
  const input = Object.fromEntries([...query.entries()].filter(([, value]) => value !== ""));
  const parsed = filterSchema.safeParse(input);
  if (!parsed.success || [...query.keys()].some((key) => query.getAll(key).length > 1)) {
    return Response.json({ error: "Invalid payment filters." }, { status: 400 });
  }

  const filters = parsed.data;
  const today = new Date(`${todayISO()}T00:00:00.000Z`);
  const statusMap = { unpaid: "PENDING", overdue: "PENDING", pending: "REVIEW", confirmed: "COMPLETED", failed: "FAILED" } as const;
  const where: Prisma.PaymentWhereInput = {
    lease: {
      property: { ownerId: user.id },
      ...(filters.apartment ? { propertyId: Number(filters.apartment) } : {}),
    },
    ...(filters.lease ? { leaseId: Number(filters.lease) } : {}),
    ...(filters.tenant ? { tenantId: Number(filters.tenant) } : {}),
    ...(filters.period ? { periodId: Number(filters.period) } : {}),
    ...(filters.status ? { status: statusMap[filters.status] } : {}),
    ...(filters.status === "overdue" ? { period: { dueDate: { lt: today } } } : {}),
    ...(filters.status === "unpaid" ? { period: { dueDate: { gte: today } } } : {}),
  };
  const payments = await prisma.payment.findMany({
    where,
    select: { id: true, periodId: true, leaseId: true, tenantId: true, amount: true, status: true },
    orderBy: [{ paymentDate: "desc" }, { id: "desc" }],
  });
  const displayStatus: Record<(typeof payments)[number]["status"], PaymentStatus> = {
    PENDING: "unpaid", REVIEW: "pending", COMPLETED: "confirmed", FAILED: "failed",
  };
  return Response.json({ data: payments.map((payment) => ({
    id: String(payment.id), paymentPeriodId: String(payment.periodId),
    leaseId: String(payment.leaseId), tenantId: String(payment.tenantId),
    amountCents: Number(payment.amount), status: displayStatus[payment.status],
  })) });
});
