"use client";

import { useState } from "react";
import { Pencil, X } from "lucide-react";
import { updateTeamNames } from "@/lib/actions";

export function TeamNameEditor({
  groupId,
  matchId,
  side,
  name,
  otherName,
  editable,
}: {
  groupId: string;
  matchId: string;
  side: "A" | "B";
  name: string;
  otherName: string;
  editable: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const inputId = `team_${side.toLowerCase()}_name`;

  if (!editable) {
    return <h3 className="team-col-title">{name}</h3>;
  }

  if (!editing) {
    return (
      <div className="team-col-heading">
        <h3 className="team-col-title">{name}</h3>
        <button
          type="button"
          className="team-name-edit-btn"
          aria-label={`Editar nombre de ${name}`}
          onClick={() => setEditing(true)}
        >
          <Pencil size={14} aria-hidden="true" />
        </button>
      </div>
    );
  }

  return (
    <form action={updateTeamNames} className="team-name-inline">
      <input type="hidden" name="group_id" value={groupId} />
      <input type="hidden" name="match_id" value={matchId} />
      {side === "A" ? (
        <>
          <input
            id={inputId}
            name="team_a_name"
            defaultValue={name}
            maxLength={40}
            required
            className="team-name-inline-input"
            aria-label="Nombre equipo A"
            autoFocus
          />
          <input type="hidden" name="team_b_name" value={otherName} />
        </>
      ) : (
        <>
          <input type="hidden" name="team_a_name" value={otherName} />
          <input
            id={inputId}
            name="team_b_name"
            defaultValue={name}
            maxLength={40}
            required
            className="team-name-inline-input"
            aria-label="Nombre equipo B"
            autoFocus
          />
        </>
      )}
      <button type="submit" className="btn btn-small btn-primary">
        Guardar
      </button>
      <button
        type="button"
        className="team-name-edit-btn"
        aria-label="Cancelar"
        onClick={() => setEditing(false)}
      >
        <X size={14} aria-hidden="true" />
      </button>
    </form>
  );
}
