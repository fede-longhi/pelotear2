"use client";

import { useRef, useTransition } from "react";
import { Camera } from "lucide-react";
import { uploadAvatarAction } from "@/lib/auth-actions";
import { cn } from "@/lib/utils";

type Props = {
  name: string;
  photoUrl: string;
  editable: boolean;
};

export function AvatarPhotoUpload({ name, photoUrl, editable }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();

  const initial = name.slice(0, 1).toUpperCase() || "?";

  if (!editable) {
    return photoUrl ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={photoUrl} alt="" className="avatar-lg" />
    ) : (
      <div className="avatar-lg avatar-placeholder">{initial}</div>
    );
  }

  return (
    <form ref={formRef} action={uploadAvatarAction} className="avatar-upload">
      <button
        type="button"
        className={cn("avatar-hit", pending && "is-pending")}
        onClick={() => inputRef.current?.click()}
        aria-label="Cambiar foto de perfil"
        disabled={pending}
      >
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt="" className="avatar-lg" />
        ) : (
          <div className="avatar-lg avatar-placeholder">{initial}</div>
        )}
        <span className="avatar-overlay">
          <Camera size={18} aria-hidden />
          <span>{pending ? "Subiendo…" : "Cambiar"}</span>
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        name="photo"
        accept="image/*"
        className="sr-only"
        onChange={() => {
          if (!inputRef.current?.files?.length) return;
          startTransition(() => {
            formRef.current?.requestSubmit();
          });
        }}
      />
    </form>
  );
}
