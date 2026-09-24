import { loginSchema } from "@/components/auth/schemas";
import { login } from "@/lib/auth/auth";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const result = loginSchema.safeParse(body);
  if (!result.success) {
    return Response.json(
      {
        error: "Invalid login data",
        fields: result.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  login(result.data.email, result.data.password);
}
