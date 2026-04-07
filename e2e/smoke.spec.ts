import { test, expect } from '@playwright/test';

test.describe('smoke', () => {
  test('home carga el hero #intro', async ({ page }) => {
    const res = await page.goto('/', { waitUntil: 'load' });
    expect(res?.ok()).toBeTruthy();
    await expect(page.locator('#main-content')).toBeVisible();
    await expect(page.locator('#intro')).toBeVisible({ timeout: 30_000 });
  });

  test('mapa monta el shell sin error de página', async ({ page }) => {
    const res = await page.goto('/mapa', { waitUntil: 'load' });
    expect(res?.ok()).toBeTruthy();
    await expect(page.locator('[data-map-route="mapa-full"]')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText('Algo salió mal en el mapa')).toHaveCount(0);
    // MapFullPage es dinámico (SSR off): shell interno o canvas del globo.
    const inner = page.locator('[data-build="mapa-v1"]');
    const globeCanvas = page.locator('[data-map-route="mapa-full"] canvas').first();
    // .or() puede resolver a varios nodos; .first() evita violación de strict mode.
    await expect(inner.or(globeCanvas).first()).toBeVisible({ timeout: 120_000 });
  });

  test('/historias/videos muestra el carrusel de historias', async ({ page }) => {
    const res = await page.goto('/historias/videos', { waitUntil: 'domcontentloaded' });
    expect(res?.ok()).toBeTruthy();
    const carousel = page.locator('#historias-carrusel');
    await expect(carousel).toBeVisible({ timeout: 60_000 });
    await expect(carousel).toHaveAttribute('aria-label', 'Carrusel de historias');
    // Título de exposición o estado vacío (API/demo); ambos cuentan como “algo visible”.
    await expect(
      page.getByText(/historias en video|No hay historias para mostrar en este formato/i)
    ).toBeVisible({ timeout: 60_000 });
  });
});
