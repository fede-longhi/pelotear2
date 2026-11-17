import { NextRequest, NextResponse } from "next/server";
import {
  buildGoogleAuthorizeUrl,
  createOAuthState,
  googleOAuthConfigured,
  setOAuthStateCookie,
} from "@/lib/google-oauth";
import { rememberAfterAuth, safeNextPath } from "@/lib/redirects";

export async function GET(request: NextRequest) {
  const next = safeNextPath(request.nextUrl.searchParams.get("next"));
  const loginUrl = new URL("/ingresar", request.url);
  if (next) loginUrl.searchParams.set("next", next);

  if (!googleOAuthConfigured()) {
    loginUrl.searchParams.set("error", "Google no está configurado.");
    return NextResponse.redirect(loginUrl);
  }

  try {
    await rememberAfterAuth(next);
    const state = createOAuthState();
    await setOAuthStateCookie(state);
    return NextResponse.redirect(buildGoogleAuthorizeUrl(state));
  } catch (error) {
    const message =
      error instanceof Error && error.message
        ? error.message
        : "No se pudo iniciar Google.";
    loginUrl.searchParams.set("error", message);
    return NextResponse.redirect(loginUrl);
  }
}
