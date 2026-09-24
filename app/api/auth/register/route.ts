import { registerRequestSchema } from "@/components/auth/schemas";
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
      { status: 400 },
    );
  }
  register(
    result.data.email,
    result.data.password,
    result.data.name,
    result.data.phoneNumber,
  );
}
