import type { Team, Session } from '../types'

export const team: Team = {
  id: 'team-1',
  name: 'Furious George',
  players: [
    { id: 'p1', name: 'Marie',  number: '7' },
    { id: 'p2', name: 'Mark',   number: '11' },
    { id: 'p3', name: 'Sarah',  number: '4' },
  ],
}

export function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    id: 'session-1',
    teamId: 'team-1',
    opponent: 'Chain Lightning',
    date: '2026-03-01',
    startedAt: Date.now(),
    ourScore: 0,
    theirScore: 0,
    events: [],
    completed: true,
    ...overrides,
  }
}
