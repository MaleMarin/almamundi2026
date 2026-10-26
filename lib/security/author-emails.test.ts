import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import { emailPublicOrigin } from '../email/almamundi-email-layout';
import {
  buildReceivedEmailHtml,
  buildReceivedEmailText,
  capitalizeAlias,
  receivedEmailSubject,
  storyFormatLabel,
} from '../email/received-email-template';
import {
  buildPublicationEmailHtml,
  buildPublicationEmailText,
  publicationEmailSubject,
} from '../email/send-publication-email';

const sampleReceived = {
  authorName: 'ana',
  storyTitle: 'El río',
  format: 'foto',
  submittedAt: new Date('2026-10-26T15:00:00.000Z'),
};

const envKeys = ['VERCEL_ENV', 'VERCEL_URL', 'NEXT_PUBLIC_SITE_URL'] as const;
const previousEnv = new Map<string, string | undefined>();

function rememberEnv() {
  for (const key of envKeys) previousEnv.set(key, process.env[key]);
}

function restoreEnv() {
  for (const key of envKeys) {
    const value = previousEnv.get(key);
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

describe('correos al autor', () => {
  afterEach(() => {
    restoreEnv();
  });

  it('recepción usa los textos pedidos y no enlaza la ficha', () => {
    rememberEnv();
    delete process.env.VERCEL_ENV;
    delete process.env.VERCEL_URL;
    delete process.env.NEXT_PUBLIC_SITE_URL;

    const html = buildReceivedEmailHtml(sampleReceived);
    const text = buildReceivedEmailText(sampleReceived);
    assert.equal(receivedEmailSubject('El río'), 'Recibimos tu historia «El río»');
    assert.equal(capitalizeAlias('ana'), 'Ana');
    assert.equal(storyFormatLabel('foto'), 'fotos');
    assert.match(html, /Hola, Ana:/);
    assert.match(html, /Recibimos tu historia «El río»/);
    assert.match(html, /Antes de publicarla, la leerá una persona de nuestro equipo/);
    assert.match(html, /Formato/);
    assert.match(html, /fotos/);
    assert.match(html, /26 de octubre de 2026/);
    assert.match(html, /Qué pasa ahora/);
    assert.match(html, /Contar otra historia/);
    assert.match(html, /Explorar el mapa/);
    assert.match(html, /hola@almamundi\.org/);
    assert.match(html, /WhatsApp/);
    assert.match(html, /Política de privacidad/);
    assert.match(html, /prefers-color-scheme:\s*dark/);
    assert.match(html, /height:48px/);
    assert.match(html, /Ahora pasa por una revisión/);
    assert.doesNotMatch(html, /\/historias\//);
    assert.doesNotMatch(text, /\/historias\//);
    assert.match(text, /Contar otra historia: https:\/\/www\.almamundi\.org\/contar/);
    assert.match(html, /https:\/\/www\.almamundi\.org\/contar/);
    assert.match(html, /https:\/\/www\.almamundi\.org\/terminos/);
  });

  it('fuera de producción los enlaces usan el host del despliegue', () => {
    rememberEnv();
    process.env.VERCEL_ENV = 'preview';
    process.env.VERCEL_URL = 'almamundi-preview-abc.vercel.app';
    process.env.NEXT_PUBLIC_SITE_URL = 'https://www.almamundi.org';
    assert.equal(emailPublicOrigin(), 'https://almamundi-preview-abc.vercel.app');
    const html = buildReceivedEmailHtml(sampleReceived);
    assert.match(html, /https:\/\/almamundi-preview-abc\.vercel\.app\/contar/);
    assert.doesNotMatch(html, /www\.almamundi\.org\/contar/);

    process.env.VERCEL_ENV = 'production';
    assert.equal(emailPublicOrigin(), 'https://www.almamundi.org');
    const productionHtml = buildReceivedEmailHtml(sampleReceived);
    assert.match(productionHtml, /https:\/\/www\.almamundi\.org\/contar/);
  });

  it('publicación invita a compartir el enlace de la historia', () => {
    rememberEnv();
    delete process.env.VERCEL_ENV;
    delete process.env.VERCEL_URL;
    delete process.env.NEXT_PUBLIC_SITE_URL;

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
    assert.match(html, /https:\/\/www\.almamundi\.org\/historias\/abc123/);
    assert.match(html, /Ver mi historia/);
    assert.match(html, /Compartir por WhatsApp/);
    assert.match(html, /Contar otra historia/);
    assert.match(html, /Hola Male,/);
    assert.match(html, /ALMAMUNDI/);
    assert.match(text, /El río/);
    assert.match(text, /Santiago/);
  });
});
