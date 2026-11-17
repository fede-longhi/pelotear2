"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { put } from "@vercel/blob";
import {
  findUserIdByEmail,
  loginUser,
  registerUser,
  requireUser,
  setDemoUser,
  setUserPassword,
  updatePhotoUrl,
  updateProfile,
} from "./auth";
import {
  consumePasswordResetToken,
  createEmailVerificationToken,
  createPasswordResetToken,
  emailConfigured,
  sendPasswordResetEmail,
  sendVerificationEmail,
  verifyEmailToken,
} from "./email";
import { rememberAfterAuth } from "./redirects";
import { createSession, destroySession, demoModeEnabled } from "./session";
import { sql } from "./db";

const DEV_VERIFY_COOKIE = "pelotear_dev_verify_url";
const DEV_RESET_COOKIE = "pelotear_dev_reset_url";

function errMsg(error: unknown, fallback: string) {
  return error instanceof Error && error.message
    ? error.message
    : fallback;
}

async function issueAndSendVerification(user: {
  id: string;
  email: string;
  name: string;
}) {
  const { url } = await createEmailVerificationToken(user.id);
  const sent = await sendVerificationEmail({
    to: user.email,
    name: user.name,
    url,
  });
  const jar = await cookies();
  if (!sent.ok) {
    jar.set(DEV_VERIFY_COOKIE, url, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });
    if (emailConfigured()) throw new Error(sent.error);
    return { url, sent };
  }
  if (sent.mode === "dev" || !emailConfigured()) {
    jar.set(DEV_VERIFY_COOKIE, url, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });
  } else {
    jar.delete(DEV_VERIFY_COOKIE);
  }
  return { url, sent };
}

export async function signupAction(formData: FormData) {
  const next = await rememberAfterAuth(formData.get("next"));
  try {
    const user = await registerUser({
      email: String(formData.get("email") || ""),
      password: String(formData.get("password") || ""),
      first_name: String(formData.get("first_name") || ""),
      last_name: String(formData.get("last_name") || ""),
      nickname: String(formData.get("nickname") || ""),
    });
    await createSession(user.id);
    await issueAndSendVerification(user);
  } catch (error) {
    const q = new URLSearchParams();
    q.set("error", errMsg(error, "No se pudo registrar."));
    if (next) q.set("next", next);
    redirect(`/registro?${q.toString()}`);
  }
  redirect(next ? `/verificar-email?nuevo=1&next=${encodeURIComponent(next)}` : "/verificar-email?nuevo=1");
}

export async function loginAction(formData: FormData) {
  const next = await rememberAfterAuth(formData.get("next"));
  let verified = true;
  try {
    const user = await loginUser(
      String(formData.get("email") || ""),
      String(formData.get("password") || ""),
    );
    await createSession(user.id);
    verified = user.email_verified;
  } catch (error) {
    const q = new URLSearchParams();
    q.set("error", errMsg(error, "No se pudo ingresar."));
    if (next) q.set("next", next);
    redirect(`/ingresar?${q.toString()}`);
  }
  if (!verified) {
    redirect(
      next
        ? `/verificar-email?next=${encodeURIComponent(next)}`
        : "/verificar-email",
    );
  }
  redirect(next || "/grupos");
}

export async function logoutAction() {
  await destroySession();
  revalidatePath("/");
  redirect("/");
}

export async function switchDemoPersona(formData: FormData) {
  if (!demoModeEnabled()) return;
  await setDemoUser(String(formData.get("personaId") || ""));
  revalidatePath("/");
  revalidatePath("/grupos");
}

export async function resendVerificationAction() {
  const user = await requireUser();
  if (user.simulated) redirect("/grupos");
  if (user.email_verified) redirect("/grupos");
  try {
    await issueAndSendVerification(user);
  } catch (error) {
    redirect(
      `/verificar-email?error=${encodeURIComponent(errMsg(error, "No se pudo reenviar."))}`,
    );
  }
  redirect("/verificar-email?reenviado=1");
}

export async function confirmEmailAction(token: string) {
  const result = await verifyEmailToken(token);
  if (!result.ok) {
    redirect(
      `/verificar-email?error=${encodeURIComponent(result.error || "Link inválido.")}`,
    );
  }
  const jar = await cookies();
  jar.delete(DEV_VERIFY_COOKIE);
  redirect("/perfil?verificado=1");
}

async function uploadPhotoFile(userId: string, file: File): Promise<string> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error(
      "Falta BLOB_READ_WRITE_TOKEN para subir fotos. Configuralo en Vercel Blob.",
    );
  }
  if (file.size > 4 * 1024 * 1024) {
    throw new Error("La foto no puede superar 4 MB.");
  }
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const safeExt = ["jpg", "jpeg", "png", "webp", "gif"].includes(ext)
    ? ext
    : "jpg";
  const blob = await put(
    `avatars/${userId}-${Date.now()}.${safeExt}`,
    file,
    {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    },
  );
  return blob.url;
}

export async function updateProfileAction(formData: FormData) {
  const user = await requireUser();
  if (user.simulated) {
    redirect(
      `/perfil?error=${encodeURIComponent("En modo demo no se edita el perfil. Creá una cuenta real.")}`,
    );
  }

  let photo_url: string | undefined;
  try {
    const file = formData.get("photo");
    if (file instanceof File && file.size > 0) {
      photo_url = await uploadPhotoFile(user.id, file);
    }

    await updateProfile(user.id, {
      first_name: String(formData.get("first_name") || ""),
      last_name: String(formData.get("last_name") || ""),
      nickname: String(formData.get("nickname") || ""),
      phone: String(formData.get("phone") || ""),
      birth_date: String(formData.get("birth_date") || ""),
      photo_url,
    });
  } catch (error) {
    redirect(
      `/perfil?error=${encodeURIComponent(errMsg(error, "No se pudo guardar."))}`,
    );
  }

  revalidatePath("/perfil");
  revalidatePath("/");
  redirect("/perfil?ok=1");
}

export async function uploadAvatarAction(formData: FormData) {
  const user = await requireUser();
  if (user.simulated) {
    redirect(
      `/perfil?error=${encodeURIComponent("En modo demo no se sube foto. Creá una cuenta real.")}`,
    );
  }
  try {
    const file = formData.get("photo");
    if (!(file instanceof File) || file.size <= 0) {
      throw new Error("Elegí una imagen.");
    }
    const photo_url = await uploadPhotoFile(user.id, file);
    await updatePhotoUrl(user.id, photo_url);
  } catch (error) {
    redirect(
      `/perfil?error=${encodeURIComponent(errMsg(error, "No se pudo subir la foto."))}`,
    );
  }
  revalidatePath("/perfil");
  revalidatePath("/");
  redirect("/perfil?ok=1");
}

export async function getDevVerifyUrl(): Promise<string | null> {
  const jar = await cookies();
  const url = jar.get(DEV_VERIFY_COOKIE)?.value ?? null;
  if (!url) return null;
  // Expose on-page only when Resend is not configured (workable fallback).
  if (!emailConfigured()) return url;
  return null;
}

export async function requestPasswordResetAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const userId = await findUserIdByEmail(email);

  // Always redirect to the same success page to avoid account enumeration.
  if (userId) {
    try {
      const rows = await sql<{ name: string; email: string }>(
        `select coalesce(nullif(trim(nickname), ''), nullif(trim(name), ''), email) as name, email
         from users where id = $1`,
        [userId],
      );
      const user = rows[0];
      if (user) {
        const { url } = await createPasswordResetToken(userId);
        const sent = await sendPasswordResetEmail({
          to: user.email,
          name: user.name,
          url,
        });
        const jar = await cookies();
        if (!sent.ok) {
          if (emailConfigured()) {
            redirect(
              `/recuperar?error=${encodeURIComponent(sent.error || "No se pudo enviar el email.")}`,
            );
          }
          jar.set(DEV_RESET_COOKIE, url, {
            httpOnly: true,
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60,
          });
        } else if (sent.mode === "dev" || !emailConfigured()) {
          jar.set(DEV_RESET_COOKIE, url, {
            httpOnly: true,
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60,
          });
        } else {
          jar.delete(DEV_RESET_COOKIE);
        }
      }
    } catch (error) {
      redirect(
        `/recuperar?error=${encodeURIComponent(errMsg(error, "No se pudo enviar el email."))}`,
      );
    }
  }
  redirect("/recuperar?enviado=1");
}

export async function resetPasswordAction(formData: FormData) {
  const token = String(formData.get("token") || "").trim();
  const password = String(formData.get("password") || "");
  const confirm = String(formData.get("password_confirm") || "");
  if (password !== confirm) {
    redirect(
      `/recuperar/${token}?error=${encodeURIComponent("Las contraseñas no coinciden.")}`,
    );
  }

  const consumed = await consumePasswordResetToken(token);
  if (!consumed.ok || !consumed.userId) {
    redirect(
      `/recuperar?error=${encodeURIComponent(consumed.error || "Link inválido.")}`,
    );
  }

  try {
    await setUserPassword(consumed.userId, password);
    await createSession(consumed.userId);
  } catch (error) {
    redirect(
      `/recuperar/${token}?error=${encodeURIComponent(errMsg(error, "No se pudo guardar."))}`,
    );
  }
  redirect("/grupos");
}

export async function setPasswordAction(formData: FormData) {
  const user = await requireUser();
  if (user.simulated) {
    redirect(
      `/perfil?error=${encodeURIComponent("En modo demo no se cambia la contraseña.")}`,
    );
  }
  const password = String(formData.get("password") || "");
  const confirm = String(formData.get("password_confirm") || "");
  if (password !== confirm) {
    redirect(
      `/perfil?error=${encodeURIComponent("Las contraseñas no coinciden.")}`,
    );
  }
  try {
    await setUserPassword(user.id, password);
  } catch (error) {
    redirect(
      `/perfil?error=${encodeURIComponent(errMsg(error, "No se pudo guardar."))}`,
    );
  }
  revalidatePath("/perfil");
  redirect("/perfil?ok=1");
}

export async function getDevResetUrl(): Promise<string | null> {
  const jar = await cookies();
  const url = jar.get(DEV_RESET_COOKIE)?.value ?? null;
  if (!url) return null;
  if (!emailConfigured()) return url;
  return null;
}
