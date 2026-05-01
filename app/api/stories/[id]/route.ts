/**
 * GET /api/stories/[id]
 * Retorna una historia por id (para /historias/[id] y detalle).
 * Con `Authorization: Bearer` de admin opcional permite ver borradores / no públicos.
 */
import { type NextRequest, NextResponse } from "next/server";
import { getStoryByIdAsync } from "@/lib/map-data/stories-server";
import { getAdminSessionIfPresent } from "@/lib/adminAuth";

export const revalidate = 60;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const admin = await getAdminSessionIfPresent(req);
  const story = await getStoryByIdAsync(id, {
    privilegedReader: Boolean(admin),
    allowPublicDemos: true,
  });
  if (!story) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(
    { story },
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    }
  );
}
