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
