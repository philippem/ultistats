import type { Team, Session, Player, EventType } from '../types'

export interface PlayerStats {
  player: Player
  gamesPlayed: number
  oPoints: number
  dPoints: number
  passes: number
  catches: number
  drops: number
  Ds: number
  goals: number
  assists: number
  throwaways: number
  dropRate: number
}

export function computeStats(team: Team, sessions: Session[]): PlayerStats[] {
  const allPoints = sessions.flatMap(s => s.points || [])
  return team.players
    .map(player => {
      const events = sessions.flatMap(s => s.events).filter(e => e.playerId === player.id)
      const count = (type: EventType) => events.filter(e => e.type === type).length
      const catches = count('catch')
      const drops = count('drop')
      const playerPoints = allPoints.filter(p => p.lineup.includes(player.id))
      return {
        player,
        gamesPlayed: sessions.filter(s => s.events.some(e => e.playerId === player.id)).length,
        oPoints: playerPoints.filter(p => p.side === 'O').length,
        dPoints: playerPoints.filter(p => p.side === 'D').length,
        passes:     count('pass'),
        catches,
        drops,
        Ds:         count('D'),
        goals:      count('goal'),
        assists:    count('assist'),
        throwaways: count('throwaway'),
        dropRate: catches + drops > 0 ? Math.round((drops / (catches + drops)) * 100) : 0,
      }
    })
    .filter(s => s.gamesPlayed > 0 || s.oPoints > 0 || s.dPoints > 0)
    .sort((a, b) => b.gamesPlayed - a.gamesPlayed)
}
