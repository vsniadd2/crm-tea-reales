import { test, expect } from '@playwright/test'
import { loginAs } from './helpers/auth.js'

test.describe('Навигация admin', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, { username: 'admin', password: '1234' })
  })

  test('новый заказ — страница загружается', async ({ page }) => {
    await page.getByRole('button', { name: 'Новый заказ' }).click()
    await expect(page.getByRole('heading', { name: 'Новый заказ' })).toBeVisible()
  })

  test('клиенты — страница загружается', async ({ page }) => {
    await page.getByRole('button', { name: 'Клиенты' }).click()
    await expect(page.getByRole('heading', { name: 'Список клиентов' })).toBeVisible()
  })

  test('история — страница загружается', async ({ page }) => {
    await page.getByRole('button', { name: 'История' }).click()
    await expect(page.getByRole('heading', { name: 'История покупок' })).toBeVisible()
  })

  test('графики — страница загружается', async ({ page }) => {
    await page.getByRole('button', { name: 'Графики' }).click()
    await expect(page.getByRole('heading', { name: 'Графики' })).toBeVisible()
  })

  test('категории — доступны только admin', async ({ page }) => {
    await page.getByRole('button', { name: 'Категории и товары' }).click()
    await expect(page.getByRole('heading', { name: 'Категории и товары' })).toBeVisible()
  })
})
