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
    const excerpt = text.slice(0, 160);
    const url = `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/mapa/historias/${id}`;
    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from:
        process.env.RESEND_FROM_EMAIL ?? 'AlmaMundi <hola@almamundi.org>',
      to: email,
      subject: 'Alguien pensó en ti cuando leyó esto',
      html: `
        <div style="font-family:system-ui,-apple-system,'Segoe UI',Avenir,sans-serif;background:#0f172a;color:#e2e8f0;padding:48px 32px;max-width:520px;margin:0 auto;border-radius:16px">
          <p style="font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:rgba(249,115,22,0.7);margin:0 0 16px">
            ${[story.city, story.country].filter(Boolean).join(', ')}
          </p>
          <h1 style="font-size:26px;font-weight:300;margin:0 0 20px;letter-spacing:-0.02em;line-height:1.2">
            ${title}
          </h1>
          ${excerpt ? `<p style="font-size:15px;color:rgba(255,255,255,0.60);line-height:1.7;margin:0 0 32px;font-style:italic">"${excerpt}${excerpt.length >= 160 ? '…' : ''}"</p>` : ''}
          <a href="${url}"
             style="display:inline-block;padding:14px 28px;background:rgba(249,115,22,0.85);color:#fff;border-radius:999px;text-decoration:none;font-size:14px">
            Leer la historia completa
          </a>
          <p style="font-size:11px;color:rgba(255,255,255,0.20);margin:32px 0 0">
            ${anonymous ? 'Alguien' : 'Una persona'} pensó en ti cuando leyó esto en AlmaMundi.
          </p>
        </div>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[share]', err);
    return NextResponse.json({ error: 'Error.' }, { status: 500 });
  }
}
