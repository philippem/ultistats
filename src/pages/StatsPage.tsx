import { useMemo, useState } from 'react'
import type { Team, Session, EventType } from '../types'
import { computeStats } from '../lib/stats'


interface Props {
  team: Team
  sessions: Session[]
  onBack: () => void
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
                <th>O Pts</th>
                <th>D Pts</th>
                <th>Pass</th>
                <th>Catch</th>
                <th>Drop%</th>
                <th>Blk</th>
                <th>Goal</th>
                <th>Ast</th>
                <th>Away</th>
                <th>UT</th>
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
                  <td>{s.oPoints}</td>
                  <td>{s.dPoints}</td>
                  <td>{s.passes}</td>
                  <td>{s.catches}</td>
                  <td className={s.dropRate > 20 ? 'stat-bad' : ''}>{s.dropRate}%</td>
                  <td>{s.blocks}</td>
                  <td>{s.goals}</td>
                  <td>{s.assists}</td>
                  <td>{s.throwaways}</td>
                  <td>{s.unforcedTurnovers}</td>
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
                  <th>Date</th><th>vs</th><th>O</th><th>D</th><th>Pass</th><th>Catch</th>
                  <th>Drop%</th><th>Blk</th><th>Goal</th><th>Ast</th><th>Away</th><th>UT</th>
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
                        <td>{(s.points || []).filter(p => p.side === 'O' && p.lineup.includes(selected.player.id)).length}</td>
                        <td>{(s.points || []).filter(p => p.side === 'D' && p.lineup.includes(selected.player.id)).length}</td>
                        <td>{c('pass')}</td>
                        <td>{c('catch')}</td>
                        <td>{(() => { const ca = c('catch'), dr = c('drop'); return ca + dr > 0 ? Math.round((dr / (ca + dr)) * 100) + '%' : '0%' })()}</td>
                        <td>{c('hand_block') + c('interception') + c('layout_d')}</td>
                        <td>{c('goal')}</td>
                        <td>{c('assist')}</td>
                        <td>{c('throwaway')}</td>
                        <td>{c('unforced_turnover')}</td>
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
