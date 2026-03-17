import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

const ALLOWED = ["earth-day.jpg", "earth-night.jpg", "earth-clouds.png"] as const;

/**
 * GET /api/globe-texture?name=earth-day.jpg
 * Sirve texturas del globo desde public/textures para evitar que /textures/* quede pending en dev.
 */
export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get("name");
  if (!name || !ALLOWED.includes(name as (typeof ALLOWED)[number])) {
    return NextResponse.json({ error: "name required (earth-day.jpg | earth-night.jpg | earth-clouds.png)" }, { status: 400 });
  }
  try {
    const path = join(process.cwd(), "public", "textures", name);
    const buf = await readFile(path);
    const contentType =
      name.endsWith(".png") ? "image/png" : name.endsWith(".jpg") || name.endsWith(".jpeg") ? "image/jpeg" : "application/octet-stream";
    return new NextResponse(buf, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (e) {
    console.error("globe-texture:", e);
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
