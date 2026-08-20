import { useCallback, useEffect, useState } from 'react'
import './App.css'
import { TimerArc }    from './components/TimerArc'
import { SessionLog }  from './components/SessionLog'
import { Controls }    from './components/Controls'
import { RainRipple }  from './components/RainRipple'
import { useTimer }    from './hooks/useTimer'
import { useAmbient }  from './hooks/useAmbient'
import { useSessions } from './hooks/useSessions'
import { DEFAULT_TIMER_CONFIG, DEFAULT_SOUND_CONFIG, SoundConfig } from './types'

export default function App() {
  const timer    = useTimer(DEFAULT_TIMER_CONFIG)
  const sessions = useSessions()

  const [soundConfig, setSoundConfig] = useState<SoundConfig>(DEFAULT_SOUND_CONFIG)
  const [ambientMode,  setAmbientMode]  = useState(false)
  const [minimalMode,  setMinimalMode]  = useState(false)
  const [ripplesActive, setRipplesActive] = useState(true)

  const ambient = useAmbient(soundConfig)

  // ── Wire timer completion → ambient chime + session record ────────────────
  useEffect(() => {
    timer.setCompleteCallback(() => {
      ambient.playChime(timer.mode)
      sessions.addSession(timer.mode, timer.remaining === 0
        ? (timer.mode === 'focus'
            ? DEFAULT_TIMER_CONFIG.focusDuration
            : DEFAULT_TIMER_CONFIG.shortBreakDuration)
        : DEFAULT_TIMER_CONFIG.focusDuration - timer.remaining,
        true,
      )
    })
  }, [timer.mode])

  // ── Sound enable: init Tone.js on first toggle ─────────────────────────────
  const handleSoundChange = useCallback(async (update: Partial<SoundConfig>) => {
    // If turning sound on for the first time, init Tone.js (requires user gesture)
    if (update.enabled === true) {
      await ambient.init()
    }
    setSoundConfig(prev => ({ ...prev, ...update }))
  }, [ambient])

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return

      switch (e.code) {
        case 'Space':
          e.preventDefault()
          if      (timer.state === 'idle' || timer.state === 'complete') timer.start()
          else if (timer.state === 'running')  timer.pause()
          else if (timer.state === 'paused')   timer.resume()
          break
        case 'KeyS':  timer.skip();  break
        case 'KeyR':  timer.reset(); break
        case 'KeyF':  setAmbientMode(p => !p); break
        case 'KeyN':  setMinimalMode(p => !p); break
        case 'KeyM':  handleSoundChange({ enabled: !soundConfig.enabled }); break
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [timer.state, soundConfig.enabled, handleSoundChange, timer])

  const { stats } = sessions

  return (
    <div
      className={[
        'app',
        ambientMode  ? 'is-ambient'     : '',
        minimalMode  ? 'is-minimal'     : '',
        !ripplesActive ? 'is-ripples-off' : '',
      ].filter(Boolean).join(' ')}
      onClick={minimalMode ? () => setMinimalMode(false) : undefined}
    >
      <RainRipple active={ripplesActive} />

      {/* ── Header ────────────────────────────────────────────────────── */}
      <header className="app-header">
        <div className="app-title-group">
          <span className="app-dot" />
          <h1 className="app-title">Mission Timer</h1>
        </div>
        <div className="app-stats">
          <Stat label="Today"   value={stats.todaySessions} />
          <Stat label="Streak"  value={`${stats.currentStreak}d`} />
          <Stat label="Sessions" value={stats.totalFocusSessions} />
          <Stat label="Total"   value={`${stats.totalFocusMinutes}m`} />
        </div>
      </header>

      {/* ── Timer ─────────────────────────────────────────────────────── */}
      <main className="app-main">
        <TimerArc
          remaining={timer.remaining}
          mode={timer.mode}
          state={timer.state}
        />
      </main>

      {/* ── Controls ──────────────────────────────────────────────────── */}
      <Controls
        state={timer.state}
        mode={timer.mode}
        soundConfig={soundConfig}
        ambientMode={ambientMode}
        minimalMode={minimalMode}
        ripplesActive={ripplesActive}
        onStart={timer.start}
        onPause={timer.pause}
        onResume={timer.resume}
        onSkip={timer.skip}
        onReset={timer.reset}
        onSoundChange={handleSoundChange}
        onAmbientToggle={() => setAmbientMode(p => !p)}
        onMinimalToggle={() => setMinimalMode(p => !p)}
        onRipplesToggle={() => setRipplesActive(p => !p)}
      />

      {/* ── Session log ───────────────────────────────────────────────── */}
      <SessionLog sessions={sessions.sessions} />

      {/* ── Keyboard hint ─────────────────────────────────────────────── */}
      <footer className="app-footer">
        <span>Space — start/pause</span>
        <span>S — skip</span>
        <span>R — reset</span>
        <span>F — ambient</span>
        <span>N — minimal</span>
        <span>M — sound</span>
      </footer>

    </div>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="stat">
      <span className="stat__label">{label}</span>
      <span className="stat__value">{value}</span>
    </div>
  )
}
