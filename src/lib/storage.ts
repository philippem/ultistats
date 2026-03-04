import type { AppState } from '../types'

const KEY = 'ultistats_v1'

const empty: AppState = { team: null, sessions: [], activeSessionId: null }

export function load(): AppState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return empty
    return JSON.parse(raw)
  } catch {
    return empty
  }
}

export function save(state: AppState): void {
  localStorage.setItem(KEY, JSON.stringify(state))
}
