import { prisma } from "@/lib/prisma";
import { roleRoute } from "@/lib/api-route";

export const GET = roleRoute("TENANT", async (_request, params, user) => {
  try {
    let tenantId: number | null = null;
    {
      const tenant = await prisma.tenant.findUnique({ where: { userId: user.id }, select: { id: true } });
      if (!tenant)
        return Response.json({ error: "Tenant profile not found." }, { status: 404 });
      tenantId = tenant.id;
    }
    const periods = await prisma.period.findMany({
      where: { leaseId: Number(params.lease), AND: [{ OR: [{ lease: { tenants: { some: { id: tenantId! } } } }, { payments: { some: { tenantId: tenantId! } } }] }] },
      orderBy: { startDate: "desc" },
    });
    return Response.json({ data: periods.map((period) => ({
        id: String(period.id), leaseId: String(period.leaseId), name: period.name,
        startDate: period.startDate.toISOString().slice(0, 10), endDate: period.endDate.toISOString().slice(0, 10),
        dueDate: period.dueDate.toISOString().slice(0, 10), archivedAt: period.archivedAt?.toISOString() ?? null,
      })) });
  }
  catch (error) {
    console.error("List periods failed", error);
    return Response.json({ error: "The request failed." }, { status: 500 });
  }
});
