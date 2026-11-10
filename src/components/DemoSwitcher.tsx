import { DEMO_PERSONAS, type AppUser } from "@/lib/auth";
import { switchDemoPersona } from "@/lib/auth-actions";
import { demoModeEnabled } from "@/lib/session";

export function DemoSwitcher({ user }: { user: AppUser }) {
  if (!demoModeEnabled() || !user.simulated) return null;

  return (
    <form action={switchDemoPersona} className="demo-switcher">
      <label htmlFor="demo-user">Modo local — jugás como</label>
      <select id="demo-user" name="personaId" defaultValue={user.id}>
        {DEMO_PERSONAS.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      <button type="submit">Cambiar</button>
    </form>
  );
}
