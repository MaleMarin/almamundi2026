import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { Resend } from 'resend';
import { isPublicStoryDocumentStatus } from '@/lib/story-public';
import {
  clientIpFromRequest,
  enforceRateLimit,
  getRateLimiter,
} from '@/lib/rate-limit';
import {
  isValidRecipientEmail,
  safeCssUrl,
  safeEmailText,
  safeHrefForEmail,
} from '@/lib/email-html';

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
  const rl = getRateLimiter('story-postal-email', 10, 3600);
  const blocked = await enforceRateLimit(rl, `postal:${ip}`, {
    max: 10,
    windowMs: 3600_000,
  });
  if (blocked) return blocked;

  if (!process.env.RESEND_API_KEY?.trim()) {
    return NextResponse.json({ error: 'Servicio de correo no disponible.' }, { status: 503 });
  }

  try {
    const { id } = await params;
    const body = (await req.json()) as {
      email?: string;
      anonymous?: boolean;
    };
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const anonymous = body.anonymous !== false;

    if (!email || !isValidRecipientEmail(email)) {
      return NextResponse.json(
        { error: 'Email no válido.' },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const storySnap = await db.collection('stories').doc(id).get();
    const story = storySnap.data() as Record<string, unknown> | undefined;
    if (!story || !isPublicStoryDocumentStatus(story.status)) {
      return NextResponse.json(
        { error: 'Historia no encontrada.' },
        { status: 404 }
      );
    }

    const titleRaw = (story.title as string) ?? '';
    const text = (story.text as string) ?? '';
    const excerpt = text.slice(0, 200);
    const title = safeEmailText(titleRaw, 300);
    const excerptHtml = excerpt
      ? safeEmailText(excerpt + (excerpt.length >= 200 ? '…' : ''), 220)
      : '';
    const base = process.env.NEXT_PUBLIC_APP_URL?.trim() || '';
    const storyUrl = safeHrefForEmail(`${base}/mapa/historias/${id}`, [siteHost(), 'almamundi.org']);
    const imageUrlRaw =
      (story.imageUrl as string) ||
      (Array.isArray(story.images) && story.images[0]
        ? (story.images[0] as string)
        : '');
    const bgUrl = safeCssUrl(imageUrlRaw);
    const bgStyle = bgUrl ? `width:100%;height:240px;background:center/cover no-repeat url(${bgUrl});background-color:#1e293b` : '';

    const resend = new Resend(process.env.RESEND_API_KEY);
    const loc = [story.city, story.country].filter(Boolean).join(', ');
    const locHtml = loc ? safeEmailText(loc, 200) : '';

    await resend.emails.send({
      from:
        process.env.RESEND_FROM_EMAIL ?? 'AlmaMundi <hola@almamundi.org>',
      to: email,
      subject: 'Una postal para ti — AlmaMundi',
      html: `
        <div style="font-family:system-ui,-apple-system,'Segoe UI',Avenir,sans-serif;background:#0f172a;color:#e2e8f0;padding:0;max-width:520px;margin:0 auto;border-radius:16px;overflow:hidden">
          ${bgUrl ? `<div style="${bgStyle}"></div>` : ''}
          <div style="padding:32px 28px">
            <p style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:rgba(249,115,22,0.7);margin:0 0 12px">
              Postal · ${locHtml}
            </p>
            <h1 style="font-size:24px;font-weight:300;margin:0 0 16px;letter-spacing:-0.02em;line-height:1.2;color:#fff">
              ${title}
            </h1>
            ${excerpt ? `<p style="font-size:14px;color:rgba(255,255,255,0.65);line-height:1.65;margin:0 0 24px;font-style:italic">"${excerptHtml}"</p>` : ''}
            <a href="${storyUrl.replace(/"/g, '')}"
               style="display:inline-block;padding:12px 24px;background:rgba(249,115,22,0.85);color:#fff;border-radius:999px;text-decoration:none;font-size:13px">
              Ver en el mapa
            </a>
            <p style="font-size:10px;color:rgba(255,255,255,0.25);margin:24px 0 0">
              ${anonymous ? 'Alguien' : 'Una persona'} te envió esta postal desde AlmaMundi.
            </p>
          </div>
        </div>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[postal]', err);
    return NextResponse.json({ error: 'Error.' }, { status: 500 });
  }
}
