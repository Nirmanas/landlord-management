import { prisma } from "@/lib/prisma";
import { roleRoute } from "@/lib/api-route";

export const GET = roleRoute("LANDLORD", async (_request, _params, user) => {
  try {
    const periods = await prisma.period.findMany({
      where: { leaseId: undefined, AND: [{ lease: { property: { ownerId: user.id } } }] },
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
