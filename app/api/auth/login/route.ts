import { loginSchema } from "@/components/auth/schemas";
import { login, logout } from "@/lib/auth/auth";

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

  try {
    await login(result.data.email, result.data.password);
  } catch {
    return Response.json({ error: "Invalid email or password." }, { status: 401 });
  }

  return Response.json({ success: true }, { status: 200 });
}

export async function DELETE() {
  await logout();
  return Response.json({ success: true }, { status: 200 });
}
