import { useCallback, useEffect, useRef, useState } from 'react'
import {
  TimerMode, TimerState, TimerConfig, DEFAULT_TIMER_CONFIG,
  modeDuration, formatTime,
} from '../types'

export function useTimer(config: TimerConfig = DEFAULT_TIMER_CONFIG) {
  const [state,        setState]        = useState<TimerState>('idle')
  const [mode,         setMode]         = useState<TimerMode>('focus')
  const [remaining,    setRemaining]    = useState(config.focusDuration)
  const [sessionCount, setSessionCount] = useState(0)  // completed focus sessions

  // Keep a stable ref to config so interval callback doesn't go stale
  const configRef = useRef(config)
  configRef.current = config

  // ── Countdown ────────────────────────────────────────────────────────────
  // Measure elapsed wall-clock time rather than counting ticks to avoid drift.

  const startTimeRef     = useRef<number>(0)
  const startRemainingRef = useRef<number>(0)

  useEffect(() => {
    if (state !== 'running') return

    startTimeRef.current     = Date.now()
    startRemainingRef.current = remaining   // snapshot at the moment we start running

    const interval = setInterval(() => {
      const elapsed     = Math.floor((Date.now() - startTimeRef.current) / 1000)
      const newRemaining = startRemainingRef.current - elapsed

      if (newRemaining <= 0) {
        clearInterval(interval)
        setRemaining(0)
        setState('complete')
      } else {
        setRemaining(newRemaining)
      }
    }, 250)   // 4× per second for smooth display

    return () => clearInterval(interval)
  }, [state])   // deliberately exclude `remaining` — startRemainingRef captures the snapshot

  // ── Auto-advance after complete ───────────────────────────────────────────

  const onCompleteRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    if (state !== 'complete') return

    // Call the complete callback (e.g., play chime, save session)
    onCompleteRef.current?.()

    // Update session count for focus sessions
    if (mode === 'focus') {
      setSessionCount(prev => prev + 1)
    }

    // Advance mode
    if (mode === 'focus') {
      const newCount = sessionCount + 1
      const nextMode: TimerMode =
        newCount % configRef.current.sessionsUntilLongBreak === 0
          ? 'long-break'
          : 'short-break'

      setMode(nextMode)
      setRemaining(modeDuration(nextMode, configRef.current))
      setState(configRef.current.autoStartBreak ? 'running' : 'idle')
    } else {
      // Break complete → back to focus
      setMode('focus')
      setRemaining(configRef.current.focusDuration)
      setState('idle')
    }
  }, [state])   // mode + sessionCount intentionally excluded (stale is fine here)

  // ── Controls ──────────────────────────────────────────────────────────────

  const start = useCallback(() => {
    if (state === 'idle' || state === 'complete') setState('running')
  }, [state])

  const pause = useCallback(() => {
    if (state === 'running') setState('paused')
  }, [state])

  const resume = useCallback(() => {
    if (state === 'paused') setState('running')
  }, [state])

  const skip = useCallback(() => {
    setState('complete')
  }, [])

  const reset = useCallback(() => {
    setState('idle')
    setMode('focus')
    setSessionCount(0)
    setRemaining(configRef.current.focusDuration)
  }, [])

  // Expose a way for the ambient hook to register a completion callback
  const setCompleteCallback = useCallback((fn: () => void) => {
    onCompleteRef.current = fn
  }, [])

  // ── Document title ────────────────────────────────────────────────────────

  useEffect(() => {
    const modeStr = mode === 'focus' ? 'Focus' : 'Break'
    const stateStr = state === 'running' ? '' : ` (${state})`
    document.title = `${formatTime(remaining)} — ${modeStr}${stateStr} | Mission Timer`
  }, [remaining, mode, state])

  return {
    state, mode, remaining, sessionCount,
    start, pause, resume, skip, reset,
    setCompleteCallback,
  }
}
