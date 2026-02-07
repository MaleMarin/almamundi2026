import { NextRequest } from "next/server";
import { getWorldCollection } from "@/lib/world/db";
import { queryWorld } from "@/lib/world/query";
import { isMode } from "@/lib/world/types";

export async function GET(request: NextRequest) {
  const modeParam = request.nextUrl.searchParams.get("mode") ?? "today";
  if (!isMode(modeParam)) {
    return Response.json({ error: "Invalid mode. Use 'now' or 'today'." }, { status: 400 });
  }
  const mode = modeParam;
  const limit = mode === "now" ? 20 : 40;

  const col = getWorldCollection();
  if (!col) {
    return Response.json(
      { error: "Firestore not configured. Set FIREBASE_PROJECT_ID or GOOGLE_APPLICATION_CREDENTIALS." },
      { status: 503 }
    );
  }

  try {
    const items = await queryWorld(col, { mode, limit });
    return Response.json({
      mode,
      updatedAt: new Date().toISOString(),
      items,
    });
  } catch (e) {
    console.error("[api/world] GET error:", e);
    return Response.json({ error: "Failed to fetch world items." }, { status: 500 });
  }
}
