import { test, expect } from '@playwright/test';

test.describe('Auditoría móvil de preguntas y compartir', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test('Inspírate muestra ocho preguntas, frase y acceso a preguntas propias sin desborde horizontal', async ({ page }) => {
    await page.goto('/preguntas?tema=musica', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.cortina-frase-editorial')).toHaveText('Una canción puede guardar un día entero.');
    await expect(page.locator('.cortina-indice-pregunta')).toHaveCount(8);
    await expect(page.getByRole('link', { name: 'Deja tu propia pregunta y respóndela' }))
      .toHaveAttribute('href', '/preguntas-de-las-personas');
    const measures = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      scroll: document.documentElement.scrollWidth,
    }));
    expect(measures.scroll).toBeLessThanOrEqual(measures.viewport + 2);
  });

  test('Formulario móvil: texto, audio, fotografía y consentimiento visibles al responder', async ({ page }) => {
    await page.goto('/preguntas?tema=musica', { waitUntil: 'domcontentloaded' });
    await page.locator('.cortina-indice-pregunta').first().click();
    await page.locator('.cortina-formato').filter({ hasText: /Escríbela/i }).first().click();
    await expect(page.locator('form.cortina-form')).toBeVisible();
    await expect(page.locator('form.cortina-form textarea')).toBeVisible();
    await expect(page.locator('form.cortina-form input[type=checkbox]')).toHaveCount(3);
    await expect(page.locator('form.cortina-form input[type=email]')).toBeVisible();
    const measures = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      scroll: document.documentElement.scrollWidth,
    }));
    expect(measures.scroll).toBeLessThanOrEqual(measures.viewport + 2);
  });

  test('Preguntas propias abre un formulario independiente en móvil', async ({ page }) => {
    await page.goto('/preguntas-de-las-personas', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: /Dejar mi pregunta/i }).click();
    await expect(page.locator('form.me-pregunto-form')).toBeVisible();
    await expect(page.locator('form.me-pregunto-form textarea')).toBeVisible();
  });
});

test.describe('Compartir y compatibilidad', () => {
  test('una pregunta de cinta antigua mantiene el ID y dirige a la sección', async ({ page }) => {
    await page.goto('/pregunta/infancia-1', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/preguntas\?p=infancia-1/);
  });
  test('una pregunta nueva mantiene el ID y dirige a su sección', async ({ page }) => {
    await page.goto('/pregunta/musica-1', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/preguntas\?p=musica-1/);
  });
  test('una pregunta propia histórica usa la ruta de preguntas de las personas', async ({ page }) => {
    await page.goto('/pregunta/mp-a1b2c3d4', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/preguntas-de-las-personas\?p=mp-a1b2c3d4/);
  });
});

test.describe('Administrador y flujo de compartir en celular', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test('login de administrador cabe en la pantalla móvil', async ({ page }) => {
    await page.goto('/admin', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /Panel Admin AlmaMundi/i })).toBeVisible();
    const measures = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      scroll: document.documentElement.scrollWidth,
    }));
    expect(measures.scroll).toBeLessThanOrEqual(measures.viewport + 2);
  });

  test('compartir después de responder abre menú social desplazable sin publicar datos reales', async ({ page }) => {
    await page.route('**/api/respuestas', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, id: 'test-no-guardado' }) })
    );
    await page.goto('/preguntas?tema=musica', { waitUntil: 'domcontentloaded' });
    await page.locator('.cortina-indice-pregunta').first().click();
    await page.locator('.cortina-formato').filter({ hasText: /Escríbela/i }).first().click();
    const form = page.locator('form.cortina-form');
    await form.locator('textarea').fill('Una experiencia de prueba de interfaz. Este texto no se envía al servidor.');
    await form.locator('input[autocomplete=nickname]').fill('Prueba QA');
    await form.locator('input[autocomplete=country-name]').fill('Chile');
    await form.locator('input[autocomplete=address-level2]').fill('Santiago');
    for (const checkbox of await form.locator('input[type=checkbox]').all()) await checkbox.check();
    await form.getByRole('button', { name: 'Enviar mi respuesta' }).click();
    await expect(page.getByRole('button', { name: 'Comparte la pregunta' })).toBeVisible();
    await page.getByRole('button', { name: 'Comparte la pregunta' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'WhatsApp' })).toBeVisible();
    await expect(dialog.getByRole('button', { name: /Instagram/i })).toBeVisible();
    await expect(dialog.getByRole('button', { name: /TikTok/i })).toBeVisible();
    const size = await dialog.evaluate((el) => {
      const panel = el.querySelector('div')!;
      return { scrollHeight: panel.scrollHeight, clientHeight: panel.clientHeight, viewport: window.innerHeight };
    });
    expect(size.clientHeight).toBeLessThanOrEqual(size.viewport);
  });
});


test.describe('Difusión de pregunta propia pendiente', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test('la pantalla de recepción permite compartir la participación sin revelar el texto', async ({ page }) => {
    await page.route('**/api/me-pregunto', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
        return;
      }
      await route.continue();
    });
    await page.goto('/preguntas-de-las-personas', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Dejar mi pregunta' }).click();
    const form = page.locator('form.me-pregunto-form');
    const pendingQuestion = '¿Qué recuerdo te gustaría compartir con otras personas?';
    await form.locator('textarea').fill(pendingQuestion);
    await form.locator('input[autocomplete="nickname"]').fill('Prueba QA');
    await form.locator('input[autocomplete="country-name"]').fill('Chile');
    await form.locator('input[autocomplete="address-level2"]').fill('Santiago');
    for (const checkbox of await form.locator('input[type="checkbox"]').all()) await checkbox.check();
    await form.getByRole('button', { name: 'Enviar mi pregunta' }).click();
    await expect(page.getByRole('button', { name: 'Compartir que dejé una pregunta' })).toBeVisible();
    await page.getByRole('button', { name: 'Compartir que dejé una pregunta' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'WhatsApp' })).toBeVisible();
    await expect(dialog.getByRole('button', { name: /Instagram/i })).toBeVisible();
    await expect(dialog.getByRole('button', { name: /TikTok/i })).toBeVisible();
    // No se comparte el contenido en revisión ni se enlaza a una pregunta todavía privada.
    await expect(dialog).not.toContainText(pendingQuestion);
    const whatsApp = await dialog.getByRole('button', { name: 'WhatsApp' }).count();
    expect(whatsApp).toBe(1);
  });
});
