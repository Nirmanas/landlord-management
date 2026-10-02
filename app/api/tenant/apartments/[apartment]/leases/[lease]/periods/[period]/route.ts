import { prisma } from "@/lib/prisma";
import { roleRoute } from "@/lib/api-route";

export const GET = roleRoute("TENANT", async (_request, params, user) => {
  const rawId = params.period!;
  const id = Number(rawId);
  if (!/^[1-9]\d*$/.test(rawId) || !Number.isSafeInteger(id))
    return Response.json({ error: "Invalid record ID." }, { status: 400 });
  try {
    let tenantId: number | null = null;
    {
      const tenant = await prisma.tenant.findUnique({ where: { userId: user.id }, select: { id: true } });
      if (!tenant)
        return Response.json({ error: "Tenant profile not found." }, { status: 404 });
      tenantId = tenant.id;
    }
    const period = await prisma.period.findFirst({ where: {
        id, ...({ OR: [{ lease: { tenants: { some: { id: tenantId! } } } }, { payments: { some: { tenantId: tenantId! } } }] }),
      } });
    if (!period)
      return Response.json({ error: "Payment period not found." }, { status: 404 });
    return Response.json({ data: {
        id: String(period.id), leaseId: String(period.leaseId), name: period.name,
        startDate: period.startDate.toISOString().slice(0, 10), endDate: period.endDate.toISOString().slice(0, 10),
        dueDate: period.dueDate.toISOString().slice(0, 10), archivedAt: period.archivedAt?.toISOString() ?? null,
      } });
  }
  catch (error) {
    console.error("Read period failed", error);
    return Response.json({ error: "The request failed." }, { status: 500 });
  }
});
