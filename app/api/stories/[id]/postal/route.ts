import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { Resend } from 'resend';

export const runtime = 'nodejs';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = (await req.json()) as {
      email?: string;
      anonymous?: boolean;
    };
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const anonymous = body.anonymous !== false;

    if (!email) {
      return NextResponse.json(
        { error: 'Email requerido.' },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const storySnap = await db.collection('stories').doc(id).get();
    const story = storySnap.data() as Record<string, unknown> | undefined;
    if (!story) {
      return NextResponse.json(
        { error: 'Historia no encontrada.' },
        { status: 404 }
      );
    }

    const title = (story.title as string) ?? '';
    const text = (story.text as string) ?? '';
    const excerpt = text.slice(0, 200);
    const storyUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/mapa/historias/${id}`;
    const resend = new Resend(process.env.RESEND_API_KEY);
    const imageUrl =
      (story.imageUrl as string) ||
      (Array.isArray(story.images) && story.images[0]
        ? (story.images[0] as string)
        : '');

    await resend.emails.send({
      from:
        process.env.RESEND_FROM_EMAIL ?? 'AlmaMundi <hola@almamundi.org>',
      to: email,
      subject: 'Una postal para ti — AlmaMundi',
      html: `
        <div style="font-family:system-ui,-apple-system,'Segoe UI',Avenir,sans-serif;background:#0f172a;color:#e2e8f0;padding:0;max-width:520px;margin:0 auto;border-radius:16px;overflow:hidden">
          ${imageUrl ? `<div style="width:100%;height:240px;background:center/cover no-repeat url(${imageUrl});background-color:#1e293b"></div>` : ''}
          <div style="padding:32px 28px">
            <p style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:rgba(249,115,22,0.7);margin:0 0 12px">
              Postal · ${[story.city, story.country].filter(Boolean).join(', ')}
            </p>
            <h1 style="font-size:24px;font-weight:300;margin:0 0 16px;letter-spacing:-0.02em;line-height:1.2;color:#fff">
              ${title}
            </h1>
            ${excerpt ? `<p style="font-size:14px;color:rgba(255,255,255,0.65);line-height:1.65;margin:0 0 24px;font-style:italic">"${excerpt}${excerpt.length >= 200 ? '…' : ''}"</p>` : ''}
            <a href="${storyUrl}"
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
