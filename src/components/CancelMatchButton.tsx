"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Ban } from "lucide-react";
import { cancelMatch } from "@/lib/actions";

export function CancelMatchButton({
  groupId,
  matchId,
}: {
  groupId: string;
  matchId: string;
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
        style={{ marginTop: "0.75rem" }}
        onClick={() => setOpen(true)}
      >
        <Ban size={16} aria-hidden="true" />
        Cancelar partido
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
          <h3 id={titleId}>¿Cancelar este partido?</h3>
          <p id={descId} className="meta" style={{ margin: 0 }}>
            Se marca como cancelado. No se puede deshacer desde acá.
          </p>
          <div className="form-actions" style={{ marginTop: "1rem" }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setOpen(false)}
            >
              Volver
            </button>
            <form action={cancelMatch}>
              <input type="hidden" name="group_id" value={groupId} />
              <input type="hidden" name="match_id" value={matchId} />
              <button type="submit" className="btn btn-danger">
                <Ban size={16} aria-hidden="true" />
                Sí, cancelar
              </button>
            </form>
          </div>
        </div>
      </dialog>
    </>
  );
}
