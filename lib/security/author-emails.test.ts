import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  EMAIL_LOGO_PUBLIC_URL,
  EMAIL_PUBLIC_ORIGIN,
  EMAIL_TAGLINE,
  EMAIL_WHATSAPP_INVITE,
  whatsappShareHref,
} from '../email/almamundi-email-layout';
import {
  buildReceivedEmailHtml,
  buildReceivedEmailText,
  receivedEmailSubject,
} from '../email/send-received-email';
import {
  buildPublicationEmailHtml,
  buildPublicationEmailText,
  publicationEmailSubject,
} from '../email/send-publication-email';

describe('correos al autor', () => {
  it('recepción usa el asunto, el texto y el logo público', () => {
    const html = buildReceivedEmailHtml({ authorName: 'Male', authorEmail: 'a@b.c' });
    const text = buildReceivedEmailText({ authorName: 'Male', authorEmail: 'a@b.c' });
    assert.equal(receivedEmailSubject('Male'), 'Male, tu historia ya llegó a AlmaMundi');
    assert.match(html, /almamundi-wordmark-orange\.png|cid:almamundi-logo/);
    assert.match(html, /Contar otra historia/);
    assert.match(html, /Compartir por WhatsApp/);
    assert.match(html, /Un abrazo,/);
    assert.match(html, /Equipo AlmaMundi/);
    assert.match(html, /Política de privacidad/);
    assert.match(html, /Recibiste este correo porque enviaste una historia en AlmaMundi/);
    assert.match(html, new RegExp(EMAIL_TAGLINE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.match(text, /Tu historia ya llegó a AlmaMundi/);
    assert.match(text, /Contar otra historia/);
    assert.ok(whatsappShareHref(EMAIL_WHATSAPP_INVITE).startsWith('https://wa.me/'));
  });

  it('publicación invita a compartir el enlace de la historia', () => {
    const html = buildPublicationEmailHtml({
      authorName: 'Male',
      authorEmail: 'a@b.c',
      storyTitle: 'El río',
      storyId: 'abc123',
      placeName: 'Santiago',
    });
    const text = buildPublicationEmailText({
      authorName: 'Male',
      authorEmail: 'a@b.c',
      storyTitle: 'El río',
      storyId: 'abc123',
      placeName: 'Santiago',
    });
    assert.equal(publicationEmailSubject(), 'Tu historia ya está en AlmaMundi');
    assert.match(html, new RegExp(`${EMAIL_PUBLIC_ORIGIN}/historias/abc123`));
    assert.match(html, /Ver mi historia/);
    assert.match(html, /Compartir por WhatsApp/);
    assert.match(html, /Contar otra historia/);
    assert.match(text, /El río/);
    assert.match(text, /Santiago/);
  });
});
