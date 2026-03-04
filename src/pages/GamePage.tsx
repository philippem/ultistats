import { useState } from 'react'
import { EVENT_LABELS } from '../types'
import type { Team, Session, GameEvent, EventType } from '../types'

interface Props {
  team: Team
  session: Session
  onUpdate: (session: Session) => void
  onEnd: (session: Session) => void
}

const ACTIONS: { type: EventType; color: string }[] = [
  { type: 'pass',   color: 'blue'   },
  { type: 'catch',  color: 'green'  },
  { type: 'drop',   color: 'red'    },
  { type: 'D',      color: 'purple' },
  { type: 'goal',   color: 'gold'   },
  { type: 'assist', color: 'orange' },
]

export default function GamePage({ team, session, onUpdate, onEnd }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [currentPoint, setCurrentPoint] = useState(
    session.events.length > 0
      ? Math.max(...session.events.map(e => e.pointNumber))
      : 1
  )
  const [flash, setFlash] = useState<string | null>(null)

  function logEvent(type: EventType) {
    if (!selectedId) {
      setFlash('Select a player first')
      setTimeout(() => setFlash(null), 1500)
      return
    }
    const event: GameEvent = {
      id: crypto.randomUUID(),
      playerId: selectedId,
      type,
      pointNumber: currentPoint,
      timestamp: Date.now(),
    }
    onUpdate({ ...session, events: [...session.events, event] })
  }

  function scorePoint(us: boolean) {
    onUpdate({
      ...session,
      ourScore:   us ? session.ourScore + 1   : session.ourScore,
      theirScore: us ? session.theirScore     : session.theirScore + 1,
    })
    setCurrentPoint(p => p + 1)
    setSelectedId(null)
  }

  function undoLast() {
    if (session.events.length === 0) return
    onUpdate({ ...session, events: session.events.slice(0, -1) })
  }

  const selectedPlayer = team.players.find(p => p.id === selectedId)
  const recentEvents = session.events.slice(-6).reverse()

  return (
    <div className="game-page">
      <header className="game-header">
        <div className="game-title">
          <span className="team-name">{team.name}</span>
          <span className="score">{session.ourScore} – {session.theirScore}</span>
          <span className="opponent">{session.opponent}</span>
        </div>
        <div className="game-header-actions">
          <span className="point-label">Pt {currentPoint}</span>
          <button className="btn btn-ghost btn-sm" onClick={undoLast}>Undo</button>
          <button className="btn btn-danger btn-sm" onClick={() => onEnd(session)}>End Game</button>
        </div>
      </header>

      <div className="game-body">
        <div className="players-panel">
          <div className="panel-label">
            {selectedPlayer ? `Selected: ${selectedPlayer.name}` : 'Tap a player'}
          </div>
          <div className="player-grid">
            {team.players.map(player => (
              <button
                key={player.id}
                className={`player-btn ${player.id === selectedId ? 'selected' : ''}`}
                onClick={() => setSelectedId(player.id === selectedId ? null : player.id)}
              >
                {player.number && <span className="player-num">#{player.number}</span>}
                <span className="player-name">{player.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="actions-panel">
          {flash && <div className="flash">{flash}</div>}
          <div className="action-grid">
            {ACTIONS.map(({ type, color }) => (
              <button
                key={type}
                className={`action-btn action-${color}`}
                onClick={() => logEvent(type)}
              >
                {EVENT_LABELS[type]}
              </button>
            ))}
          </div>
          <div className="score-buttons">
            <button className="btn-score-us" onClick={() => scorePoint(true)}>✓ We Scored</button>
            <button className="btn-score-them" onClick={() => scorePoint(false)}>They Scored</button>
          </div>
        </div>
      </div>

      <div className="event-log">
        {recentEvents.length === 0 && (
          <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>No events yet</span>
        )}
        {recentEvents.map(event => {
          const player = team.players.find(p => p.id === event.playerId)
          return (
            <span key={event.id} className="event-chip">
              {player?.name} · {EVENT_LABELS[event.type]}
            </span>
          )
        })}
      </div>
    </div>
  )
}
