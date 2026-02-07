import { NextRequest } from "next/server";
import { getWorldCollection } from "@/lib/world/db";
import { queryWorld } from "@/lib/world/query";
import { isField, isMode } from "@/lib/world/types";

type Params = { params: Promise<{ field: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const { field: fieldSlug } = await params;
  if (!fieldSlug || !isField(fieldSlug)) {
    return Response.json(
      {
        error:
          "Invalid field. Use one of: condicion-humana, conflicto-geopolitica, economia-finanzas, tecnologia-vida, creacion, memoria-testimonio, naturaleza-territorio, comunidad-transformacion, buenas-noticias",
      },
      { status: 400 }
    );
  }

  const modeParam = request.nextUrl.searchParams.get("mode") ?? "today";
  if (!isMode(modeParam)) {
    return Response.json({ error: "Invalid mode. Use 'now' or 'today'." }, { status: 400 });
  }
  const mode = modeParam;
  const limit = mode === "now" ? 8 : 15;

  const col = getWorldCollection();
  if (!col) {
    return Response.json(
      { error: "Firestore not configured. Set FIREBASE_PROJECT_ID or GOOGLE_APPLICATION_CREDENTIALS." },
      { status: 503 }
    );
  }

  try {
    const items = await queryWorld(col, { mode, limit, field: fieldSlug });
    return Response.json({
      mode,
      field: fieldSlug,
      updatedAt: new Date().toISOString(),
      items,
    });
  } catch (e) {
    console.error("[api/world/field] GET error:", e);
    return Response.json({ error: "Failed to fetch world items for field." }, { status: 500 });
  }
}
