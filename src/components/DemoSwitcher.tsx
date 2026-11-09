import { DEMO_PERSONAS, type AppUser } from "@/lib/auth";
import { switchDemoPersona } from "@/lib/actions";

export function DemoSwitcher({ user }: { user: AppUser }) {
  if (!user.simulated) return null;

  return (
    <form
      action={async (fd) => {
        "use server";
        await switchDemoPersona(String(fd.get("personaId") || ""));
      }}
      className="demo-switcher"
    >
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
