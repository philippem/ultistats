import { useMemo, useState } from 'react'
import type { Team, Session, EventType } from '../types'
import { computeStats } from '../lib/stats'

function TeamSummary({ sessions }: { sessions: Session[] }) {
  const points = sessions.flatMap(s => s.points || [])
  const oTotal = points.filter(p => p.side === 'O').length
  const oHolds = points.filter(p => p.side === 'O' && p.scoredBy === 'us').length
  const dTotal = points.filter(p => p.side === 'D').length
  const dBreaks = points.filter(p => p.side === 'D' && p.scoredBy === 'us').length
  if (points.length === 0) return null
  return (
    <div className="team-summary">
      <div className="team-summary-stat">
        <span className="summary-label">Hold %</span>
        <span className="summary-value">{oTotal ? Math.round((oHolds / oTotal) * 100) : 0}%</span>
        <span className="summary-sub">{oHolds}/{oTotal} O points</span>
      </div>
      <div className="team-summary-stat">
        <span className="summary-label">Break %</span>
        <span className="summary-value">{dTotal ? Math.round((dBreaks / dTotal) * 100) : 0}%</span>
        <span className="summary-sub">{dBreaks}/{dTotal} D points</span>
      </div>
    </div>
  )
}

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
        <TeamSummary sessions={sessions} />

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
                <th>D</th>
                <th>Goal</th>
                <th>Ast</th>
                <th>Away</th>
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
                  <td>{s.Ds}</td>
                  <td>{s.goals}</td>
                  <td>{s.assists}</td>
                  <td>{s.throwaways}</td>
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
                  <th>Drop</th><th>D</th><th>Goal</th><th>Ast</th><th>Away</th>
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
                        <td>{c('drop')}</td>
                        <td>{c('D')}</td>
                        <td>{(s.points || []).filter(p => p.side === 'O' && p.lineup.includes(selected.player.id)).length}</td>
                        <td>{(s.points || []).filter(p => p.side === 'D' && p.lineup.includes(selected.player.id)).length}</td>
                        <td>{c('pass')}</td>
                        <td>{c('catch')}</td>
                        <td>{c('drop')}</td>
                        <td>{c('D')}</td>
                        <td>{c('goal')}</td>
                        <td>{c('assist')}</td>
                        <td>{c('throwaway')}</td>
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
