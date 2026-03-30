import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { isPublicStoryDocumentStatus } from '@/lib/story-public';
import {
  clientIpFromRequest,
  enforceRateLimit,
  getRateLimiter,
} from '@/lib/rate-limit';
import { isValidRecipientEmail, safeEmailText, safeHrefForEmail } from '@/lib/email-html';

export const runtime = 'nodejs';

function siteHost(): string {
  const u = process.env.NEXT_PUBLIC_APP_URL?.trim() || 'https://www.almamundi.org';
  try {
    return new URL(u).hostname;
  } catch {
    return 'www.almamundi.org';
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ip = clientIpFromRequest(req);
  const rl = getRateLimiter('story-resonance', 40, 3600);
  const blocked = await enforceRateLimit(rl, `resonance:${ip}`, {
    max: 40,
    windowMs: 3600_000,
  });
  if (blocked) return blocked;

  try {
    const { id } = await params;
    const body = (await req.json()) as { lat?: number; lng?: number };
    const lat = body.lat != null ? Math.round(body.lat * 10) / 10 : null;
    const lng = body.lng != null ? Math.round(body.lng * 10) / 10 : null;

    const db = getAdminDb();
    const storyRef = db.collection('stories').doc(id);
    const before = await storyRef.get();
    const storyData = before.data() as Record<string, unknown> | undefined;
    if (!before.exists || !isPublicStoryDocumentStatus(storyData?.status)) {
      return NextResponse.json({ error: 'Historia no encontrada.' }, { status: 404 });
    }

    await storyRef.collection('resonances').add({
      lat: lat ?? null,
      lng: lng ?? null,
      createdAt: FieldValue.serverTimestamp(),
    });

    await storyRef.update({
      resonancesCount: FieldValue.increment(1),
    });

    const storySnap = await storyRef.get();
    const data = storySnap.data() as Record<string, unknown> | undefined;
    const notifyEmail = data?.notifyEmail === true;
    const authorEmail = typeof data?.authorEmail === 'string' ? data.authorEmail : '';
    const titleRaw = typeof data?.title === 'string' ? data.title : '';

    if (notifyEmail && authorEmail && isValidRecipientEmail(authorEmail) && process.env.RESEND_API_KEY) {
      try {
        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);
        const cityStr =
          lat != null && lng != null
            ? `Desde coordenadas aproximadas (${lat}, ${lng})`
            : 'Desde algún lugar del mundo';
        const title = safeEmailText(titleRaw, 400);
        const base = process.env.NEXT_PUBLIC_APP_URL?.trim() || '';
        const href = safeHrefForEmail(`${base}/mapa/historias/${id}`, [siteHost(), 'almamundi.org']);

        await resend.emails.send({
          from:
            process.env.RESEND_FROM_EMAIL ?? 'AlmaMundi <hola@almamundi.org>',
          to: authorEmail,
          subject: 'Tu historia llegó a alguien',
          html: `
          <div style="font-family:system-ui,-apple-system,'Segoe UI',Avenir,sans-serif;background:#0f172a;color:#e2e8f0;padding:40px;border-radius:12px;max-width:520px;margin:0 auto">
            <p style="font-size:22px;font-weight:300;margin:0 0 16px;color:#fff">"${title}"</p>
            <p style="font-size:15px;color:rgba(255,255,255,0.65);line-height:1.6;margin:0 0 24px">
              Alguien leyó tu historia y quiso que lo supieras.<br/>
              ${safeEmailText(cityStr, 200)}.
            </p>
            <a href="${href.replace(/"/g, '')}"
               style="display:inline-block;padding:12px 24px;background:rgba(249,115,22,0.85);color:#fff;border-radius:999px;text-decoration:none;font-size:13px">
              Ver tu historia
            </a>
          </div>
        `,
        });
      } catch (e) {
        console.error('[resonance] email', e);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[resonance]', err);
    return NextResponse.json({ error: 'Error.' }, { status: 500 });
  }
}
