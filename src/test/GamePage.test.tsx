import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import GamePage from '../pages/GamePage'
import { team, makeSession } from './fixtures'

function renderGame(overrides = {}) {
  const session = makeSession({ completed: false, ...overrides })
  const onUpdate = vi.fn()
  const onEnd = vi.fn()
  const onStats = vi.fn()
  render(<GamePage team={team} session={session} onUpdate={onUpdate} onEnd={onEnd} onStats={onStats} />)
  return { session, onUpdate, onEnd, onStats }
}

// Selects players and starts the point from the lineup phase
async function startPoint(user: ReturnType<typeof userEvent.setup>, playerNames: string[] = ['Marie']) {
  for (const name of playerNames) {
    await user.click(screen.getByRole('button', { name: new RegExp(name) }))
  }
  await user.click(screen.getByRole('button', { name: 'Start Point' }))
}

describe('GamePage — lineup phase', () => {
  it('starts in lineup phase', () => {
    renderGame()
    expect(screen.getByRole('button', { name: 'Start Point' })).toBeInTheDocument()
  })

  it('shows O and D toggle buttons', () => {
    renderGame()
    expect(screen.getByRole('button', { name: 'O — Offense' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'D — Defense' })).toBeInTheDocument()
  })

  it('Start Point is disabled until a player is selected', () => {
    renderGame()
    expect(screen.getByRole('button', { name: 'Start Point' })).toBeDisabled()
  })

  it('Start Point enables after selecting a player', async () => {
    const user = userEvent.setup()
    renderGame()
    await user.click(screen.getByRole('button', { name: /Marie/ }))
    expect(screen.getByRole('button', { name: 'Start Point' })).not.toBeDisabled()
  })

  it('shows all players in lineup grid', () => {
    renderGame()
    expect(screen.getByText('Marie')).toBeInTheDocument()
    expect(screen.getByText('Mark')).toBeInTheDocument()
    expect(screen.getByText('Sarah')).toBeInTheDocument()
  })
})

describe('GamePage — playing phase', () => {
  it('transitions to playing phase after Start Point', async () => {
    const user = userEvent.setup()
    renderGame()
    await startPoint(user)
    expect(screen.queryByRole('button', { name: 'Start Point' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Pass' })).toBeInTheDocument()
  })

  it('shows team name, score and opponent', async () => {
    const user = userEvent.setup()
    renderGame({ ourScore: 3, theirScore: 2, opponent: 'Chain Lightning' })
    await startPoint(user)
    expect(screen.getByText('Furious George')).toBeInTheDocument()
    expect(screen.getByText('3 – 2')).toBeInTheDocument()
    expect(screen.getByText('Chain Lightning')).toBeInTheDocument()
  })

  it('only shows lineup players in the player grid', async () => {
    const user = userEvent.setup()
    renderGame()
    await startPoint(user, ['Marie']) // only Marie on line
    expect(screen.getByText('Marie')).toBeInTheDocument()
    expect(screen.queryByText('Mark')).not.toBeInTheDocument()
  })

  it('shows flash message when action tapped without selecting a player', async () => {
    const user = userEvent.setup()
    renderGame()
    await startPoint(user)
    await user.click(screen.getByRole('button', { name: 'Pass' }))
    expect(screen.getByText('Select a player first')).toBeInTheDocument()
  })

  it('logs event when player then action are tapped', async () => {
    const user = userEvent.setup()
    const { onUpdate } = renderGame()
    await startPoint(user, ['Marie'])
    await user.click(screen.getByRole('button', { name: /Marie/ }))
    await user.click(screen.getByRole('button', { name: 'Catch' }))
    expect(onUpdate).toHaveBeenCalledOnce()
    const updated = onUpdate.mock.calls[0][0]
    expect(updated.events[0].type).toBe('catch')
    expect(updated.events[0].playerId).toBe('p1')
  })

  it('increments our score and records point info when We Scored', async () => {
    const user = userEvent.setup()
    const { onUpdate } = renderGame({ ourScore: 2 })
    await startPoint(user, ['Marie'])
    await user.click(screen.getByRole('button', { name: '✓ We Scored' }))
    const updated = onUpdate.mock.calls[0][0]
    expect(updated.ourScore).toBe(3)
    expect(updated.points).toHaveLength(1)
    expect(updated.points[0].scoredBy).toBe('us')
    expect(updated.points[0].side).toBe('O')
    expect(updated.points[0].lineup).toContain('p1')
  })

  it('increments their score when They Scored', async () => {
    const user = userEvent.setup()
    const { onUpdate } = renderGame({ theirScore: 1 })
    await startPoint(user)
    await user.click(screen.getByRole('button', { name: 'They Scored' }))
    expect(onUpdate.mock.calls[0][0].theirScore).toBe(2)
  })

  it('auto-suggests D after we score', async () => {
    const user = userEvent.setup()
    renderGame()
    await startPoint(user)
    await user.click(screen.getByRole('button', { name: '✓ We Scored' }))
    // back in lineup phase — D button should be active
    expect(screen.getByRole('button', { name: 'D — Defense' })).toBeInTheDocument()
  })

  it('removes last event when Undo is tapped', async () => {
    const user = userEvent.setup()
    const { onUpdate } = renderGame({
      events: [
        { id: 'e1', playerId: 'p1', type: 'catch', pointNumber: 1, timestamp: 1 },
        { id: 'e2', playerId: 'p2', type: 'pass',  pointNumber: 1, timestamp: 2 },
      ],
    })
    await startPoint(user)
    await user.click(screen.getByRole('button', { name: 'Undo' }))
    expect(onUpdate.mock.calls[0][0].events).toHaveLength(1)
  })

  it('calls onEnd when End Game is tapped', async () => {
    const user = userEvent.setup()
    const { onEnd } = renderGame()
    await user.click(screen.getByRole('button', { name: 'End Game' }))
    expect(onEnd).toHaveBeenCalledOnce()
  })

  it('calls onStats when Stats is tapped', async () => {
    const user = userEvent.setup()
    const { onStats } = renderGame()
    await user.click(screen.getByRole('button', { name: 'Stats' }))
    expect(onStats).toHaveBeenCalledOnce()
  })

  it('auto-logs a catch before pass when a new player is selected on O', async () => {
    const user = userEvent.setup()
    const { onUpdate } = renderGame()
    await startPoint(user, ['Marie', 'Mark'])
    // Marie catches explicitly (sets discHolder to Marie)
    await user.click(screen.getByRole('button', { name: /Marie/ }))
    await user.click(screen.getByRole('button', { name: 'Catch' }))
    // Mark passes — the last onUpdate call should include implicit catch + pass for Mark
    await user.click(screen.getByRole('button', { name: /Mark/ }))
    await user.click(screen.getByRole('button', { name: 'Pass' }))
    const lastCall = onUpdate.mock.calls.at(-1)![0]
    const markEvents = lastCall.events.filter((e: { playerId: string }) => e.playerId === 'p2')
    expect(markEvents[0].type).toBe('catch')
    expect(markEvents[1].type).toBe('pass')
  })

  it('does not auto-log catch when the same player passes again', async () => {
    const user = userEvent.setup()
    const { onUpdate } = renderGame()
    await startPoint(user, ['Marie'])
    await user.click(screen.getByRole('button', { name: /Marie/ }))
    await user.click(screen.getByRole('button', { name: 'Catch' }))
    // Marie passes — she already has the disc, no implicit catch
    await user.click(screen.getByRole('button', { name: 'Pass' }))
    // Last onUpdate call should have exactly 1 new event (pass), no implicit catch
    const lastCall = onUpdate.mock.calls.at(-1)![0]
    expect(lastCall.events).toHaveLength(1)
    expect(lastCall.events[0].type).toBe('pass')
    expect(lastCall.events[0].playerId).toBe('p1')
  })
})
