import { describe, it, expect, beforeEach } from 'vitest'
import { load, save } from '../lib/storage'
import type { AppState } from '../types'

const state: AppState = {
  team: {
    id: 'team-1',
    name: 'Furious George',
    players: [{ id: 'p1', name: 'Marie', number: '7' }],
  },
  sessions: [],
  activeSessionId: null,
}

beforeEach(() => localStorage.clear())

describe('storage', () => {
  it('load returns empty state when nothing saved', () => {
    const result = load()
    expect(result.team).toBeNull()
    expect(result.sessions).toEqual([])
    expect(result.activeSessionId).toBeNull()
  })

  it('save and load round-trips correctly', () => {
    save(state)
    const result = load()
    expect(result.team?.name).toBe('Furious George')
    expect(result.team?.players).toHaveLength(1)
  })

  it('load returns empty state when localStorage has invalid JSON', () => {
    localStorage.setItem('ultistats_v1', 'not-json')
    const result = load()
    expect(result.team).toBeNull()
  })

  it('overwrites previous save', () => {
    save(state)
    save({ ...state, team: { ...state.team!, name: 'Renegades' } })
    expect(load().team?.name).toBe('Renegades')
  })
})
