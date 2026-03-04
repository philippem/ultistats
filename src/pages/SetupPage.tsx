import { useState } from 'react'
import type { Team, Player } from '../types'

interface Props {
  onComplete: (team: Team) => void
  initialTeam?: Team
}

export default function SetupPage({ onComplete, initialTeam }: Props) {
  const [teamName, setTeamName] = useState(initialTeam?.name ?? '')
  const [players, setPlayers] = useState<Player[]>(initialTeam?.players ?? [])
  const [newName, setNewName] = useState('')
  const [newNumber, setNewNumber] = useState('')

  function addPlayer() {
    if (!newName.trim()) return
    setPlayers(prev => [...prev, {
      id: crypto.randomUUID(),
      name: newName.trim(),
      number: newNumber.trim() || undefined,
    }])
    setNewName('')
    setNewNumber('')
  }

  function removePlayer(id: string) {
    setPlayers(prev => prev.filter(p => p.id !== id))
  }

  function handleSubmit() {
    if (!teamName.trim() || players.length === 0) return
    onComplete({
      id: initialTeam?.id ?? crypto.randomUUID(),
      name: teamName.trim(),
      players,
    })
  }

  return (
    <div className="setup-page">
      <h1>{initialTeam ? 'Edit Roster' : 'Create Your Team'}</h1>

      <div className="form-group">
        <label>Team Name</label>
        <input
          className="input"
          value={teamName}
          onChange={e => setTeamName(e.target.value)}
          placeholder="e.g. Furious George"
        />
      </div>

      <div className="form-group">
        <label>Players</label>
        <div className="add-player">
          <input
            className="input"
            placeholder="Player name"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addPlayer()}
          />
          <input
            className="input input-narrow"
            placeholder="#"
            value={newNumber}
            onChange={e => setNewNumber(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addPlayer()}
          />
          <button className="btn btn-primary" onClick={addPlayer}>Add</button>
        </div>

        <ul className="player-list">
          {players.map(p => (
            <li key={p.id} className="player-item">
              <span>{p.number ? `#${p.number} ` : ''}{p.name}</span>
              <button className="btn btn-ghost btn-sm" onClick={() => removePlayer(p.id)}>✕</button>
            </li>
          ))}
        </ul>
      </div>

      <button
        className="btn btn-primary btn-large"
        onClick={handleSubmit}
        disabled={!teamName.trim() || players.length === 0}
      >
        {initialTeam ? 'Save Changes' : 'Create Team'}
      </button>
      <p style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 16 }}>{__GIT_HASH__}</p>
    </div>
  )
}
