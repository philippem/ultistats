export interface Player {
  id: string
  name: string
  number?: string
}

export interface Team {
  id: string
  name: string
  players: Player[]
}

export type EventType = 'pass' | 'catch' | 'drop' | 'D' | 'goal' | 'assist' | 'throwaway'

export const EVENT_LABELS: Record<EventType, string> = {
  pass: 'Pass',
  catch: 'Catch',
  drop: 'Drop',
  D: 'D',
  goal: 'Goal',
  assist: 'Assist',
  throwaway: 'Throwaway',
}

export interface GameEvent {
  id: string
  playerId: string
  type: EventType
  pointNumber: number
  timestamp: number
}

export interface PointInfo {
  pointNumber: number
  side: 'O' | 'D'
  lineup: string[]     // player IDs on the field
  scoredBy: 'us' | 'them'
}

export interface Session {
  id: string
  teamId: string
  opponent: string
  date: string
  startedAt: number
  ourScore: number
  theirScore: number
  events: GameEvent[]
  points: PointInfo[]
  completed: boolean
}

export interface AppState {
  team: Team | null
  sessions: Session[]
  activeSessionId: string | null
}
