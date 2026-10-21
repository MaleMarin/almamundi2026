import * as Sentry from "@sentry/nextjs";
import { sentryEnvironment } from "@/lib/sentry-environment";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN?.trim();

Sentry.init({
  dsn,
  enabled: Boolean(dsn) && process.env.NODE_ENV === "production",
  environment: sentryEnvironment(), // preview → vercel-preview; production → vercel-production
  tracesSampleRate: 0.1,
  sendDefaultPii: false,
});
