import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { getThemeLabel } from "@/lib/themes";
import type { MuestraApprovedItem, MuestrasByTopic } from "@/lib/muestras-api";

export const runtime = "nodejs";

/** GET /api/muestras — solo submissions con status === "approved", agrupadas por topic. */
export async function GET() {
  try {
    const db = getAdminDb();
    const snap = await db
      .collection("submissions")
      .where("status", "==", "approved")
      .orderBy("createdAt", "desc")
      .get();

    const byTopic = new Map<string, MuestraApprovedItem[]>();

    snap.docs.forEach((doc) => {
      const d = doc.data();
      const id = doc.id;
      const topic = String(d.topic ?? "");
      const publicUrl = String(d.publicUrl ?? "");
      const alias = String(d.alias ?? "");
      if (!topic || !publicUrl) return;

      const item: MuestraApprovedItem = {
        id,
        topic,
        topicLabel: getThemeLabel(topic),
        publicUrl,
        alias,
        createdAt: String(d.createdAt ?? ""),
      };
      if (d.dateTaken) item.dateTaken = String(d.dateTaken);
      if (d.context) item.context = String(d.context).slice(0, 200);

      const list = byTopic.get(topic) ?? [];
      list.push(item);
      byTopic.set(topic, list);
    });

    const topics: MuestrasByTopic[] = [];
    byTopic.forEach((items, topic) => {
      topics.push({
        topic,
        topicLabel: getThemeLabel(topic),
        items,
      });
    });

    // Ordenar temas por orden en THEME_LIST (los que no estén al final)
    const themeOrder = [
      "vida",
      "migracion",
      "trabajo",
      "amor",
      "duelo",
      "cuidado",
      "identidad",
      "salud",
      "naturaleza",
      "ciudad",
      "conflictos",
      "politica",
    ];
    topics.sort((a, b) => {
      const i = themeOrder.indexOf(a.topic);
      const j = themeOrder.indexOf(b.topic);
      if (i === -1 && j === -1) return a.topicLabel.localeCompare(b.topicLabel);
      if (i === -1) return 1;
      if (j === -1) return -1;
      return i - j;
    });

    return NextResponse.json({ topics });
  } catch (e) {
    console.error("muestras GET", e);
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: "server_error", detail: message },
      { status: 500 }
    );
  }
}
