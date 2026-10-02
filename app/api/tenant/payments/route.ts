import { prisma } from "@/lib/prisma";
import { roleRoute } from "@/lib/api-route";
import { paymentRecord, paymentSelect } from "@/lib/api-records";

export const GET = roleRoute("TENANT", async (_request, _params, user) => {
  const payments = await prisma.payment.findMany({
    where: { tenant: { userId: user.id } },
    select: paymentSelect,
    orderBy: [{ paymentDate: "desc" }, { id: "desc" }],
  });
  return Response.json({ data: payments.map(paymentRecord) });
});
