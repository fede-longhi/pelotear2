"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import { deleteGroup } from "@/lib/actions";

export function DeleteGroupButton({
  groupId,
  groupName,
}: {
  groupId: string;
  groupName: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      if (!dialog.open) dialog.showModal();
    } else if (dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="btn btn-danger"
        onClick={() => setOpen(true)}
      >
        <Trash2 size={16} aria-hidden="true" />
        Eliminar grupo
      </button>

      <dialog
        ref={dialogRef}
        className="confirm-dialog"
        aria-labelledby={titleId}
        aria-describedby={descId}
        onClose={() => setOpen(false)}
        onCancel={(e) => {
          e.preventDefault();
          setOpen(false);
        }}
        onClick={(e) => {
          if (e.target === dialogRef.current) setOpen(false);
        }}
      >
        <div className="confirm-dialog-panel">
          <h3 id={titleId}>¿Eliminar “{groupName}”?</h3>
          <p id={descId} className="meta" style={{ margin: 0 }}>
            El grupo y sus partidos dejan de verse (soft delete). No se puede
            deshacer desde la app.
          </p>
          <div className="form-actions" style={{ marginTop: "1rem" }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setOpen(false)}
            >
              Volver
            </button>
            <form action={deleteGroup}>
              <input type="hidden" name="group_id" value={groupId} />
              <button type="submit" className="btn btn-danger">
                <Trash2 size={16} aria-hidden="true" />
                Sí, eliminar
              </button>
            </form>
          </div>
        </div>
      </dialog>
    </>
  );
}
