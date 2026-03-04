import { useMemo, useState } from 'react'
import type { Team, Session, Player, EventType } from '../types'

interface Props {
  team: Team
  sessions: Session[]
  onBack: () => void
}

interface PlayerStats {
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

function computeStats(team: Team, sessions: Session[]): PlayerStats[] {
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

export default function StatsPage({ team, sessions, onBack }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const stats = useMemo(() => computeStats(team, sessions), [team, sessions])
  const selected = stats.find(s => s.player.id === selectedId)

  if (sessions.length === 0) {
    return (
      <div className="stats-page">
        <header className="stats-header">
          <button className="btn btn-ghost" onClick={onBack}>← Back</button>
          <h1>Stats</h1>
        </header>
        <p className="empty-state">No completed games yet.</p>
      </div>
    )
  }

  return (
    <div className="stats-page">
      <header className="stats-header">
        <button className="btn btn-ghost" onClick={onBack}>← Back</button>
        <h1>{team.name}</h1>
        <span style={{ color: 'var(--text-muted)' }}>{sessions.length} game{sessions.length !== 1 ? 's' : ''}</span>
      </header>

      <div className="stats-body">
        <div className="stats-table-container">
          <table className="stats-table">
            <thead>
              <tr>
                <th>Player</th>
                <th>GP</th>
                <th>Pass</th>
                <th>Catch</th>
                <th>Drop%</th>
                <th>D</th>
                <th>Goal</th>
                <th>Ast</th>
              </tr>
            </thead>
            <tbody>
              {stats.map(s => (
                <tr
                  key={s.player.id}
                  className={s.player.id === selectedId ? 'selected' : ''}
                  onClick={() => setSelectedId(s.player.id === selectedId ? null : s.player.id)}
                >
                  <td>{s.player.name}</td>
                  <td>{s.gamesPlayed}</td>
                  <td>{s.passes}</td>
                  <td>{s.catches}</td>
                  <td className={s.dropRate > 20 ? 'stat-bad' : ''}>{s.dropRate}%</td>
                  <td>{s.Ds}</td>
                  <td>{s.goals}</td>
                  <td>{s.assists}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selected && (
          <div className="player-detail">
            <h2>{selected.player.name} — Game by Game</h2>
            <table className="stats-table">
              <thead>
                <tr>
                  <th>Date</th><th>vs</th><th>Pass</th><th>Catch</th>
                  <th>Drop</th><th>D</th><th>Goal</th><th>Ast</th>
                </tr>
              </thead>
              <tbody>
                {sessions
                  .filter(s => s.events.some(e => e.playerId === selected.player.id))
                  .map(s => {
                    const ev = s.events.filter(e => e.playerId === selected.player.id)
                    const c = (type: EventType) => ev.filter(e => e.type === type).length
                    return (
                      <tr key={s.id}>
                        <td>{s.date}</td>
                        <td>{s.opponent}</td>
                        <td>{c('pass')}</td>
                        <td>{c('catch')}</td>
                        <td>{c('drop')}</td>
                        <td>{c('D')}</td>
                        <td>{c('goal')}</td>
                        <td>{c('assist')}</td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        )}

        <div className="game-history">
          <h2>Game History</h2>
          {sessions.slice().reverse().map(s => (
            <div key={s.id} className="game-card">
              <span>{s.date}</span>
              <span>vs {s.opponent}</span>
              <span className={s.ourScore > s.theirScore ? 'win' : 'loss'}>
                {s.ourScore} – {s.theirScore}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
