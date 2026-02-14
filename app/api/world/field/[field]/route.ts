import { NextRequest } from "next/server";
import { getWorldCollection } from "@/lib/world/db";
import { queryWorld } from "@/lib/world/query";
import { isField, isMode } from "@/lib/world/types";
import { mockWorldNow } from "@/lib/world/mockWorldNow";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: { field: string } };

export async function GET(request: NextRequest, { params }: Params) {
  const fieldSlug = params?.field;

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
    return Response.json(
      { error: "Invalid mode. Use 'now' or 'today'." },
      { status: 400 }
    );
  }

  const mode = modeParam;
  const limit = mode === "now" ? 8 : 15;

  const col = getWorldCollection();

  if (!col) {
    const mock = mockWorldNow(fieldSlug, mode);
    return Response.json({
      mode,
      field: fieldSlug,
      updatedAt: mock.updatedAt,
      items: mock.items,
      source: "mock",
      warning: "Firestore not configured. Returned mock data.",
    });
  }

  try {
    const items = await queryWorld(col, { mode, limit, field: fieldSlug });
    return Response.json({
      mode,
      field: fieldSlug,
      updatedAt: new Date().toISOString(),
      items,
      source: "firestore",
    });
  } catch (e) {
    console.error("[api/world/field] GET error:", e);
    const mock = mockWorldNow(fieldSlug, mode);
    return Response.json({
      mode,
      field: fieldSlug,
      updatedAt: mock.updatedAt,
      items: mock.items,
      source: "mock",
      warning: "Firestore query failed. Returned mock data.",
    });
  }
}
