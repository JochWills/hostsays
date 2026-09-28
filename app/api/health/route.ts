// Render health check. Deliberately doesn't touch the database, so a Supabase blip
// doesn't make Render restart a healthy web server.
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ ok: true });
}
