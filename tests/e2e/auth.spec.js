import { test, expect } from '@playwright/test'
import { loginAs, logout } from './helpers/auth.js'

test.describe('Авторизация', () => {
  test('страница входа показывает бренд Tea', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('Tea', { exact: true })).toBeVisible()
    await expect(page.getByText('Введите логин и пароль для входа в систему')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Войти' })).toBeVisible()
  })

  test('admin / 1234 — успешный вход', async ({ page }) => {
    await loginAs(page, { username: 'admin', password: '1234' })
    await expect(page.getByRole('button', { name: 'A', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Новый заказ' })).toBeVisible()
  })

  test('неверный пароль — ошибка на экране', async ({ page }) => {
    await page.goto('/')
    await page.getByPlaceholder('Логин').fill('admin')
    await page.getByPlaceholder('Пароль').fill('wrong-password')
    await page.getByRole('button', { name: 'Войти' }).click()
    await expect(page.locator('.notification-message')).toHaveText('Неверный логин или пароль')
  })

  test('выход возвращает на страницу входа', async ({ page }) => {
    await loginAs(page, { username: 'admin', password: '1234' })
    await logout(page)
    await expect(page.getByPlaceholder('Логин')).toBeVisible()
  })
})

test.describe('API login', () => {
  test('POST /api/auth/login admin возвращает 200', async ({ request }) => {
    const res = await request.post('/api/auth/login', {
      data: { username: 'admin', password: '1234' }
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.accessToken).toBeTruthy()
    expect(body.user.username).toBe('admin')
    expect(body.user.role).toBe('admin')
  })

  test('POST /api/auth/login с неверным паролем — 401', async ({ request }) => {
    const res = await request.post('/api/auth/login', {
      data: { username: 'admin', password: '0000' }
    })
    expect(res.status()).toBe(401)
  })
})
