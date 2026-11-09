import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { unauthorizedCronResponse } from "@/lib/ops/cron-auth";
import { limpiarSubidasAbandonadas } from "@/lib/ops/limpiar-subidas";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Diario: borra subidas privadas que nadie terminó (más de 48 h y sin envío que las use). ?simulacion=1 solo informa. */
export async function GET(req: Request) {
  const denied = unauthorizedCronResponse(req);
  if (denied) return denied;
  try {
    const simulacion = new URL(req.url).searchParams.get("simulacion") === "1";
    const res = await limpiarSubidasAbandonadas(getAdminDb(), simulacion);
    console.info("[cron/limpiar-subidas]", { ...res, borrados: res.borrados.length });
    return NextResponse.json({ ok: true, ...res, borrados: res.borrados.length });
  } catch (e) {
    console.error("[cron/limpiar-subidas]", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
