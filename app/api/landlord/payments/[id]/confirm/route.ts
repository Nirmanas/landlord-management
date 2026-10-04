import { prisma } from "@/lib/prisma";
import { roleRoute } from "@/lib/api-route";

export const PATCH = roleRoute("LANDLORD", async (_request, params, user) => {
  const id = Number(params.id);
  const scope = { lease: { property: { ownerId: user.id } } };
  const payment = await prisma.payment.findFirst({
    where: { id, ...scope }, select: { id: true },
  });
  if (!payment)
    return Response.json({ error: "Payment not found." }, { status: 404 });
  const result = await prisma.payment.updateMany({
    where: { id, ...scope, status: "REVIEW" },
    data: { status: "COMPLETED" },
  });
  if (result.count !== 1)
    return Response.json({
      error: "Payment is not awaiting confirmation.",
    }, { status: 409 });
  return Response.json({ data: { id: String(id), status: "confirmed" } });
});
