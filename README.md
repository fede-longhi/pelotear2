# Pelotear2

App web (español) para organizar partidos de fútbol entre amigos: grupos, invitaciones, equipos, resultados y estadísticas W/L/D.

## Stack

- Next.js App Router + TypeScript + Tailwind
- Postgres cuando `DATABASE_URL` está definida
- [PGlite](https://pglite.dev/) en memoria si no hay `DATABASE_URL` (ideal para `npm run dev` local)

## Cómo correr

```bash
cd pelotear2
npm install
npm run dev
```

Abrí [http://127.0.0.1:3000](http://127.0.0.1:3000).

En local, sin Postgres, la app usa PGlite automáticamente. En el header podés cambiar de persona demo (Fede / Juan / María / Lucía) para probar invitaciones y varios jugadores.

### Con Postgres real

```bash
export DATABASE_URL="postgres://user:pass@host:5432/pelotear"
npm run migrate
npm run dev
```

No commitees `.env` con secretos. En esta VM de cloud agent, si no hay `DATABASE_URL`, corré sin ella (PGlite).

## Qué funciona (v1)

1. Crear / unirse a grupos (código o link `/unirse/CODIGO`)
2. Crear partidos (fecha, hora, ubicación)
3. Confirmar asistencia
4. Armar equipos manualmente o con **Generar equipos** (balanceo con W/L/D)
5. Cargar resultado (goles A / goles B)
6. Ver stats del grupo (PJ / G / E / P) y goles por equipo en el historial

## Publish (Cursor)

`cursor-app.json` declara Postgres. Al publicar con Cursor Apps, la plataforma provee `DATABASE_URL`. Identity vía `cursor/identity.ts` (private/team).
