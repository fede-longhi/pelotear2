"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { put } from "@vercel/blob";
import {
  loginUser,
  registerUser,
  requireUser,
  setDemoUser,
  updateProfile,
} from "./auth";
import { createSession, destroySession, demoModeEnabled } from "./session";

function errMsg(error: unknown, fallback: string) {
  return error instanceof Error && error.message
    ? error.message
    : fallback;
}

export async function signupAction(formData: FormData) {
  try {
    const user = await registerUser({
      email: String(formData.get("email") || ""),
      password: String(formData.get("password") || ""),
      first_name: String(formData.get("first_name") || ""),
      last_name: String(formData.get("last_name") || ""),
      nickname: String(formData.get("nickname") || ""),
    });
    await createSession(user.id);
  } catch (error) {
    redirect(
      `/registro?error=${encodeURIComponent(errMsg(error, "No se pudo registrar."))}`,
    );
  }
  redirect("/perfil?nuevo=1");
}

export async function loginAction(formData: FormData) {
  try {
    const user = await loginUser(
      String(formData.get("email") || ""),
      String(formData.get("password") || ""),
    );
    await createSession(user.id);
  } catch (error) {
    redirect(
      `/ingresar?error=${encodeURIComponent(errMsg(error, "No se pudo ingresar."))}`,
    );
  }
  redirect("/grupos");
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
        `avatars/${user.id}-${Date.now()}.${safeExt}`,
        file,
        {
          access: "public",
          token: process.env.BLOB_READ_WRITE_TOKEN,
        },
      );
      photo_url = blob.url;
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
