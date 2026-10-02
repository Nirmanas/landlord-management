import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { roleRoute } from "@/lib/api-route";
import { tenantRecord, tenantSelect } from "@/lib/api-records";

export const GET = roleRoute("LANDLORD", async (_request, params) => {
  const tenant = await prisma.tenant.findFirst({
    where: { id: Number(params.id), user: { role: { role: "TENANT" } } },
    select: tenantSelect,
  });
  if (!tenant)
    return Response.json({ error: "Tenant not found." }, { status: 404 });
  return Response.json({ data: tenantRecord(tenant) });
});

const tenantSchema = z
  .object({
    name: z.string().trim().min(1),
    phoneNumber: z.string().trim().min(1),
  })
  .strict();

export const PUT = roleRoute("LANDLORD", async (request, params) => {
  const id = Number(params.id);
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const parsed = tenantSchema.safeParse(body);
  if (!parsed.success)
    return Response.json(
      { error: "Check the entered information." },
      { status: 422 },
    );
  const tenant = await prisma.tenant.findFirst({
    where: { id, user: { role: { role: "TENANT" } } },
  });
  if (!tenant)
    return Response.json({ error: "Tenant not found." }, { status: 404 });
  if (tenant.archivedAt)
    return Response.json({ error: "Tenant is unavailable." }, { status: 409 });
  await prisma.tenant.update({ where: { id }, data: parsed.data });
  return Response.json({ data: { id: String(id) } });
});

export const DELETE = roleRoute("LANDLORD", async (_request, params) => {
  const id = Number(params.id);
  const tenant = await prisma.tenant.findFirst({
    where: { id, user: { role: { role: "TENANT" } } },
  });
  if (!tenant)
    return Response.json({ error: "Tenant not found." }, { status: 404 });
  if (!tenant.archivedAt)
    await prisma.tenant.update({
      where: { id },
      data: { archivedAt: new Date() },
    });
  return Response.json({ data: { id: String(id) } });
});
