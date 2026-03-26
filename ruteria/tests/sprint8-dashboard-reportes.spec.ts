import { expect, test, type Page } from '@playwright/test'

async function loginAdmin(page: Page) {
  await page.goto('/login')
  await page.getByLabel(/correo/i).fill('admin@erp.local')
  await page.getByLabel(/contraseña/i).fill('Admin1234!')
  await page.getByRole('button', { name: /iniciar sesión/i }).click()
  await page.waitForURL('/admin/dashboard')
}

test.beforeEach(async ({ page }) => {
  await loginAdmin(page)
})

test.describe('Sprint 8 - Dashboard', () => {
  test('carga KPIs y tabs principales', async ({ page }) => {
    await page.goto('/admin/dashboard')

    await expect(page.getByRole('heading', { name: /operación comercial/i })).toBeVisible()
    await expect(page.getByText('Ventas Hoy', { exact: true })).toBeVisible()
    await expect(page.getByText('Cobros del Mes', { exact: true })).toBeVisible()
    await expect(page.getByRole('main').getByText('Visitas', { exact: true })).toBeVisible()
    await expect(page.getByText('Incidencias Abiertas', { exact: true })).toBeVisible()
    await expect(page.getByText(/incidencias recientes/i)).toBeVisible()

    await page.getByRole('tab', { name: /tendencias/i }).click()
    await expect(page.getByRole('tab', { name: /tendencias/i })).toHaveAttribute('data-state', 'active')
    await expect(page.getByText(/ritmo reciente de la operación/i)).toBeVisible()

    await page.getByRole('tab', { name: /vitrinas/i }).click()
    await expect(page.getByRole('tab', { name: /vitrinas/i })).toHaveAttribute('data-state', 'active')
    await expect(page.getByText(/top vitrinas/i)).toBeVisible()
  })
})

test.describe('Sprint 8 - Reportes', () => {
  test('carga la página y permite navegar tabs', async ({ page }) => {
    await page.goto('/admin/reportes')

    await expect(page.getByRole('heading', { name: /consultas y exportaciones/i })).toBeVisible()
    await expect(page.getByRole('tab', { name: /ventas/i })).toBeVisible()

    await page.getByRole('tab', { name: /ranking vitrinas/i }).click()
    await expect(page.getByRole('tab', { name: /ranking vitrinas/i })).toHaveAttribute('data-state', 'active')
    await expect(page.getByText(/lectura comparativa/i)).toBeVisible()

    await page.getByRole('tab', { name: /inventario/i }).click()
    await expect(page.getByRole('tab', { name: /inventario/i })).toHaveAttribute('data-state', 'active')
    await expect(page.getByText(/snapshot valorizado/i)).toBeVisible()
  })

  test('reporte de ventas busca y exporta cuando hay datos', async ({ page }) => {
    await page.goto('/admin/reportes')

    await page.getByRole('button', { name: /^buscar$/i }).first().click()
    await page.waitForTimeout(800)

    const exportButton = page.getByRole('button', { name: /exportar \.xlsx/i }).first()
    if (await exportButton.isVisible()) {
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        exportButton.click(),
      ])

      expect(download.suggestedFilename()).toContain('.xlsx')
    }
  })

  test('reporte de incidencias y garantías muestra filtros y tabla', async ({ page }) => {
    await page.goto('/admin/reportes')
    await page.getByRole('tab', { name: /incidencias \/ garantías/i }).click()

    await expect(page.getByText(/cruza incidencias y garantías para medir presión operativa/i)).toBeVisible()
    await page.getByRole('button', { name: /^buscar$/i }).first().click()
    await page.waitForTimeout(800)

    await expect(page.getByRole('columnheader', { name: /tipo/i })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: /pdv/i })).toBeVisible()
  })
})
