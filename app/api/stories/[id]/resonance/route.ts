import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export const runtime = 'nodejs';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = (await req.json()) as { lat?: number; lng?: number };
    const lat = body.lat != null ? Math.round(body.lat * 10) / 10 : null;
    const lng = body.lng != null ? Math.round(body.lng * 10) / 10 : null;

    const db = getAdminDb();
    await db.collection('stories').doc(id).collection('resonances').add({
      lat: lat ?? null,
      lng: lng ?? null,
      createdAt: FieldValue.serverTimestamp(),
    });

    await db.collection('stories').doc(id).update({
      resonancesCount: FieldValue.increment(1),
    });

    const storySnap = await db.collection('stories').doc(id).get();
    const data = storySnap.data() as Record<string, unknown> | undefined;
    const notifyEmail = data?.notifyEmail === true;
    const authorEmail = typeof data?.authorEmail === 'string' ? data.authorEmail : '';
    const title = typeof data?.title === 'string' ? data.title : '';

    if (notifyEmail && authorEmail) {
      try {
        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);
        const cityStr =
          lat != null && lng != null
            ? `Desde coordenadas aproximadas (${lat}, ${lng})`
            : 'Desde algún lugar del mundo';

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
              ${cityStr}.
            </p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL ?? ''}/mapa/historias/${id}"
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
