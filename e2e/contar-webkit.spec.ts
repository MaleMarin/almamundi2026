import { test, expect } from '@playwright/test';

test.describe('contar en WebKit 390×844', () => {
  test('abre /contar/texto, guarda borrador y llega a datos', async ({ page }) => {
    await page.goto('/contar/texto', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveTitle(/Escribe lo que no le contaste a nadie/i);
    await expect(page.getByText('Paso 1 de 2')).toBeVisible({ timeout: 30_000 });
    const story = page.getByRole('textbox', { name: 'Historia' });
    await expect(story).toBeVisible();
    await story.fill('Había una plaza en Ñuñoa donde mi abuela reía.');
    await page.getByRole('button', { name: 'Continuar' }).click();
    await expect(page.getByText('Paso 2 de 2')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Los campos con * son obligatorios.')).toBeVisible();
    await page.getByRole('button', { name: 'Volver' }).click();
    await expect(story).toHaveValue(/Ñuñoa/);
  });
});
