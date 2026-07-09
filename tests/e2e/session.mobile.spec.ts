import { test, expect } from '@playwright/test'

test.describe('session mobile', () => {
  test('create CTA is visible and ≥ 44px on 390×844', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/session')

    const create = page.getByTestId('session-create')
    await expect(create).toBeVisible()

    const box = await create.boundingBox()
    expect(box).toBeTruthy()
    expect(box!.height).toBeGreaterThanOrEqual(44)
    expect(box!.width).toBeGreaterThanOrEqual(44)

    await expect(page.getByTestId('session-continue')).toBeVisible()
  })
})
