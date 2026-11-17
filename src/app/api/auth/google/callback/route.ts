import { NextRequest, NextResponse } from "next/server";
import { loginOrRegisterWithGoogle } from "@/lib/auth";
import {
  consumeOAuthStateCookie,
  exchangeGoogleCode,
} from "@/lib/google-oauth";
import { consumeAfterAuthPath } from "@/lib/redirects";
import { createSession } from "@/lib/session";

function loginErrorRedirect(request: NextRequest, message: string) {
  const url = new URL("/ingresar", request.url);
  url.searchParams.set("error", message);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code")?.trim() || "";
  const state = request.nextUrl.searchParams.get("state")?.trim() || "";
  const oauthError = request.nextUrl.searchParams.get("error");

  if (oauthError) {
    return loginErrorRedirect(
      request,
      oauthError === "access_denied"
        ? "Cancelaste el acceso con Google."
        : "No se pudo completar el login con Google.",
    );
  }

  if (!code || !state) {
    return loginErrorRedirect(request, "Respuesta de Google inválida.");
  }

  const stateOk = await consumeOAuthStateCookie(state);
  if (!stateOk) {
    return loginErrorRedirect(
      request,
      "La sesión de Google expiró. Probá de nuevo.",
    );
  }

  try {
    const profile = await exchangeGoogleCode(code);
    const user = await loginOrRegisterWithGoogle(profile);
    await createSession(user.id);
    const next = await consumeAfterAuthPath();
    const dest = new URL(next || "/grupos", request.url);
    return NextResponse.redirect(dest);
  } catch (error) {
    const message =
      error instanceof Error && error.message
        ? error.message
        : "No se pudo completar el login con Google.";
    return loginErrorRedirect(request, message);
  }
}
