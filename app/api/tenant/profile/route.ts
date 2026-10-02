import { prisma } from "@/lib/prisma";
import { roleRoute } from "@/lib/api-route";
import { tenantRecord, tenantSelect } from "@/lib/api-records";

export const GET = roleRoute("TENANT", async (_request, _params, user) => {
  const tenant = await prisma.tenant.findUnique({
    where: { userId: user.id },
    select: tenantSelect,
  });
  return Response.json({ data: tenant ? tenantRecord(tenant) : null });
});
