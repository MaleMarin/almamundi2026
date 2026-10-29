import { test, expect } from '@playwright/test';

test.describe('smoke', () => {
  test('home carga el hero #intro', async ({ page }) => {
    const res = await page.goto('/', { waitUntil: 'load' });
    expect(res?.ok()).toBeTruthy();
    await expect(page.locator('#main-content')).toBeVisible();
    await expect(page.locator('#intro')).toBeVisible({ timeout: 30_000 });
  });

  test('/mapa redirige al mapa de la home (#mapa)', async ({ page }) => {
    const res = await page.goto('/mapa', { waitUntil: 'load' });
    expect(res?.ok()).toBeTruthy();
    await expect(page).toHaveURL(/\/(\?section=mapa|#mapa)?$/, { timeout: 30_000 });
    await expect(page.locator('#mapa')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByRole('heading', { name: /el alma del mundo/i })).toBeVisible({
      timeout: 60_000,
    });
  });

  test('/historias muestra las pestañas del listado', async ({ page }) => {
    const res = await page.goto('/historias', { waitUntil: 'domcontentloaded' });
    expect(res?.ok()).toBeTruthy();
    await expect(page.getByRole('tab', { name: 'Todas' })).toBeVisible({ timeout: 60_000 });
    await expect(page.getByRole('tab', { name: 'Video' })).toBeVisible();
  });
});
