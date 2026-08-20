import "server-only";
import { getAdminBucket } from "@/lib/firebase/admin";
import {
  fetchBucketEgressBytesThisMonth,
  fetchBucketTotalBytes,
} from "@/lib/ops/google-monitoring";
import {
  areUploadsPaused,
  readMonthEmailCount,
  setUploadsPaused,
  utcMonthKey,
} from "@/lib/ops/usage-state";

const GB = 1000 * 1000 * 1000;
const STORAGE_GB_THRESHOLDS = [10, 25, 50, 100];
const EGRESS_GB_THRESHOLDS = [10, 25, 50, 100];
const COST_USD_THRESHOLDS = [5, 20, 50];
const RESEND_MONTHLY_FREE = 3000;
const RESEND_WARN_AT = 2400;
const FIREBASE_SPARK_STORAGE_GB = 5;
const FIREBASE_SPARK_WARN_BYTES = 0.8 * FIREBASE_SPARK_STORAGE_GB * GB;

/** Precios aproximados Blaze (us-central1), solo Storage. */
const USD_PER_GB_MONTH_STORAGE = 0.026;
const USD_PER_GB_EGRESS = 0.12;

const PAUSE_USD = Number(process.env.USAGE_UPLOAD_PAUSE_USD || "80");
const PAUSE_STORAGE_GB = 120;

export const USAGE_ALERT_TO =
  process.env.USAGE_ALERT_EMAIL?.trim() || "male@precisar.net";

export type UsageSnapshot = {
  monthKey: string;
  dayOfMonth: number;
  daysInMonth: number;
  monthFraction: number;
  storageBytes: number | null;
  storageBytesSource: "monitoring" | "listing" | "unknown";
  egressBytes: number | null;
  emailsSent: number;
  estimatedUsd: number | null;
  uploadsPaused: boolean;
};

export type UsageAlert = {
  key: string;
  subject: string;
  what: string;
  usedLabel: string;
  limitLabel: string;
  advice: string;
};

function daysInUtcMonth(d: Date): number {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
}

function formatGb(bytes: number): string {
  const gb = bytes / GB;
  if (gb < 0.1) return `${(bytes / (1000 * 1000)).toFixed(1)} MB`;
  return `${gb.toFixed(1)} GB`;
}

function formatUsd(n: number): string {
  return `USD ${n.toFixed(2)}`;
}

function projectEndOfMonth(used: number, monthFraction: number): number {
  if (monthFraction <= 0.02) return used;
  return used / monthFraction;
}

async function listBucketBytes(maxMs: number): Promise<{
  bytes: number;
  truncated: boolean;
}> {
  const bucket = getAdminBucket();
  let bytes = 0;
  let truncated = false;
  const started = Date.now();
  let pageToken: string | undefined;
  do {
    const [files, , apiResponse] = await bucket.getFiles({
      autoPaginate: false,
      maxResults: 500,
      pageToken,
    });
    for (const f of files) {
      bytes += Number(f.metadata.size || 0);
    }
    pageToken = (apiResponse as { nextPageToken?: string } | undefined)
      ?.nextPageToken;
    if (Date.now() - started > maxMs) {
      truncated = true;
      break;
    }
  } while (pageToken);
  return { bytes, truncated };
}

export async function collectUsageSnapshot(): Promise<UsageSnapshot> {
  const now = new Date();
  const dayOfMonth = now.getUTCDate();
  const daysInMonth = daysInUtcMonth(now);
  const monthFraction = dayOfMonth / daysInMonth;
  const bucketName = getAdminBucket().name;

  let storageBytes: number | null = await fetchBucketTotalBytes(bucketName);
  let storageBytesSource: UsageSnapshot["storageBytesSource"] = "monitoring";
  if (storageBytes == null) {
    try {
      const listed = await listBucketBytes(40_000);
      storageBytes = listed.bytes;
      storageBytesSource = "listing";
      if (listed.truncated) {
        console.warn("[usage] listado de Storage truncado por tiempo");
      }
    } catch (e) {
      console.error("[usage] listBucketBytes", e);
      storageBytesSource = "unknown";
    }
  }

  const egressBytes = await fetchBucketEgressBytesThisMonth(bucketName);
  const emailsSent = await readMonthEmailCount(utcMonthKey(now));
  const uploadsPaused = await areUploadsPaused();

  let estimatedUsd: number | null = null;
  if (storageBytes != null) {
    const storageUsd = (storageBytes / GB) * USD_PER_GB_MONTH_STORAGE;
    const egressUsd =
      egressBytes != null ? (egressBytes / GB) * USD_PER_GB_EGRESS : 0;
    estimatedUsd = storageUsd + egressUsd;
  }

  return {
    monthKey: utcMonthKey(now),
    dayOfMonth,
    daysInMonth,
    monthFraction,
    storageBytes,
    storageBytesSource,
    egressBytes,
    emailsSent,
    estimatedUsd,
    uploadsPaused,
  };
}

export function alertsForSnapshot(snap: UsageSnapshot): UsageAlert[] {
  const out: UsageAlert[] = [];
  const mk = snap.monthKey;

  if (snap.storageBytes != null) {
    const usedGb = snap.storageBytes / GB;
    for (const gb of STORAGE_GB_THRESHOLDS) {
      if (usedGb >= gb) {
        out.push({
          key: `${mk}:storage:${gb}`,
          subject: `AlmaMundi — el almacenamiento superó ${gb} GB`,
          what: "Se está llenando el espacio de archivos (videos, audios y fotos) en Firebase Storage.",
          usedLabel: formatGb(snap.storageBytes),
          limitLabel: `${gb} GB`,
          advice:
            gb >= 100
              ? "Revisa archivos de prueba o muy pesados en Firebase Storage. Si el tráfico sigue subiendo, conviene un plan de limpieza o un CDN con caché."
              : "No hace falta apagar nada. Revisa de vez en cuando el bucket y borra envíos de prueba. El costo de guardar es bajo; lo caro es que la gente reproduzca los videos.",
        });
      }
    }
    if (snap.storageBytes >= FIREBASE_SPARK_WARN_BYTES) {
      out.push({
        key: `${mk}:freetier:firebase-storage`,
        subject: "AlmaMundi — cerca del cupo gratis de Firebase Storage (5 GB)",
        what: "El plan gratuito de Firebase Storage es de 5 GB. Si el proyecto está en plan Blaze, Google ya cobra el excedente; este aviso es para no llevarte una sorpresa.",
        usedLabel: formatGb(snap.storageBytes),
        limitLabel: "5 GB (cupo Spark)",
        advice:
          "Confirma en Firebase Console que el proyecto está en plan Blaze y que las alertas de presupuesto de Google Cloud están activas.",
      });
    }
  }

  if (snap.egressBytes != null) {
    const usedGb = snap.egressBytes / GB;
    for (const gb of EGRESS_GB_THRESHOLDS) {
      if (usedGb >= gb) {
        out.push({
          key: `${mk}:egress:${gb}`,
          subject: `AlmaMundi — el tráfico de salida superó ${gb} GB este mes`,
          what: "La gente está descargando o reproduciendo archivos desde Storage. Ese tráfico de salida es lo que más suele costar.",
          usedLabel: `${formatGb(snap.egressBytes)} este mes`,
          limitLabel: `${gb} GB / mes`,
          advice:
            gb >= 50
              ? "Revisa si hay un video muy pesado en la portada o un bot descargando en bucle. Puedes pausar subidas nuevas (ops/runtime.uploadsPaused) mientras investigas."
              : "Es normal si hay videos públicos. Si sube de golpe, mira en Firebase Usage si hay un archivo concreto con muchas lecturas.",
        });
      }
    }
  }

  if (snap.estimatedUsd != null) {
    for (const usd of COST_USD_THRESHOLDS) {
      if (snap.estimatedUsd >= usd) {
        out.push({
          key: `${mk}:cost:${usd}`,
          subject: `AlmaMundi — el costo estimado de Storage superó USD ${usd}`,
          what: "Costo estimado solo de almacenamiento + tráfico de salida de Firebase Storage (no incluye Vercel, Resend ni el resto de Google Cloud).",
          usedLabel: formatUsd(snap.estimatedUsd),
          limitLabel: formatUsd(usd),
          advice:
            usd >= 50
              ? "Mira el desglose en Google Cloud Billing. Si no reconoces el gasto, pausa las subidas y revisa uso anómalo."
              : "Sigue el gasto en Billing. Las alertas de presupuesto de Google Cloud son la red de seguridad si este correo fallara.",
        });
      }
    }
  }

  if (snap.emailsSent >= RESEND_WARN_AT) {
    out.push({
      key: `${mk}:freetier:resend`,
      subject: "AlmaMundi — cerca del límite de Resend (3.000 correos/mes)",
      what: "Resend deja de enviar (o empieza a cobrar) al pasar el cupo del plan. Contamos los correos que manda AlmaMundi este mes.",
      usedLabel: `${snap.emailsSent} correos`,
      limitLabel: `${RESEND_MONTHLY_FREE} correos / mes`,
      advice:
        "Revisa en Resend el uso real. Si se acerca a 3.000, pausa avisos no esenciales o sube de plan antes de que fallen los correos a autores.",
    });
  }

  return out;
}

export function monthProgressCopy(snap: UsageSnapshot): string {
  return `Van ${snap.dayOfMonth} días de ${snap.daysInMonth} de este mes (calendario UTC).`;
}

export function projectionCopy(snap: UsageSnapshot, used: number, unit: string): string {
  const projected = projectEndOfMonth(used, snap.monthFraction);
  return `Si sigue este ritmo, a fin de mes estaríamos cerca de ${projected.toFixed(1)} ${unit}.`;
}

export async function pauseUploadsIfNeeded(
  snap: UsageSnapshot
): Promise<UsageAlert | null> {
  if (snap.uploadsPaused) return null;
  const overCost = snap.estimatedUsd != null && snap.estimatedUsd >= PAUSE_USD;
  const overStorage =
    snap.storageBytes != null && snap.storageBytes >= PAUSE_STORAGE_GB * GB;
  if (!overCost && !overStorage) return null;

  const reason = overCost
    ? `Costo estimado ${formatUsd(snap.estimatedUsd!)} ≥ ${formatUsd(PAUSE_USD)}`
    : `Almacenamiento ${formatGb(snap.storageBytes!)} ≥ ${PAUSE_STORAGE_GB} GB`;

  await setUploadsPaused(true, reason);
  const mk = snap.monthKey;
  return {
    key: `${mk}:pause:uploads`,
    subject: "AlmaMundi — pausamos las subidas nuevas para no disparar el costo",
    what: "Alguien o algo (un bot, un archivo enorme, mucho tráfico) hizo que el uso se saliera de lo razonable. Las subidas nuevas quedan pausadas. El sitio sigue en línea.",
    usedLabel: reason,
    limitLabel: `Tope interno: ${formatUsd(PAUSE_USD)} estimados o ${PAUSE_STORAGE_GB} GB guardados`,
    advice:
      "Revisa Billing y Storage. Cuando esté controlado, en Firestore abre el documento ops/runtime y pon uploadsPaused en false. No desactives la facturación de Google Cloud: eso apaga Auth, Firestore y todo el proyecto.",
  };
}
