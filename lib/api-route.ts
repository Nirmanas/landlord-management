import "server-only";

import { revalidatePath } from "next/cache";
import auth from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@/lib/generated/prisma/browser";

export type ApiParams = Partial<
  Record<"id" | "apartment" | "lease" | "period", string>
>;
type User = NonNullable<Awaited<ReturnType<typeof auth>>>;
type Handler = (
  request: Request,
  params: ApiParams,
  user: User,
) => Promise<Response>;

const errorResponse = (error: string, status: number) =>
  Response.json({ error }, { status });

// Every role-specific route checks its role and the full URL ancestry before dispatch.
export function roleRoute(
  role: UserRole,
  handler: Handler,
  parentBody?: "apartmentId" | "leaseId",
) {
  return async (request: Request, context: { params: Promise<ApiParams> }) => {
    try {
      const user = await auth();
      if (!user)
        return Response.json(
          { error: "Sign in required." },
          {
            status: 401,
            headers: { "WWW-Authenticate": "Bearer" },
          },
        );
      if (user.role !== role)
        return errorResponse(
          `Only ${role === "LANDLORD" ? "landlords" : "tenants"} can do that.`,
          403,
        );

      const mutation = !["GET", "HEAD", "OPTIONS"].includes(request.method);
      const origin = request.headers.get("origin");
      if (mutation && origin && origin !== new URL(request.url).origin) {
        return errorResponse("Cross-origin requests are not allowed.", 403);
      }

      const params = await context.params;
      if (
        params &&
        Object.values(params).some(
          (id) =>
            !/^[1-9]\d*$/.test(id) ||
            !Number.isSafeInteger(Number(id)) ||
            Number(id) > 2147483647,
        )
      ) {
        return errorResponse("Invalid record ID.", 400);
      }

      if (params?.apartment) {
        const apartment = await prisma.property.findFirst({
          where: {
            id: Number(params.apartment),
            ...(role === "LANDLORD"
              ? { ownerId: user.id }
              : {
                  leases: {
                    some: {
                      OR: [
                        { tenants: { some: { userId: user.id } } },
                        { payments: { some: { tenant: { userId: user.id } } } },
                      ],
                    },
                  },
                }),
          },
          select: { id: true },
        });
        if (!apartment) return errorResponse("Apartment not found.", 404);
      }
      if (params?.lease) {
        const lease = await prisma.lease.findFirst({
          where: {
            id: Number(params.lease),
            propertyId: params.apartment ? Number(params.apartment) : undefined,
            ...(role === "LANDLORD"
              ? { property: { ownerId: user.id } }
              : {
                  OR: [
                    { tenants: { some: { userId: user.id } } },
                    { payments: { some: { tenant: { userId: user.id } } } },
                  ],
                }),
          },
          select: { id: true },
        });
        if (!lease) return errorResponse("Lease not found.", 404);
      }
      if (params?.period) {
        const period = await prisma.period.findFirst({
          where: {
            id: Number(params.period),
            leaseId: params.lease ? Number(params.lease) : undefined,
            ...(role === "LANDLORD"
              ? { lease: { property: { ownerId: user.id } } }
              : {
                  OR: [
                    { lease: { tenants: { some: { userId: user.id } } } },
                    { payments: { some: { tenant: { userId: user.id } } } },
                  ],
                }),
          },
          select: { id: true },
        });
        if (!period) return errorResponse("Payment period not found.", 404);
      }

      if (parentBody) {
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return errorResponse("Invalid JSON body.", 400);
        }
        if (!body || typeof body !== "object" || Array.isArray(body))
          return errorResponse("Check the entered information.", 422);
        const record = body as Record<string, unknown>;
        const parentId =
          parentBody === "apartmentId" ? params.apartment : params.lease;
        if (record[parentBody] !== undefined && record[parentBody] !== parentId)
          return errorResponse("The parent ID must match the URL.", 422);
        request = new Request(request.url, {
          method: request.method,
          headers: request.headers,
          body: JSON.stringify({ ...record, [parentBody]: parentId }),
        });
      }

      const response = await handler(request, params, user);
      response.headers.set("Cache-Control", "no-store");
      if (mutation && response.ok) {
        revalidatePath("/landlord", "layout");
        revalidatePath("/tenant", "layout");
      }
      return response;
    } catch (error) {
      console.error("API request failed", error);
      return errorResponse("The request failed.", 500);
    }
  };
}
