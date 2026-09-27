import { registerRequestSchema } from "@/components/auth/schemas";
import { Prisma } from "@/lib/generated/prisma/client";
import { register } from "@/lib/auth/auth";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const result = registerRequestSchema.safeParse(body);

  if (!result.success) {
    return Response.json(
      {
        error: "Invalid registration data",
        fields: result.error.flatten().fieldErrors,
      },
      { status: 422 },
    );
  }
  try {
    await register(
      result.data.email,
      result.data.password,
      result.data.name,
      result.data.phoneNumber,
    );
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return Response.json({ error: "Email already registered" }, { status: 409 });
    }
    throw error;
  }

  return Response.json({ success: true }, { status: 201 });
}
