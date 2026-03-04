import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import GamePage from '../pages/GamePage'
import { team, makeSession } from './fixtures'

function renderGame(overrides = {}) {
  const session = makeSession({ completed: false, ...overrides })
  const onUpdate = vi.fn()
  const onEnd = vi.fn()
  render(<GamePage team={team} session={session} onUpdate={onUpdate} onEnd={onEnd} />)
  return { session, onUpdate, onEnd }
}

describe('GamePage', () => {
  it('shows team name, score and opponent', () => {
    renderGame({ ourScore: 3, theirScore: 2, opponent: 'Chain Lightning' })
    expect(screen.getByText('Furious George')).toBeInTheDocument()
    expect(screen.getByText('3 – 2')).toBeInTheDocument()
    expect(screen.getByText('Chain Lightning')).toBeInTheDocument()
  })

  it('renders all players from the roster', () => {
    renderGame()
    expect(screen.getByText('Marie')).toBeInTheDocument()
    expect(screen.getByText('Mark')).toBeInTheDocument()
    expect(screen.getByText('Sarah')).toBeInTheDocument()
  })

  it('shows flash message when action tapped without selecting a player', async () => {
    const user = userEvent.setup()
    renderGame()
    await user.click(screen.getByRole('button', { name: 'Pass' }))
    expect(screen.getByText('Select a player first')).toBeInTheDocument()
  })

  it('logs event when player then action are tapped', async () => {
    const user = userEvent.setup()
    const { onUpdate } = renderGame()
    await user.click(screen.getByRole('button', { name: /Marie/ }))
    await user.click(screen.getByRole('button', { name: 'Catch' }))
    expect(onUpdate).toHaveBeenCalledOnce()
    const updatedSession = onUpdate.mock.calls[0][0]
    expect(updatedSession.events).toHaveLength(1)
    expect(updatedSession.events[0].type).toBe('catch')
    expect(updatedSession.events[0].playerId).toBe('p1')
  })

  it('increments our score when We Scored is tapped', async () => {
    const user = userEvent.setup()
    const { onUpdate } = renderGame({ ourScore: 2 })
    await user.click(screen.getByRole('button', { name: '✓ We Scored' }))
    expect(onUpdate.mock.calls[0][0].ourScore).toBe(3)
  })

  it('increments their score when They Scored is tapped', async () => {
    const user = userEvent.setup()
    const { onUpdate } = renderGame({ theirScore: 1 })
    await user.click(screen.getByRole('button', { name: 'They Scored' }))
    expect(onUpdate.mock.calls[0][0].theirScore).toBe(2)
  })

  it('removes last event when Undo is tapped', async () => {
    const user = userEvent.setup()
    const { onUpdate } = renderGame({
      events: [
        { id: 'e1', playerId: 'p1', type: 'catch', pointNumber: 1, timestamp: 1 },
        { id: 'e2', playerId: 'p2', type: 'pass',  pointNumber: 1, timestamp: 2 },
      ],
    })
    await user.click(screen.getByRole('button', { name: 'Undo' }))
    expect(onUpdate.mock.calls[0][0].events).toHaveLength(1)
  })

  it('calls onEnd when End Game is tapped', async () => {
    const user = userEvent.setup()
    const { onEnd } = renderGame()
    await user.click(screen.getByRole('button', { name: 'End Game' }))
    expect(onEnd).toHaveBeenCalledOnce()
  })
})
