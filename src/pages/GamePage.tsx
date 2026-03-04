import { useState, useEffect } from 'react'
import { EVENT_LABELS, FLIPS_TO_D, FLIPS_TO_O } from '../types'
import type { Team, Session, GameEvent, EventType, PointInfo } from '../types'

interface Props {
  team: Team
  session: Session
  onUpdate: (session: Session) => void
  onEnd: (session: Session) => void
}

const O_ACTIONS: { type: EventType; color: string }[] = [
  { type: 'pass',      color: 'blue'   },
  { type: 'catch',     color: 'green'  },
  { type: 'throwaway', color: 'orange' },
  { type: 'drop',      color: 'red'    },
  { type: 'goal',      color: 'gold'   },
  { type: 'assist',    color: 'teal'   },
]

const D_ACTIONS: { type: EventType; color: string }[] = [
  { type: 'hand_block',        color: 'purple' },
  { type: 'interception',      color: 'purple' },
  { type: 'layout_d',          color: 'purple' },
  { type: 'unforced_turnover', color: 'gray'   },
]

type Phase = 'lineup' | 'playing'

export default function GamePage({ team, session, onUpdate, onEnd }: Props) {
  const [phase, setPhase] = useState<Phase>('lineup')
  const [currentSide, setCurrentSide] = useState<'O' | 'D'>('O')
  const [possession, setPossession] = useState<'O' | 'D'>('O')
  const [lineup, setLineup] = useState<string[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [currentPoint, setCurrentPoint] = useState(
    session.events.length > 0
      ? Math.max(...session.events.map(e => e.pointNumber)) + 1
      : 1
  )
  const [flash, setFlash] = useState<string | null>(null)

  const [elapsed, setElapsed] = useState(Date.now() - session.startedAt)
  useEffect(() => {
    const id = setInterval(() => setElapsed(Date.now() - session.startedAt), 1000)
    return () => clearInterval(id)
  }, [session.startedAt])

  function formatElapsed(ms: number) {
    const s = Math.floor(ms / 1000)
    const m = Math.floor(s / 60)
    return `${m}:${String(s % 60).padStart(2, '0')}`
  }

  function eventTime(timestamp: number) {
    return formatElapsed(timestamp - session.startedAt)
  }

  function toggleLineupPlayer(id: string) {
    setLineup(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    )
  }

  function startPoint() {
    setPossession(currentSide)
    setPhase('playing')
    setSelectedId(null)
  }

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

    if (FLIPS_TO_D.has(type)) setPossession('D')
    if (FLIPS_TO_O.has(type)) setPossession('O')
  }

  function scorePoint(us: boolean) {
    const pointInfo: PointInfo = {
      pointNumber: currentPoint,
      side: currentSide,
      lineup,
      scoredBy: us ? 'us' : 'them',
    }
    onUpdate({
      ...session,
      ourScore:   us ? session.ourScore + 1 : session.ourScore,
      theirScore: us ? session.theirScore   : session.theirScore + 1,
      points: [...(session.points || []), pointInfo],
    })
    setCurrentPoint(p => p + 1)
    setSelectedId(null)
    setLineup([])
    setCurrentSide(us ? 'D' : 'O')
    setPhase('lineup')
  }

  function undoLast() {
    if (session.events.length === 0) return
    onUpdate({ ...session, events: session.events.slice(0, -1) })
  }

  const lineupPlayers = team.players.filter(p => lineup.includes(p.id))
  const recentEvents = session.events.slice(-6).reverse()
  const selectedPlayer = lineupPlayers.find(p => p.id === selectedId)
  const actions = possession === 'O' ? O_ACTIONS : D_ACTIONS

  const header = (
    <header className="game-header">
      <div className="game-title">
        <span className="team-name">{team.name}</span>
        <span className="score">{session.ourScore} – {session.theirScore}</span>
        <span className="opponent">{session.opponent}</span>
      </div>
      <div className="game-header-actions">
        <span className="point-label">{formatElapsed(elapsed)}</span>
        <span className="point-label">Pt {currentPoint}</span>
        {phase === 'playing' && (
          <button className="btn btn-ghost btn-sm" onClick={undoLast}>Undo</button>
        )}
        <button className="btn btn-danger btn-sm" onClick={() => onEnd(session)}>End Game</button>
      </div>
    </header>
  )

  // ── Lineup phase ──────────────────────────────────────────────────────────
  if (phase === 'lineup') {
    return (
      <div className="game-page">
        {header}
        <div className="lineup-phase">
          <div className="side-toggle">
            <button
              className={`side-btn ${currentSide === 'O' ? 'side-btn-active-o' : ''}`}
              onClick={() => setCurrentSide('O')}
            >
              O — Offense
            </button>
            <button
              className={`side-btn ${currentSide === 'D' ? 'side-btn-active-d' : ''}`}
              onClick={() => setCurrentSide('D')}
            >
              D — Defense
            </button>
          </div>

          <div className="lineup-label">
            {lineup.length} / 7 on the line — tap to select
          </div>

          <div className="player-grid lineup-grid">
            {team.players.map(player => (
              <button
                key={player.id}
                className={`player-btn ${lineup.includes(player.id) ? 'selected' : ''}`}
                onClick={() => toggleLineupPlayer(player.id)}
              >
                {player.number && <span className="player-num">#{player.number}</span>}
                <span className="player-name">{player.name}</span>
              </button>
            ))}
          </div>

          <button
            className="btn btn-primary btn-large"
            onClick={startPoint}
            disabled={lineup.length === 0}
          >
            Start Point
          </button>
        </div>
      </div>
    )
  }

  // ── Playing phase ─────────────────────────────────────────────────────────
  return (
    <div className="game-page">
      {header}

      <div className="game-body">
        <div className="players-panel">
          <div className="panel-label">
            {selectedPlayer ? `Selected: ${selectedPlayer.name}` : 'Tap a player'}
          </div>
          <div className="player-grid">
            {lineupPlayers.map(player => (
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
          <div className={`possession-toggle ${possession === 'O' ? 'possession-o' : 'possession-d'}`}>
            <button
              className={`possession-btn ${possession === 'O' ? 'active' : ''}`}
              onClick={() => setPossession('O')}
            >
              O
            </button>
            <span className="possession-label">
              {possession === 'O' ? 'Offense' : 'Defense'}
            </span>
            <button
              className={`possession-btn ${possession === 'D' ? 'active' : ''}`}
              onClick={() => setPossession('D')}
            >
              D
            </button>
          </div>

          {flash && <div className="flash">{flash}</div>}

          <div className="action-grid">
            {actions.map(({ type, color }) => (
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
              {player?.name} · {EVENT_LABELS[event.type]} · {eventTime(event.timestamp)}
            </span>
          )
        })}
      </div>
    </div>
  )
}
