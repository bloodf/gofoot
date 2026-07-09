import { test, expect } from '@playwright/test'

test.describe('hub flow mobile', () => {
  test('token in IndexedDB loads hub', async ({ page, request }) => {
    test.setTimeout(120_000)
    await page.setViewportSize({ width: 390, height: 844 })

    const res = await request.post('/api/session/create')
    expect(res.ok(), await res.text()).toBeTruthy()
    const body = (await res.json()) as { token: string }
    expect(body.token.length).toBeGreaterThan(20)

    // Warm resume path
    const resume = await request.post('/api/session/resume', {
      data: { token: body.token },
    })
    expect(resume.ok(), await resume.text()).toBeTruthy()

    // Seed client token store (idb-keyval defaults)
    await page.goto('/session')
    await page.evaluate(async (token) => {
      await new Promise<void>((resolve, reject) => {
        const open = indexedDB.open('keyval-store', 1)
        open.onupgradeneeded = () => {
          const db = open.result
          if (!db.objectStoreNames.contains('keyval')) {
            db.createObjectStore('keyval')
          }
        }
        open.onsuccess = () => {
          const db = open.result
          const tx = db.transaction('keyval', 'readwrite')
          tx.objectStore('keyval').put(token, 'gofoot.sessionToken')
          tx.oncomplete = () => resolve()
          tx.onerror = () => reject(tx.error)
        }
        open.onerror = () => reject(open.error)
      })
    }, body.token)

    await page.goto('/')
    await expect(page).toHaveURL('/', { timeout: 15_000 })
    await expect(page.getByRole('heading', { name: /Hub/i })).toBeVisible({ timeout: 90_000 })
  })
})
