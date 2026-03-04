import { useState, useEffect, useCallback } from 'react'
import { load, save } from './lib/storage'
import type { AppState, Session, Team } from './types'
import SetupPage from './pages/SetupPage'
import GamePage from './pages/GamePage'
import StatsPage from './pages/StatsPage'
import './index.css'

type Screen = 'setup' | 'home' | 'game' | 'stats'

export default function App() {
  const [appState, setAppState] = useState<AppState>(() => load())
  const [screen, setScreen] = useState<Screen>(() => load().team ? 'home' : 'setup')
  const [activeSession, setActiveSession] = useState<Session | null>(() => {
    const s = load()
    return s.activeSessionId ? (s.sessions.find(x => x.id === s.activeSessionId) ?? null) : null
  })

  const updateState = useCallback((updater: (prev: AppState) => AppState) => {
    setAppState(prev => {
      const next = updater(prev)
      save(next)
      return next
    })
  }, [])

  // keep activeSession in sync with appState
  useEffect(() => {
    if (activeSession) {
      const updated = appState.sessions.find(s => s.id === activeSession.id)
      if (updated) setActiveSession(updated)
    }
  }, [appState.sessions])

  function handleSetupComplete(team: Team) {
    updateState(prev => ({ ...prev, team }))
    setScreen('home')
  }

  function handleStartGame(opponent: string) {
    const session: Session = {
      id: crypto.randomUUID(),
      teamId: appState.team!.id,
      opponent,
      date: new Date().toISOString().split('T')[0],
      startedAt: Date.now(),
      ourScore: 0,
      theirScore: 0,
      events: [],
      completed: false,
    }
    updateState(prev => ({
      ...prev,
      sessions: [...prev.sessions, session],
      activeSessionId: session.id,
    }))
    setActiveSession(session)
    setScreen('game')
  }

  function handleUpdateSession(session: Session) {
    setActiveSession(session)
    updateState(prev => ({
      ...prev,
      sessions: prev.sessions.map(s => s.id === session.id ? session : s),
    }))
  }

  function handleEndGame(session: Session) {
    const completed = { ...session, completed: true }
    updateState(prev => ({
      ...prev,
      sessions: prev.sessions.map(s => s.id === completed.id ? completed : s),
      activeSessionId: null,
    }))
    setActiveSession(null)
    setScreen('home')
  }

  if (screen === 'setup' || !appState.team) {
    return <SetupPage onComplete={handleSetupComplete} initialTeam={appState.team ?? undefined} />
  }

  if (screen === 'game' && activeSession) {
    return (
      <GamePage
        team={appState.team}
        session={activeSession}
        onUpdate={handleUpdateSession}
        onEnd={handleEndGame}
      />
    )
  }

  if (screen === 'stats') {
    return (
      <StatsPage
        team={appState.team}
        sessions={appState.sessions.filter(s => s.completed)}
        onBack={() => setScreen('home')}
      />
    )
  }

  // Home screen
  const completedGames = appState.sessions.filter(s => s.completed)
  return (
    <div className="home">
      <header className="home-header">
        <h1>{appState.team.name}</h1>
        <p>{appState.team.players.length} players</p>
      </header>

      <div className="home-actions">
        {activeSession ? (
          <button className="btn btn-primary" onClick={() => setScreen('game')}>
            Resume Game vs {activeSession.opponent}
          </button>
        ) : (
          <NewGameForm onStart={handleStartGame} />
        )}
        <button className="btn btn-secondary" onClick={() => setScreen('stats')}>
          View Stats
        </button>
        <button className="btn btn-ghost" onClick={() => setScreen('setup')}>
          Edit Roster
        </button>
      </div>

      <p style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 16 }}>
        {__GIT_HASH__}
      </p>

      {completedGames.length > 0 && (
        <div className="recent-games">
          <h2>Recent Games</h2>
          {completedGames.slice(-5).reverse().map(s => (
            <div key={s.id} className="game-card">
              <span>{s.date}</span>
              <span>vs {s.opponent}</span>
              <span className={`score ${s.ourScore > s.theirScore ? 'win' : 'loss'}`}>
                {s.ourScore} – {s.theirScore}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function NewGameForm({ onStart }: { onStart: (opponent: string) => void }) {
  const [opponent, setOpponent] = useState('')
  return (
    <form onSubmit={e => { e.preventDefault(); if (opponent.trim()) onStart(opponent.trim()) }}>
      <input
        className="input"
        placeholder="Opponent team name"
        value={opponent}
        onChange={e => setOpponent(e.target.value)}
      />
      <button className="btn btn-primary" type="submit" disabled={!opponent.trim()}>
        Start Game
      </button>
    </form>
  )
}
