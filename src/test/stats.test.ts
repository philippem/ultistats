import { describe, it, expect } from 'vitest'
import { computeStats } from '../lib/stats'
import { team, makeSession } from './fixtures'

describe('computeStats', () => {
  it('returns empty array when no sessions', () => {
    expect(computeStats(team, [])).toEqual([])
  })

  it('only includes players who appeared in at least one session', () => {
    const session = makeSession({
      events: [
        { id: 'e1', playerId: 'p1', type: 'catch', pointNumber: 1, timestamp: 1 },
      ],
    })
    const stats = computeStats(team, [session])
    expect(stats).toHaveLength(1)
    expect(stats[0].player.name).toBe('Marie')
  })

  it('counts offense event types correctly', () => {
    const session = makeSession({
      events: [
        { id: 'e1', playerId: 'p1', type: 'pass',      pointNumber: 1, timestamp: 1 },
        { id: 'e2', playerId: 'p1', type: 'catch',     pointNumber: 1, timestamp: 2 },
        { id: 'e3', playerId: 'p1', type: 'catch',     pointNumber: 2, timestamp: 3 },
        { id: 'e4', playerId: 'p1', type: 'drop',      pointNumber: 3, timestamp: 4 },
        { id: 'e5', playerId: 'p1', type: 'goal',      pointNumber: 4, timestamp: 5 },
        { id: 'e6', playerId: 'p1', type: 'assist',    pointNumber: 5, timestamp: 6 },
        { id: 'e7', playerId: 'p1', type: 'throwaway', pointNumber: 6, timestamp: 7 },
      ],
    })
    const [marie] = computeStats(team, [session])
    expect(marie.passes).toBe(1)
    expect(marie.catches).toBe(2)
    expect(marie.drops).toBe(1)
    expect(marie.goals).toBe(1)
    expect(marie.assists).toBe(1)
    expect(marie.throwaways).toBe(1)
  })

  it('counts defensive event types correctly', () => {
    const session = makeSession({
      events: [
        { id: 'e1', playerId: 'p1', type: 'hand_block',        pointNumber: 1, timestamp: 1 },
        { id: 'e2', playerId: 'p1', type: 'interception',      pointNumber: 2, timestamp: 2 },
        { id: 'e3', playerId: 'p1', type: 'layout_d',          pointNumber: 3, timestamp: 3 },
        { id: 'e4', playerId: 'p1', type: 'unforced_turnover', pointNumber: 4, timestamp: 4 },
      ],
    })
    const [marie] = computeStats(team, [session])
    expect(marie.blocks).toBe(3) // hand_block + interception + layout_d
    expect(marie.unforcedTurnovers).toBe(1)
  })

  it('calculates drop rate correctly', () => {
    const session = makeSession({
      events: [
        ...Array.from({ length: 9 }, (_, i) => ({ id: `e${i}`, playerId: 'p2', type: 'catch' as const, pointNumber: 1, timestamp: i })),
        { id: 'e10', playerId: 'p2', type: 'drop' as const, pointNumber: 2, timestamp: 10 },
      ],
    })
    const [mark] = computeStats(team, [session])
    expect(mark.dropRate).toBe(10)
    expect(mark.player.name).toBe('Mark')
  })

  it('drop rate is 0 when no catches or drops', () => {
    const session = makeSession({
      events: [
        { id: 'e1', playerId: 'p1', type: 'hand_block', pointNumber: 1, timestamp: 1 },
      ],
    })
    const [marie] = computeStats(team, [session])
    expect(marie.dropRate).toBe(0)
  })

  it('counts games played correctly across multiple sessions', () => {
    const s1 = makeSession({ id: 's1', events: [{ id: 'e1', playerId: 'p1', type: 'catch', pointNumber: 1, timestamp: 1 }] })
    const s2 = makeSession({ id: 's2', events: [{ id: 'e2', playerId: 'p1', type: 'pass',  pointNumber: 1, timestamp: 1 }] })
    const s3 = makeSession({ id: 's3', events: [{ id: 'e3', playerId: 'p2', type: 'layout_d', pointNumber: 1, timestamp: 1 }] })
    const stats = computeStats(team, [s1, s2, s3])
    const marie = stats.find(s => s.player.name === 'Marie')!
    const mark  = stats.find(s => s.player.name === 'Mark')!
    expect(marie.gamesPlayed).toBe(2)
    expect(mark.gamesPlayed).toBe(1)
  })

  it('sorts by games played descending', () => {
    const s1 = makeSession({ id: 's1', events: [{ id: 'e1', playerId: 'p1', type: 'catch', pointNumber: 1, timestamp: 1 }] })
    const s2 = makeSession({ id: 's2', events: [{ id: 'e2', playerId: 'p1', type: 'catch', pointNumber: 1, timestamp: 1 }] })
    const s3 = makeSession({ id: 's3', events: [{ id: 'e3', playerId: 'p2', type: 'catch', pointNumber: 1, timestamp: 1 }] })
    const stats = computeStats(team, [s1, s2, s3])
    expect(stats[0].player.name).toBe('Marie')
    expect(stats[1].player.name).toBe('Mark')
  })

  it('accumulates stats across sessions', () => {
    const s1 = makeSession({ id: 's1', events: [{ id: 'e1', playerId: 'p1', type: 'goal', pointNumber: 1, timestamp: 1 }] })
    const s2 = makeSession({ id: 's2', events: [{ id: 'e2', playerId: 'p1', type: 'goal', pointNumber: 1, timestamp: 1 }] })
    const [marie] = computeStats(team, [s1, s2])
    expect(marie.goals).toBe(2)
  })

  it('counts O and D points per player from lineup data', () => {
    const session = makeSession({
      events: [{ id: 'e1', playerId: 'p1', type: 'catch', pointNumber: 1, timestamp: 1 }],
      points: [
        { pointNumber: 1, side: 'O', lineup: ['p1', 'p2'], scoredBy: 'us' },
        { pointNumber: 2, side: 'D', lineup: ['p1'],       scoredBy: 'them' },
        { pointNumber: 3, side: 'D', lineup: ['p2'],       scoredBy: 'us' },
      ],
    })
    const stats = computeStats(team, [session])
    const marie = stats.find(s => s.player.name === 'Marie')!
    const mark  = stats.find(s => s.player.name === 'Mark')!
    expect(marie.oPoints).toBe(1)
    expect(marie.dPoints).toBe(1)
    expect(mark.oPoints).toBe(1)
    expect(mark.dPoints).toBe(1)
  })

  it('returns 0 O/D points for players not in any lineup', () => {
    const session = makeSession({
      events: [{ id: 'e1', playerId: 'p1', type: 'hand_block', pointNumber: 1, timestamp: 1 }],
      points: [],
    })
    const [marie] = computeStats(team, [session])
    expect(marie.oPoints).toBe(0)
    expect(marie.dPoints).toBe(0)
  })
})
