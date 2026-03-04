import type { Team, Session, Player, EventType } from '../types'

export interface PlayerStats {
  player: Player
  gamesPlayed: number
  passes: number
  catches: number
  drops: number
  Ds: number
  goals: number
  assists: number
  dropRate: number
}

export function computeStats(team: Team, sessions: Session[]): PlayerStats[] {
  return team.players
    .map(player => {
      const events = sessions.flatMap(s => s.events).filter(e => e.playerId === player.id)
      const count = (type: EventType) => events.filter(e => e.type === type).length
      const catches = count('catch')
      const drops = count('drop')
      return {
        player,
        gamesPlayed: sessions.filter(s => s.events.some(e => e.playerId === player.id)).length,
        passes:  count('pass'),
        catches,
        drops,
        Ds:      count('D'),
        goals:   count('goal'),
        assists: count('assist'),
        dropRate: catches + drops > 0 ? Math.round((drops / (catches + drops)) * 100) : 0,
      }
    })
    .filter(s => s.gamesPlayed > 0)
    .sort((a, b) => b.gamesPlayed - a.gamesPlayed)
}
