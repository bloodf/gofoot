import { test, expect } from '@playwright/test'

async function seedToken(page: import('@playwright/test').Page, token: string) {
  await page.goto('/session')
  await page.evaluate(async (t) => {
    await new Promise<void>((resolve, reject) => {
      const open = indexedDB.open('keyval-store', 1)
      open.onupgradeneeded = () => {
        if (!open.result.objectStoreNames.contains('keyval')) {
          open.result.createObjectStore('keyval')
        }
      }
      open.onsuccess = () => {
        const tx = open.result.transaction('keyval', 'readwrite')
        tx.objectStore('keyval').put(t, 'gofoot.sessionToken')
        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error)
      }
      open.onerror = () => reject(open.error)
    })
  }, token)
}

test.describe('career mobile', () => {
  test('club and career screens load', async ({ page, request }) => {
    test.setTimeout(90_000)
    await page.setViewportSize({ width: 390, height: 844 })
    const res = await request.post('/api/session/create')
    const { token } = (await res.json()) as { token: string }
    await seedToken(page, token)

    await page.goto('/club')
    await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 60_000 })

    await page.goto('/career')
    await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 30_000 })

    await page.goto('/fantasy')
    await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 30_000 })
  })
})
