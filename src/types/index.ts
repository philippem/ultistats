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

export type EventType =
  | 'pass' | 'catch' | 'throwaway' | 'drop' | 'goal' | 'assist'
  | 'hand_block' | 'interception' | 'layout_d' | 'unforced_turnover'

export const EVENT_LABELS: Record<EventType, string> = {
  pass: 'Pass',
  catch: 'Catch',
  throwaway: 'Throwaway',
  drop: 'Drop',
  goal: 'Goal',
  assist: 'Assist',
  hand_block: 'Hand Block',
  interception: 'Interception',
  layout_d: 'Layout D',
  unforced_turnover: 'Unforced TO',
}

export const O_EVENTS = new Set<EventType>(['pass', 'catch', 'throwaway', 'drop', 'goal', 'assist'])
export const D_EVENTS = new Set<EventType>(['hand_block', 'interception', 'layout_d', 'unforced_turnover'])

// Events that flip possession to D (we lost the disc)
export const FLIPS_TO_D = new Set<EventType>(['throwaway', 'drop'])
// Events that flip possession to O (we got the disc)
export const FLIPS_TO_O = new Set<EventType>(['hand_block', 'interception', 'layout_d', 'unforced_turnover'])

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
