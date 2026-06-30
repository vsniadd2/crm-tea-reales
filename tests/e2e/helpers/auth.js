/**
 * @param {import('@playwright/test').Page} page
 * @param {{ username: string, password: string }} credentials
 */
export async function loginAs(page, { username, password }) {
  await page.goto('/')
  await page.getByPlaceholder('Логин').fill(username)
  await page.getByPlaceholder('Пароль').fill(password)
  await page.getByRole('button', { name: 'Войти' }).click()
  await page.getByRole('heading', { name: 'Tea CRM' }).waitFor({ state: 'visible' })
}

/**
 * @param {import('@playwright/test').Page} page
 */
export async function logout(page) {
  await page.locator('.header-point-btn').click()
  await page.locator('.header-point-dropdown .header-point-logout').click()
  await page.getByPlaceholder('Логин').waitFor({ state: 'visible' })
}
