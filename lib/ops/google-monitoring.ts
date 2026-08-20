import "server-only";

type ServiceAccountBits = {
  projectId: string;
  clientEmail: string;
  privateKey: string;
};

function serviceAccountFromEnv(): ServiceAccountBits | null {
  const secretRaw = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64?.trim();
  if (secretRaw) {
    try {
      const svc = secretRaw.startsWith("{")
        ? (JSON.parse(secretRaw) as Record<string, string>)
        : (JSON.parse(
            Buffer.from(secretRaw.replace(/\s/g, ""), "base64").toString("utf8")
          ) as Record<string, string>);
      const projectId = svc.project_id || svc.projectId;
      const clientEmail = svc.client_email || svc.clientEmail;
      const privateKey = String(svc.private_key || svc.privateKey || "").replace(
        /\\n/g,
        "\n"
      );
      if (projectId && clientEmail && privateKey.includes("BEGIN")) {
        return { projectId, clientEmail, privateKey };
      }
    } catch {
      return null;
    }
  }
  const projectId =
    process.env.FIREBASE_PROJECT_ID || process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail =
    process.env.FIREBASE_CLIENT_EMAIL || process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const rawKey =
    process.env.FIREBASE_PRIVATE_KEY || process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  const privateKey = rawKey ? rawKey.replace(/\\n/g, "\n") : "";
  if (projectId && clientEmail && privateKey.includes("BEGIN")) {
    return { projectId, clientEmail, privateKey };
  }
  return null;
}

async function googleAccessToken(scope: string): Promise<{
  token: string;
  projectId: string;
} | null> {
  const sa = serviceAccountFromEnv();
  if (!sa) return null;
  try {
    const { JWT } = await import("google-auth-library");
    const jwt = new JWT({
      email: sa.clientEmail,
      key: sa.privateKey,
      scopes: [scope],
    });
    const tok = await jwt.authorize();
    if (!tok.access_token) return null;
    return { token: tok.access_token, projectId: sa.projectId };
  } catch (e) {
    console.error("[usage] googleAccessToken", e);
    return null;
  }
}

type TimeSeries = {
  points?: { value?: { doubleValue?: number; int64Value?: string } }[];
};

function sumSeries(series: TimeSeries[]): number {
  let total = 0;
  for (const s of series) {
    for (const p of s.points || []) {
      if (typeof p.value?.doubleValue === "number") total += p.value.doubleValue;
      else if (p.value?.int64Value) total += Number(p.value.int64Value);
    }
  }
  return total;
}

function lastGauge(series: TimeSeries[]): number | null {
  let last: number | null = null;
  for (const s of series) {
    const pts = s.points || [];
    const p = pts[pts.length - 1];
    if (!p?.value) continue;
    if (typeof p.value.doubleValue === "number") last = p.value.doubleValue;
    else if (p.value.int64Value) last = Number(p.value.int64Value);
  }
  return last != null && Number.isFinite(last) ? last : null;
}

async function queryTimeSeries(opts: {
  token: string;
  projectId: string;
  filter: string;
  start: Date;
  end: Date;
  aligner: "ALIGN_SUM" | "ALIGN_MAX";
  periodSec: number;
}): Promise<TimeSeries[]> {
  const params = new URLSearchParams({
    filter: opts.filter,
    "interval.startTime": opts.start.toISOString(),
    "interval.endTime": opts.end.toISOString(),
    "aggregation.alignmentPeriod": `${opts.periodSec}s`,
    "aggregation.perSeriesAligner": opts.aligner,
  });
  const url = `https://monitoring.googleapis.com/v3/projects/${opts.projectId}/timeSeries?${params}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${opts.token}` },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error("[usage] monitoring", res.status, body.slice(0, 400));
    return [];
  }
  const json = (await res.json()) as { timeSeries?: TimeSeries[] };
  return json.timeSeries || [];
}

/** Bytes actuales en el bucket (gauge). Null si Monitoring no está habilitado o falta permiso. */
export async function fetchBucketTotalBytes(
  bucketName: string
): Promise<number | null> {
  const auth = await googleAccessToken(
    "https://www.googleapis.com/auth/monitoring.read"
  );
  if (!auth) return null;
  const end = new Date();
  const start = new Date(end.getTime() - 2 * 24 * 60 * 60 * 1000);
  const series = await queryTimeSeries({
    token: auth.token,
    projectId: auth.projectId,
    filter: `metric.type="storage.googleapis.com/storage/total_bytes" AND resource.labels.bucket_name="${bucketName}"`,
    start,
    end,
    aligner: "ALIGN_MAX",
    periodSec: 86400,
  });
  return lastGauge(series);
}

/** Tráfico de salida del bucket en el mes UTC en curso. Null si no hay métrica. */
export async function fetchBucketEgressBytesThisMonth(
  bucketName: string
): Promise<number | null> {
  const auth = await googleAccessToken(
    "https://www.googleapis.com/auth/monitoring.read"
  );
  if (!auth) return null;
  const end = new Date();
  const start = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1));
  const series = await queryTimeSeries({
    token: auth.token,
    projectId: auth.projectId,
    filter: `metric.type="storage.googleapis.com/network/sent_bytes" AND resource.labels.bucket_name="${bucketName}"`,
    start,
    end,
    aligner: "ALIGN_SUM",
    periodSec: 86400,
  });
  const n = sumSeries(series);
  return Number.isFinite(n) ? n : null;
}
