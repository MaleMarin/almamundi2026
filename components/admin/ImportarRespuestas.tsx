"use client";

import { useState, type ChangeEvent } from "react";
import { SITE_FONT_STACK } from "@/lib/typography";
import { EDITORIAL_IMPORT_UI } from "@/lib/i18n/editorial-import";

type ImportItem = {
  id: string;
  questionId: string;
  alias: string;
  city: string;
  country: string;
  contenido: string;
  locale: string;
  temas: string[];
};
type ImportFile = { version: number; tipo: string; items: ImportItem[] };

export default function ImportarRespuestas({ token, onImported }: { token: string; onImported: () => void }) {
  const t = EDITORIAL_IMPORT_UI.es;
  const [payload, setPayload] = useState<ImportFile | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  async function openFile(event: ChangeEvent<HTMLInputElement>) {
    setPayload(null);
    setError("");
    setNotice("");
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 512_000) {
      setError(t.fileTooLarge);
      return;
    }
    try {
      const data = JSON.parse(await file.text()) as ImportFile;
      if (data?.version !== 1 || data.tipo !== "respuestas_editoriales" || !Array.isArray(data.items) || data.items.length < 1 || data.items.length > 100) {
        throw new Error(t.invalidFile);
      }
      setPayload(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : t.unreadable);
    }
  }

  async function importar() {
    if (!payload || busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/admin/respuestas/importar", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json() as { error?: string; imported?: number; skippedExisting?: number };
      if (!response.ok) throw new Error(result.error ?? t.failed);
      setNotice(`${t.imported} ${result.imported ?? 0} ${t.pending} ${t.existing} ${result.skippedExisting ?? 0}.`);
      onImported();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo importar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <details style={{ fontFamily: SITE_FONT_STACK, border: "1px solid rgba(255,255,255,.18)", borderRadius: 16, padding: 16, marginBottom: 20, background: "rgba(255,255,255,.04)" }}>
      <summary style={{ cursor: "pointer", fontWeight: 600, color: "#fff" }}>{t.title}</summary>
      <p style={{ fontSize: 13, color: "rgba(255,255,255,.8)", lineHeight: 1.5 }}>
        {t.intro}
      </p>
      <input type="file" accept=".json,application/json" onChange={(event) => void openFile(event)}
        aria-label={t.fileLabel} style={{ display: "block", maxWidth: "100%", margin: "12px 0", color: "#fff" }} />
      {payload ? (
        <>
          <p style={{ fontSize: 14, marginBottom: 8 }}>{payload.items.length} {t.ready}</p>
          <ul style={{ paddingLeft: 20, fontSize: 13, color: "rgba(255,255,255,.78)", lineHeight: 1.5 }}>
            {payload.items.slice(0, 5).map((item) => (
              <li key={item.id}>{item.alias} · {item.city}, {item.country} · {item.questionId}</li>
            ))}
          </ul>
          <button type="button" onClick={() => void importar()} disabled={busy}
            style={{ borderRadius: 999, padding: "10px 16px", background: "#FF4A1C", border: 0, color: "#fff", fontWeight: 600, cursor: busy ? "wait" : "pointer" }}>
            {busy ? t.importing : `${t.importButton} (${payload.items.length})`}
          </button>
        </>
      ) : null}
      {error ? <p role="alert" style={{ color: "#fca5a5" }}>{error}</p> : null}
      {notice ? <p role="status" style={{ color: "#86efac" }}>{notice}</p> : null}
    </details>
  );
}
