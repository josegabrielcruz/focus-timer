// ── Timer ─────────────────────────────────────────────────────────────────────

export type TimerMode  = 'focus' | 'short-break' | 'long-break'
export type TimerState = 'idle' | 'running' | 'paused' | 'complete'

export interface TimerConfig {
  focusDuration:            number   // seconds — default 25 × 60
  shortBreakDuration:       number   // default 5 × 60
  longBreakDuration:        number   // default 15 × 60
  sessionsUntilLongBreak:   number   // default 4
  autoStartBreak:           boolean  // automatically begin break after focus
}

export const DEFAULT_TIMER_CONFIG: TimerConfig = {
  focusDuration:          25 * 60,
  shortBreakDuration:      5 * 60,
  longBreakDuration:      15 * 60,
  sessionsUntilLongBreak:  4,
  autoStartBreak:          false,
}

// ── Sessions ──────────────────────────────────────────────────────────────────

export interface Session {
  id:        string
  type:      TimerMode
  startTime: number    // Unix timestamp ms
  duration:  number    // seconds completed
  completed: boolean   // false if cancelled early
}

// ── Sound ─────────────────────────────────────────────────────────────────────

export type NoiseType = 'white' | 'pink' | 'brown'

export interface SoundConfig {
  enabled:           boolean
  noiseEnabled:      boolean
  noiseType:         NoiseType
  binauralEnabled:   boolean
  binauralDelta:     number   // Hz difference between ears — 8 = alpha, 14 = beta
  droneEnabled:      boolean
  volume:            number   // 0–1 master
}

export const DEFAULT_SOUND_CONFIG: SoundConfig = {
  enabled:         false,   // requires user gesture to enable
  noiseEnabled:    true,
  noiseType:       'pink',
  binauralEnabled: false,
  binauralDelta:   8,
  droneEnabled:    true,
  volume:          0.5,
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function modeDuration(mode: TimerMode, config: TimerConfig): number {
  if (mode === 'focus')       return config.focusDuration
  if (mode === 'short-break') return config.shortBreakDuration
  return config.longBreakDuration
}

export function modeLabel(mode: TimerMode): string {
  if (mode === 'focus')       return 'FOCUS'
  if (mode === 'short-break') return 'SHORT BREAK'
  return 'LONG BREAK'
}
