import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { roleRoute } from "@/lib/api-route";

const apartmentSchema = z.object({
  name: z.string().trim().min(1),
  address: z.string().trim().min(1),
}).strict();

export const GET = roleRoute("LANDLORD", async (_request, _params, user) => {
  try {
    const apartments = await prisma.property.findMany({
      where: { ownerId: user.id },
      orderBy: { id: "desc" },
    });
    return Response.json({ data: apartments.map((apartment) => ({
        id: String(apartment.id), name: apartment.name, address: apartment.address,
        archivedAt: apartment.archivedAt?.toISOString() ?? null,
      })) });
  }
  catch (error) {
    console.error("List apartments failed", error);
    return Response.json({ error: "The request failed." }, { status: 500 });
  }
});

export const POST = roleRoute("LANDLORD", async (request, _params, user) => {
  let body: unknown;
  try {
    body = await request.json();
  }
  catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const parsed = apartmentSchema.safeParse(body);
  if (!parsed.success)
    return Response.json({ error: "Check the entered information." }, { status: 422 });
  try {
    const apartment = await prisma.property.create({ data: { ...parsed.data, ownerId: user.id } });
    return Response.json({ data: {
        id: String(apartment.id), name: apartment.name, address: apartment.address,
        archivedAt: apartment.archivedAt?.toISOString() ?? null,
      } }, { status: 201 });
  }
  catch (error) {
    console.error("Create apartment failed", error);
    return Response.json({ error: "The request failed." }, { status: 500 });
  }
});
