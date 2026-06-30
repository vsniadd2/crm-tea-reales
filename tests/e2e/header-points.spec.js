import { test, expect } from '@playwright/test'
import { loginAs } from './helpers/auth.js'

test.describe('Бейдж и точки в шапке', () => {
  test('admin — бейдж A и выбор точки', async ({ page }) => {
    await loginAs(page, { username: 'admin', password: '1234' })

    const badge = page.getByRole('button', { name: 'A', exact: true })
    await expect(badge).toBeVisible()
    await expect(badge).toHaveClass(/header-point-btn--selectable/)

    await badge.click()
    await expect(page.getByRole('button', { name: /Палаца/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /Червенский/ })).toBeVisible()

    await page.getByRole('button', { name: /Палаца/ }).click()
    await expect(badge).toHaveAttribute('title', /Палаца/)
  })

  test('Sotrudnik567 — бейдж 567 без выбора точки', async ({ page }) => {
    await loginAs(page, { username: 'Sotrudnik567', password: '2947' })

    const badge = page.getByRole('button', { name: '567', exact: true })
    await expect(badge).toBeVisible()
    await expect(badge).not.toHaveClass(/header-point-btn--selectable/)
  })

  test('Sotrudnik947 — бейдж 947 (Палаца)', async ({ page }) => {
    await loginAs(page, { username: 'Sotrudnik947', password: '7394' })
    await expect(page.getByRole('button', { name: '947', exact: true })).toBeVisible()
  })

  test('Sotrudnik855 — бейдж 855 и выбор точки как у admin', async ({ page }) => {
    await loginAs(page, { username: 'Sotrudnik855', password: '4821' })

    const badge = page.getByRole('button', { name: '855', exact: true })
    await expect(badge).toBeVisible()
    await expect(badge).toHaveClass(/header-point-btn--selectable/)
    await badge.click()
    await expect(page.getByRole('button', { name: /Червенский/ })).toBeVisible()
  })
})
