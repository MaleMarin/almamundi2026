import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { fileURLToPath } from "node:url";

const TEXTURE_FILES = {
  "earth-day.jpg": fileURLToPath(new URL("../../../public/textures/earth-day.jpg", import.meta.url)),
  "earth-night.jpg": fileURLToPath(new URL("../../../public/textures/earth-night.jpg", import.meta.url)),
  "earth-clouds.png": fileURLToPath(new URL("../../../public/textures/earth-clouds.png", import.meta.url)),
} as const;

/**
 * GET /api/globe-texture?name=earth-day.jpg
 * Sirve texturas del globo desde public/textures para evitar que /textures/* quede pending en dev.
 */
export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get("name");
  if (!name || !(name in TEXTURE_FILES)) {
    return NextResponse.json({ error: "name required (earth-day.jpg | earth-night.jpg | earth-clouds.png)" }, { status: 400 });
  }
  try {
    const buf = await readFile(TEXTURE_FILES[name as keyof typeof TEXTURE_FILES]);
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
