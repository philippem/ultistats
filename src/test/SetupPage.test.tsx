import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SetupPage from '../pages/SetupPage'

describe('SetupPage', () => {
  it('renders create team heading', () => {
    render(<SetupPage onComplete={vi.fn()} />)
    expect(screen.getByText('Create Your Team')).toBeInTheDocument()
  })

  it('disables submit when team name or players are missing', () => {
    render(<SetupPage onComplete={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Create Team' })).toBeDisabled()
  })

  it('adds a player to the list', async () => {
    const user = userEvent.setup()
    render(<SetupPage onComplete={vi.fn()} />)
    await user.type(screen.getByPlaceholderText('Player name'), 'Marie')
    await user.click(screen.getByRole('button', { name: 'Add' }))
    expect(screen.getByText('Marie')).toBeInTheDocument()
  })

  it('removes a player when ✕ is clicked', async () => {
    const user = userEvent.setup()
    render(<SetupPage onComplete={vi.fn()} />)
    await user.type(screen.getByPlaceholderText('Player name'), 'Marie')
    await user.click(screen.getByRole('button', { name: 'Add' }))
    await user.click(screen.getByRole('button', { name: '✕' }))
    expect(screen.queryByText('Marie')).not.toBeInTheDocument()
  })

  it('calls onComplete with team name and players', async () => {
    const user = userEvent.setup()
    const onComplete = vi.fn()
    render(<SetupPage onComplete={onComplete} />)

    await user.type(screen.getByPlaceholderText("e.g. Furious George"), 'Renegades')
    await user.type(screen.getByPlaceholderText('Player name'), 'Marie')
    await user.click(screen.getByRole('button', { name: 'Add' }))
    await user.click(screen.getByRole('button', { name: 'Create Team' }))

    expect(onComplete).toHaveBeenCalledOnce()
    expect(onComplete.mock.calls[0][0].name).toBe('Renegades')
    expect(onComplete.mock.calls[0][0].players[0].name).toBe('Marie')
  })
})
