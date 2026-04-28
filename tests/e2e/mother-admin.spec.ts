import { expect, test } from '@playwright/test'

const motherScreens = [
  'Timeline',
  'Check-in',
  'RIFQA AI',
  'Support',
  'Postpartum',
  'Partner',
  'Notifications',
  'Privacy',
  'Growth',
]

test.describe('mother app flows', () => {
  test('LTR home flow keeps CTA arrow pointing right and captures visual baseline', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'EN' }).click()
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    await expect(page.getByRole('heading', { name: /Welcome back/i })).toBeVisible()

    const cta = page.locator('.action-banner')
    await expect(cta).toContainText('Complete your daily check-in')
    await expect(cta.locator('.material-symbols-outlined')).toHaveText('arrow_forward')
    await expect(page).toHaveScreenshot('home-ltr-mobile.png', { fullPage: true })
  })

  test('RTL home visual baseline and Arabic direction', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('.app-shell')).toHaveAttribute('dir', 'rtl')
    await expect(page.locator('.action-banner .material-symbols-outlined')).toHaveText('arrow_back')
    await expect(page).toHaveScreenshot('home-rtl-mobile.png', { fullPage: true })
  })

  test('mobile viewport can reach core mother screens', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'EN' }).click()

    for (const screen of motherScreens) {
      await page.getByRole('button', { name: screen }).first().click()
      await expect(page.locator('.screen-content')).toBeVisible()
      await expect(page.locator('.screen-content')).toHaveScreenshot(`screen-${screen.toLowerCase().replace(/\s+/g, '-')}-mobile.png`)
      await page.locator('.bottom-nav').getByRole('button', { name: 'Home' }).click()
    }
  })

  test('check-in safety scenario routes urgent symptoms to safety guidance', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'EN' }).click()
    await page.getByRole('button', { name: 'Check-in' }).first().click()
    await page.getByRole('button', { name: 'Drained' }).click()
    await page.getByRole('button', { name: 'reduced movement' }).click()
    await page.getByRole('button', { name: 'bleeding' }).click()
    await page.getByRole('button', { name: /Save check-in/i }).click()
    await expect(page.locator('.screen-content')).toContainText(/urgent|emergency|care|Safety recommendation|Care navigator/i)
  })

  test('privacy export and delete controls are available from Privacy Center', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'EN' }).click()
    await page.getByRole('button', { name: 'Privacy' }).first().click()
    await expect(page.getByRole('button', { name: /Request export/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Request deletion/i })).toBeVisible()
    await expect(page.getByText(/Employer and insurer firewall/i)).toBeVisible()
  })
})

test.describe('admin app flow', () => {
  test('admin route shows private governance gate', async ({ page }) => {
    await page.goto('/admin')
    await expect(page.getByRole('heading', { name: /Content Approval And Governance|اعتماد المحتوى والحوكمة/i })).toBeVisible()
    await expect(page.locator('.screen-content')).toHaveScreenshot('admin-gate-mobile.png')
  })
})
