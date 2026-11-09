import { sql } from "@/lib/db";

export async function GET() {
  try {
    await sql("select 1 as ok");
    return Response.json({
      ok: true,
      database: process.env.DATABASE_URL?.trim() ? "postgres" : "pglite",
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "db_error",
      },
      { status: 500 },
    );
  }
}
