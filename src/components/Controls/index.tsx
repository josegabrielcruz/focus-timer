import { TimerState, TimerMode, SoundConfig, NoiseType } from '../../types'
import './Controls.css'

interface ControlsProps {
  state:        TimerState
  mode:         TimerMode
  soundConfig:  SoundConfig
  ambientMode:  boolean
  minimalMode:  boolean
  ripplesActive: boolean
  onStart:      () => void
  onPause:      () => void
  onResume:     () => void
  onSkip:       () => void
  onReset:      () => void
  onSoundChange:   (update: Partial<SoundConfig>) => void
  onAmbientToggle: () => void
  onMinimalToggle: () => void
  onRipplesToggle: () => void
}

export function Controls({
  state, soundConfig,
  ambientMode, minimalMode, ripplesActive,
  onStart, onPause, onResume, onSkip, onReset,
  onSoundChange, onAmbientToggle, onMinimalToggle, onRipplesToggle,
}: ControlsProps) {
  const isRunning = state === 'running'
  const isPaused  = state === 'paused'
  const isIdle    = state === 'idle' || state === 'complete'

  return (
    <div className="controls">

      {/* ── Transport ────────────────────────────────────────────────── */}
      <div className="ctrl-row ctrl-row--transport">
        {isIdle && (
          <button className="ctrl-btn ctrl-btn--primary" onClick={onStart}>
            ▶ START
          </button>
        )}
        {isRunning && (
          <button className="ctrl-btn ctrl-btn--primary" onClick={onPause}>
            ‖ PAUSE
          </button>
        )}
        {isPaused && (
          <button className="ctrl-btn ctrl-btn--primary" onClick={onResume}>
            ▶ RESUME
          </button>
        )}

        <button
          className="ctrl-btn"
          onClick={onSkip}
          disabled={isIdle}
          title="Skip to next segment"
        >
          ⏭ SKIP
        </button>

        <button
          className="ctrl-btn"
          onClick={onReset}
          title="Reset timer and session count"
        >
          ↺ RESET
        </button>

        <button
          className={`ctrl-btn ctrl-btn--ambient${ambientMode ? ' is-active' : ''}`}
          onClick={onAmbientToggle}
          title="Fade UI — hover to reveal controls (F)"
        >
          ◎ AMBIENT
        </button>

        <button
          className={`ctrl-btn${ripplesActive ? '' : ' is-active'}`}
          onClick={onRipplesToggle}
          title="Toggle rain ripple background"
        >
          {ripplesActive ? '• RIPPLES ON' : '· RIPPLES OFF'}
        </button>

        <button
          className={`ctrl-btn ctrl-btn--minimal${minimalMode ? ' is-active' : ''}`}
          onClick={onMinimalToggle}
          title="Hide all UI except the arc — click anywhere or press N to exit"
        >
          ◻ MINIMAL
        </button>
      </div>

      {/* ── Sound ────────────────────────────────────────────────────── */}
      <div className="ctrl-row ctrl-row--sound">
        <button
          className={`ctrl-btn ctrl-btn--sound${soundConfig.enabled ? ' is-active' : ''}`}
          onClick={() => onSoundChange({ enabled: !soundConfig.enabled })}
          title="Enable audio (requires browser permission)"
        >
          {soundConfig.enabled ? '♪ SOUND ON' : '♪ SOUND OFF'}
        </button>

        {/* Noise */}
        <div className="ctrl-group">
          <button
            className={`ctrl-toggle${soundConfig.noiseEnabled ? ' is-on' : ''}`}
            onClick={() => onSoundChange({ noiseEnabled: !soundConfig.noiseEnabled })}
            disabled={!soundConfig.enabled}
          >
            NOISE
          </button>
          <select
            className="ctrl-select"
            value={soundConfig.noiseType}
            onChange={e => onSoundChange({ noiseType: e.target.value as NoiseType })}
            disabled={!soundConfig.enabled || !soundConfig.noiseEnabled}
          >
            <option value="pink">Pink</option>
            <option value="white">White</option>
            <option value="brown">Brown</option>
          </select>
        </div>

        {/* Binaural */}
        <div className="ctrl-group">
          <button
            className={`ctrl-toggle${soundConfig.binauralEnabled ? ' is-on' : ''}`}
            onClick={() => onSoundChange({ binauralEnabled: !soundConfig.binauralEnabled })}
            disabled={!soundConfig.enabled}
          >
            BINAURAL
          </button>
          <select
            className="ctrl-select"
            value={soundConfig.binauralDelta}
            onChange={e => onSoundChange({ binauralDelta: Number(e.target.value) })}
            disabled={!soundConfig.enabled || !soundConfig.binauralEnabled}
          >
            <option value={4}>4 Hz — Theta</option>
            <option value={8}>8 Hz — Alpha</option>
            <option value={14}>14 Hz — Beta</option>
            <option value={40}>40 Hz — Gamma</option>
          </select>
        </div>

        {/* Drone */}
        <button
          className={`ctrl-toggle${soundConfig.droneEnabled ? ' is-on' : ''}`}
          onClick={() => onSoundChange({ droneEnabled: !soundConfig.droneEnabled })}
          disabled={!soundConfig.enabled}
        >
          DRONE
        </button>

        {/* Volume */}
        <div className="ctrl-field">
          <label className="ctrl-label">VOL</label>
          <input
            type="range"
            className="ctrl-slider"
            min={0} max={1} step={0.05}
            value={soundConfig.volume}
            disabled={!soundConfig.enabled}
            onChange={e => onSoundChange({ volume: Number(e.target.value) })}
          />
        </div>
      </div>

    </div>
  )
}
