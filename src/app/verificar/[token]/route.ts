import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyEmailToken } from "@/lib/email";
import { AFTER_AUTH_COOKIE, safeNextPath } from "@/lib/redirects";

const DEV_VERIFY_COOKIE = "pelotear_dev_verify_url";

export async function GET(
  request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;
  const result = await verifyEmailToken(token);
  const base = request.url;

  if (!result.ok) {
    const url = new URL("/verificar-email", base);
    url.searchParams.set("error", result.error || "Link inválido.");
    return NextResponse.redirect(url);
  }

  const jar = await cookies();
  const after = safeNextPath(jar.get(AFTER_AUTH_COOKIE)?.value);
  const dest = after || "/perfil?verificado=1";
  const res = NextResponse.redirect(new URL(dest, base));
  res.cookies.set(DEV_VERIFY_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  res.cookies.set(AFTER_AUTH_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}
