import { NextResponse } from "next/server";
import { AFTER_AUTH_COOKIE, safeNextPath } from "@/lib/redirects";

/** Persist a safe post-auth path, then redirect (e.g. into email verification). */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const next = safeNextPath(url.searchParams.get("next"));
  const toRaw = safeNextPath(url.searchParams.get("to")) || "/grupos";

  const dest = new URL(toRaw, url.origin);
  if (next) dest.searchParams.set("next", next);

  const res = NextResponse.redirect(dest);
  if (next) {
    res.cookies.set(AFTER_AUTH_COOKIE, next, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 2,
    });
  } else {
    res.cookies.set(AFTER_AUTH_COOKIE, "", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
  }
  return res;
}
