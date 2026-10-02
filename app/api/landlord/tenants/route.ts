import { prisma } from "@/lib/prisma";
import { roleRoute } from "@/lib/api-route";
import { tenantRecord, tenantSelect } from "@/lib/api-records";

export const GET = roleRoute("LANDLORD", async () => {
  const tenants = await prisma.tenant.findMany({
    where: { user: { role: { role: "TENANT" } } },
    select: tenantSelect,
    orderBy: { id: "desc" },
  });
  return Response.json({ data: tenants.map(tenantRecord) });
});
