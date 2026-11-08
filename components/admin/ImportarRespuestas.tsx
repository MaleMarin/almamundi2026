"use client";

import { useState, type ChangeEvent } from "react";
import { SITE_FONT_STACK } from "@/lib/typography";

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
      setError("Archivo demasiado grande.");
      return;
    }
    try {
      const data = JSON.parse(await file.text()) as ImportFile;
      if (data?.version !== 1 || data.tipo !== "respuestas_editoriales" || !Array.isArray(data.items) || data.items.length < 1 || data.items.length > 100) {
        throw new Error("El formato JSON no corresponde a las respuestas de AlmaMundi.");
      }
      setPayload(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo leer el archivo.");
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
      if (!response.ok) throw new Error(result.error ?? "No se pudo importar.");
      setNotice(`Se agregaron ${result.imported ?? 0} respuestas pendientes. Ya existían ${result.skippedExisting ?? 0}.`);
      onImported();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo importar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <details style={{ fontFamily: SITE_FONT_STACK, border: "1px solid rgba(255,255,255,.18)", borderRadius: 16, padding: 16, marginBottom: 20, background: "rgba(255,255,255,.04)" }}>
      <summary style={{ cursor: "pointer", fontWeight: 600, color: "#fff" }}>Importar respuestas desde JSON</summary>
      <p style={{ fontSize: 13, color: "rgba(255,255,255,.8)", lineHeight: 1.5 }}>
        Importa respuestas editoriales como pendientes. Nada se publica automáticamente. Se conservan los registros existentes.
      </p>
      <input type="file" accept=".json,application/json" onChange={(event) => void openFile(event)}
        aria-label="Archivo JSON de respuestas" style={{ display: "block", maxWidth: "100%", margin: "12px 0", color: "#fff" }} />
      {payload ? (
        <>
          <p style={{ fontSize: 14, marginBottom: 8 }}>{payload.items.length} respuestas listas para revisión.</p>
          <ul style={{ paddingLeft: 20, fontSize: 13, color: "rgba(255,255,255,.78)", lineHeight: 1.5 }}>
            {payload.items.slice(0, 5).map((item) => (
              <li key={item.id}>{item.alias} · {item.city}, {item.country} · {item.questionId}</li>
            ))}
          </ul>
          <button type="button" onClick={() => void importar()} disabled={busy}
            style={{ borderRadius: 999, padding: "10px 16px", background: "#FF4A1C", border: 0, color: "#fff", fontWeight: 600, cursor: busy ? "wait" : "pointer" }}>
            {busy ? "Importando…" : `Guardar ${payload.items.length} como pendientes`}
          </button>
        </>
      ) : null}
      {error ? <p role="alert" style={{ color: "#fca5a5" }}>{error}</p> : null}
      {notice ? <p role="status" style={{ color: "#86efac" }}>{notice}</p> : null}
    </details>
  );
}
