import { NextResponse } from "next/server";
import { appBaseUrl, verifyEmailToken } from "@/lib/email";

const DEV_VERIFY_COOKIE = "pelotear_dev_verify_url";

export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;
  const result = await verifyEmailToken(token);
  const base = appBaseUrl();

  if (!result.ok) {
    const url = new URL("/verificar-email", base);
    url.searchParams.set("error", result.error || "Link inválido.");
    return NextResponse.redirect(url);
  }

  const res = NextResponse.redirect(new URL("/perfil?verificado=1", base));
  res.cookies.set(DEV_VERIFY_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}
