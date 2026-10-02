import { z } from "zod";
import { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { roleRoute } from "@/lib/api-route";

const apartmentSchema = z
  .object({
  name: z.string().trim().min(1),
  address: z.string().trim().min(1),
})
  .strict();

export const GET = roleRoute("LANDLORD", async (_request, params, user) => {
  const rawId = params.apartment!;
  const id = Number(rawId);
  if (!/^[1-9]\d*$/.test(rawId) || !Number.isSafeInteger(id))
    return Response.json({ error: "Invalid record ID." }, { status: 400 });
  try {
    const apartment = await prisma.property.findFirst({
      where: {
        id,
        ...({ ownerId: user.id }),
      },
    });
    if (!apartment)
      return Response.json({ error: "Apartment not found." }, { status: 404 });
    return Response.json({
      data: {
        id: String(apartment.id),
        name: apartment.name,
        address: apartment.address,
        archivedAt: apartment.archivedAt?.toISOString() ?? null,
      },
    });
  }
  catch (error) {
    console.error("Read apartment failed", error);
    return Response.json({ error: "The request failed." }, { status: 500 });
  }
});

export const PUT = roleRoute("LANDLORD", async (request, params, user) => {
  const rawId = params.apartment!;
  const id = Number(rawId);
  if (!/^[1-9]\d*$/.test(rawId) || !Number.isSafeInteger(id))
    return Response.json({ error: "Invalid record ID." }, { status: 400 });
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
    const existing = await prisma.property.findFirst({
      where: { id, ownerId: user.id },
    });
    if (!existing)
      return Response.json({ error: "Apartment not found." }, { status: 404 });
    if (existing.archivedAt)
      return Response.json({ error: "Apartment is unavailable." }, { status: 409 });
    const apartment = await prisma.property.update({
      where: { id },
      data: parsed.data,
    });
    return Response.json({
      data: {
        id: String(apartment.id),
        name: apartment.name,
        address: apartment.address,
        archivedAt: apartment.archivedAt?.toISOString() ?? null,
      },
    }, { status: 201 });
  }
  catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025")
      return Response.json({ error: "Apartment not found." }, { status: 404 });
    console.error("Update apartment failed", error);
    return Response.json({ error: "The request failed." }, { status: 500 });
  }
});

export const DELETE = roleRoute("LANDLORD", async (_request, params, user) => {
  const rawId = params.apartment!;
  const id = Number(rawId);
  if (!/^[1-9]\d*$/.test(rawId) || !Number.isSafeInteger(id))
    return Response.json({ error: "Invalid record ID." }, { status: 400 });
  try {
    const existing = await prisma.property.findFirst({
      where: { id, ownerId: user.id },
    });
    if (!existing)
      return Response.json({ error: "Apartment not found." }, { status: 404 });
    const apartment = existing.archivedAt
      ? existing
      : await prisma.property.update({
        where: { id },
        data: { archivedAt: new Date() },
      });
    return Response.json({
      data: {
        id: String(apartment.id),
        name: apartment.name,
        address: apartment.address,
        archivedAt: apartment.archivedAt?.toISOString() ?? null,
      },
    });
  }
  catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025")
      return Response.json({ error: "Apartment not found." }, { status: 404 });
    console.error("Archive apartment failed", error);
    return Response.json({ error: "The request failed." }, { status: 500 });
  }
});
