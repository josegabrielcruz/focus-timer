import { useCallback, useState } from 'react'
import { Session, TimerMode } from '../types'

const STORAGE_KEY = 'mission-timer-sessions'
const MAX_SESSIONS = 365 * 5   // keep 5 years of history

function load(): Session[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Session[]) : []
  } catch { return [] }
}

function save(sessions: Session[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions)) }
  catch { /* storage quota exceeded — silently skip */ }
}

// ── Stats helpers ─────────────────────────────────────────────────────────────

function startOfDay(ts: number): number {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

function calculateStreak(sessions: Session[]): number {
  const focusDays = new Set(
    sessions
      .filter(s => s.type === 'focus' && s.completed)
      .map(s => startOfDay(s.startTime))
  )

  let streak = 0
  const today   = startOfDay(Date.now())
  const oneDay  = 86_400_000

  // Start from today (or yesterday if no session today yet)
  let check = focusDays.has(today) ? today : today - oneDay

  while (focusDays.has(check)) {
    streak++
    check -= oneDay
  }

  return streak
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useSessions() {
  const [sessions, setSessions] = useState<Session[]>(load)

  const addSession = useCallback((type: TimerMode, duration: number, completed: boolean) => {
    const session: Session = {
      id:        `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type,
      startTime: Date.now(),
      duration,
      completed,
    }
    setSessions(prev => {
      const next = [...prev, session].slice(-MAX_SESSIONS)
      save(next)
      return next
    })
  }, [])

  const clearHistory = useCallback(() => {
    setSessions([])
    save([])
  }, [])

  // ── Derived stats ────────────────────────────────────────────────────────
  const focusSessions = sessions.filter(s => s.type === 'focus' && s.completed)

  const totalFocusSessions = focusSessions.length

  const totalFocusMinutes = Math.floor(
    focusSessions.reduce((sum, s) => sum + s.duration, 0) / 60
  )

  const todaySessions = focusSessions.filter(
    s => startOfDay(s.startTime) === startOfDay(Date.now())
  ).length

  const currentStreak = calculateStreak(sessions)

  return {
    sessions,
    addSession,
    clearHistory,
    stats: { totalFocusSessions, totalFocusMinutes, todaySessions, currentStreak },
  }
}
