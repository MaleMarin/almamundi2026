import { test, expect } from '@playwright/test';

/** La estructura editorial visible debe conservar ocho preguntas por cinta. */
test.describe('Inspírate — 16 cintas', () => {
  test('muestra las 16 cintas activas sin las dos archivadas', async ({ page }) => {
    await page.goto('/preguntas', { waitUntil: 'domcontentloaded' });
    const etiquetas = page.locator('.cortina-etiqueta');
    await expect(etiquetas).toHaveCount(16);
    await expect(etiquetas.filter({ hasText: 'Música' })).toHaveCount(1);
    await expect(etiquetas.filter({ hasText: 'Creencias' })).toHaveCount(0);
    await expect(etiquetas.filter({ hasText: 'Los que ya no están' })).toHaveCount(0);
  });

  test('Música: frase interior, ocho preguntas y acceso a pregunta propia', async ({ page }) => {
    await page.goto('/preguntas?tema=musica', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.cortina-frase-editorial')).toHaveText(
      'Una canción puede guardar un día entero.'
    );
    await expect(page.locator('.cortina-indice-pregunta')).toHaveCount(8);
    await expect(page.locator('.cortina-indice-pregunta').last()).toContainText('futuro');
    await expect(page.getByRole('link', { name: 'Deja tu propia pregunta y respóndela' })).toHaveAttribute(
      'href',
      '/preguntas-de-las-personas'
    );
  });

  test('Trabajo conserva ocho preguntas con el futuro y su frase', async ({ page }) => {
    await page.goto('/preguntas?tema=trabajo', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.cortina-frase-editorial')).toHaveText(
      'Hay historias que no caben en un currículum.'
    );
    await expect(page.locator('.cortina-indice-pregunta')).toHaveCount(8);
    await expect(page.locator('.cortina-indice-pregunta').last()).toContainText('futuro');
  });
});
