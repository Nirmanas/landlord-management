import { prisma } from "@/lib/prisma";
import { roleRoute } from "@/lib/api-route";
import { landlordLeaseDocumentLinks } from "@/lib/lease-links";
import {
  isPdf,
  MAX_LEASE_DOCUMENT_BYTES,
  pdfResponse,
  readLeasePdf,
  readUpload,
  removeLeasePdf,
  saveLeasePdf,
} from "@/lib/lease-document";

export const GET = roleRoute("LANDLORD", async (_request, params) => {
  const leaseId = Number(params.lease);
  const lease = await prisma.lease.findUnique({
    where: { id: leaseId }, select: { leaseFilePath: true },
  });
  if (!lease?.leaseFilePath)
    return Response.json({ error: "Lease file not found." }, { status: 404 });
  try {
    return pdfResponse(await readLeasePdf(leaseId, lease.leaseFilePath));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT")
      return Response.json({ error: "Lease file not found." }, { status: 404 });
    throw error;
  }
});

export const PUT = roleRoute("LANDLORD", async (request, params, user) => {
  if (request.headers.get("Content-Type") !== "application/pdf")
    return Response.json({ error: "Select a PDF file." }, { status: 415 });
  const contentLength = request.headers.get("Content-Length");
  if (contentLength && Number(contentLength) > MAX_LEASE_DOCUMENT_BYTES)
    return Response.json({ error: "The PDF must be 2 MB or smaller." }, { status: 413 });

  const data = await readUpload(request);
  if (!data)
    return Response.json({ error: "The PDF must be 2 MB or smaller." }, { status: 413 });
  if (!(await isPdf(data)))
    return Response.json({ error: "The file is not a valid PDF." }, { status: 422 });

  const leaseId = Number(params.lease);
  const lease = await prisma.lease.findFirst({
    where: { id: leaseId, propertyId: Number(params.apartment), property: { ownerId: user.id } },
    select: { archivedAt: true, leaseFilePath: true, property: { select: { archivedAt: true } } },
  });
  if (!lease)
    return Response.json({ error: "Lease not found." }, { status: 404 });
  if (lease.archivedAt || lease.property.archivedAt)
    return Response.json({ error: "Lease is unavailable." }, { status: 409 });

  const path = await saveLeasePdf(leaseId, data);
  try {
    await prisma.lease.update({ where: { id: leaseId }, data: { leaseFilePath: path } });
  } catch (error) {
    await removeLeasePdf(leaseId, path);
    throw error;
  }
  if (lease.leaseFilePath) {
    try {
      await removeLeasePdf(leaseId, lease.leaseFilePath);
    } catch (error) {
      console.error("Could not remove replaced lease file", error);
    }
  }
  return Response.json({ data: {
    links: landlordLeaseDocumentLinks(Number(params.apartment), leaseId, true, true),
  } });
});

