import * as Sentry from "@sentry/nextjs";

/**
 * Carga Sentry en server/edge. Sin NEXT_PUBLIC_SENTRY_DSN no envía nada
 * (ver sentry.*.config.ts). onRequestError cubre fallos no capturados.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;
