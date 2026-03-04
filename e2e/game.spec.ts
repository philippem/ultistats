import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
})

test('create team and start tracking a game', async ({ page }) => {
  // Setup: create team
  await expect(page.getByText('Create Your Team')).toBeVisible()
  await page.getByPlaceholder('e.g. Furious George').fill('Renegades')
  await page.getByPlaceholder('Player name').fill('Marie')
  await page.getByRole('button', { name: 'Add' }).click()
  await page.getByPlaceholder('Player name').fill('Mark')
  await page.getByRole('button', { name: 'Add' }).click()
  await page.getByRole('button', { name: 'Create Team' }).click()

  // Home screen
  await expect(page.getByText('Renegades')).toBeVisible()
  await expect(page.getByText('2 players')).toBeVisible()

  // Start a game
  await page.getByPlaceholder('Opponent team name').fill('Chain Lightning')
  await page.getByRole('button', { name: 'Start Game' }).click()

  // Game screen
  await expect(page.getByText('Renegades')).toBeVisible()
  await expect(page.getByText('Chain Lightning')).toBeVisible()
  await expect(page.getByText('0 – 0')).toBeVisible()

  // Log some events
  await page.getByRole('button', { name: 'Marie' }).click()
  await page.getByRole('button', { name: 'Catch' }).click()
  await page.getByRole('button', { name: 'Marie' }).click()
  await page.getByRole('button', { name: 'Pass' }).click()
  await page.getByRole('button', { name: 'Mark' }).click()
  await page.getByRole('button', { name: 'Goal' }).click()

  // Score a point
  await page.getByRole('button', { name: '✓ We Scored' }).click()
  await expect(page.getByText('1 – 0')).toBeVisible()
  await expect(page.getByText('Pt 2')).toBeVisible()
})

test('shows flash message when action tapped without player selected', async ({ page }) => {
  // Quick setup
  await page.getByPlaceholder('e.g. Furious George').fill('Test Team')
  await page.getByPlaceholder('Player name').fill('Marie')
  await page.getByRole('button', { name: 'Add' }).click()
  await page.getByRole('button', { name: 'Create Team' }).click()
  await page.getByPlaceholder('Opponent team name').fill('Rival')
  await page.getByRole('button', { name: 'Start Game' }).click()

  await page.getByRole('button', { name: 'Drop' }).click()
  await expect(page.getByText('Select a player first')).toBeVisible()
})

test('undo removes the last event', async ({ page }) => {
  await page.getByPlaceholder('e.g. Furious George').fill('Test Team')
  await page.getByPlaceholder('Player name').fill('Marie')
  await page.getByRole('button', { name: 'Add' }).click()
  await page.getByRole('button', { name: 'Create Team' }).click()
  await page.getByPlaceholder('Opponent team name').fill('Rival')
  await page.getByRole('button', { name: 'Start Game' }).click()

  await page.getByRole('button', { name: 'Marie' }).click()
  await page.getByRole('button', { name: 'Pass' }).click()
  await expect(page.getByText('Marie · Pass')).toBeVisible()

  await page.getByRole('button', { name: 'Undo' }).click()
  await expect(page.getByText('Marie · Pass')).not.toBeVisible()
})

test('end game saves to history and shows on home screen', async ({ page }) => {
  await page.getByPlaceholder('e.g. Furious George').fill('Renegades')
  await page.getByPlaceholder('Player name').fill('Marie')
  await page.getByRole('button', { name: 'Add' }).click()
  await page.getByRole('button', { name: 'Create Team' }).click()
  await page.getByPlaceholder('Opponent team name').fill('Chain Lightning')
  await page.getByRole('button', { name: 'Start Game' }).click()

  await page.getByRole('button', { name: 'End Game' }).click()

  await expect(page.getByText('Recent Games')).toBeVisible()
  await expect(page.getByText('Chain Lightning')).toBeVisible()
})
