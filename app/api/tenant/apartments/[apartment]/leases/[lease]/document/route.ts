import { prisma } from "@/lib/prisma";
import { roleRoute } from "@/lib/api-route";
import { pdfResponse, readLeasePdf } from "@/lib/lease-document";

export const GET = roleRoute("TENANT", async (_request, params, user) => {
  const leaseId = Number(params.lease);
  const lease = await prisma.lease.findFirst({
    where: {
      id: leaseId,
      propertyId: Number(params.apartment),
      tenants: { some: { userId: user.id } },
    },
    select: { leaseFilePath: true },
  });
  if (!lease?.leaseFilePath)
    return Response.json({ error: "Lease file not found." }, { status: 404 });
  try {
    return pdfResponse(await readLeasePdf(leaseId, lease.leaseFilePath), true);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT")
      return Response.json({ error: "Lease file not found." }, { status: 404 });
    throw error;
  }
});
