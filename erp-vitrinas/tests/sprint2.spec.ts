import { test, expect } from '@playwright/test'

test.describe('Sprint 2 — Vitrinas', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[name="email"]', 'admin@erp.local')
    await page.fill('input[name="password"]', 'Admin1234!')
    await page.click('button[type="submit"]')
    await page.waitForURL('/admin/dashboard')
  })

  test('navega a listado de vitrinas', async ({ page }) => {
    await page.goto('/admin/vitrinas')
    await expect(page.getByRole('heading', { name: 'Vitrinas' })).toBeVisible()
  })
})
