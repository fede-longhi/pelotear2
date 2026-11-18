"use client";

import { useState } from "react";
import { CalendarClock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TimePicker } from "@/components/ui/time-picker";
import { updateMatchSchedule } from "@/lib/actions";

export function RescheduleMatchPanel({
  groupId,
  matchId,
  playedOn,
  kickoffTime,
  location,
}: {
  groupId: string;
  matchId: string;
  playedOn: string;
  kickoffTime: string;
  location: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="reschedule-wrap">
      {!open ? (
        <button
          type="button"
          className="btn btn-small btn-secondary"
          onClick={() => setOpen(true)}
        >
          <CalendarClock size={14} aria-hidden="true" />
          Reprogramar
        </button>
      ) : (
        <div className="panel form-grid reschedule-panel">
          <div className="reschedule-panel-head">
            <strong>Reprogramar partido</strong>
            <button
              type="button"
              className="team-name-edit-btn"
              aria-label="Cerrar"
              onClick={() => setOpen(false)}
            >
              <X size={14} aria-hidden="true" />
            </button>
          </div>
          <form action={updateMatchSchedule} className="form-grid">
            <input type="hidden" name="group_id" value={groupId} />
            <input type="hidden" name="match_id" value={matchId} />
            <Field>
              <Label htmlFor="played_on">Fecha</Label>
              <DatePicker
                id="played_on"
                name="played_on"
                required
                defaultValue={playedOn}
              />
            </Field>
            <Field>
              <Label htmlFor="kickoff_time">Hora</Label>
              <TimePicker
                id="kickoff_time"
                name="kickoff_time"
                required
                defaultValue={kickoffTime}
              />
            </Field>
            <Field>
              <Label htmlFor="location">Ubicación</Label>
              <Input
                id="location"
                name="location"
                required
                maxLength={120}
                defaultValue={location}
              />
            </Field>
            <div className="form-actions">
              <Button type="submit" variant="secondary" size="sm">
                Guardar cambios
              </Button>
              <button
                type="button"
                className="btn btn-small btn-secondary"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
