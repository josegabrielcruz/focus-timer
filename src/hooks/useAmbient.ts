import { useCallback, useEffect, useRef } from 'react'
import * as Tone from 'tone'
import { SoundConfig, TimerMode } from '../types'

// ── Ambient soundscape ─────────────────────────────────────────────────────
//
// Three independent audio layers, all synthesized in the browser (no files):
//
//   1. Noise layer  — pink/white/brown noise through a gentle low-pass filter.
//                     The most effective focus sound; masks distracting audio.
//
//   2. Binaural beat — two oscillators panned L/R with a small frequency delta.
//                     At 8 Hz delta the beating rate is in the alpha/theta range.
//                     Only effective with headphones.
//
//   3. Drone        — FM synthesis with a slow LFO on modulation index. Creates
//                     an evolving, almost organic tone that changes over time.
//
//   4. Completion chime — a brief ascending pentatonic arpeggio on session end.

export function useAmbient(soundConfig: SoundConfig) {
  // ── Audio node refs ──────────────────────────────────────────────────────
  const noiseRef    = useRef<Tone.Noise | null>(null)
  const filterRef   = useRef<Tone.Filter | null>(null)
  const noiseGainRef = useRef<Tone.Gain | null>(null)

  const leftOscRef  = useRef<Tone.Oscillator | null>(null)
  const rightOscRef = useRef<Tone.Oscillator | null>(null)
  const panLRef     = useRef<Tone.Panner | null>(null)
  const panRRef     = useRef<Tone.Panner | null>(null)
  const binauralGainRef = useRef<Tone.Gain | null>(null)

  const droneRef    = useRef<Tone.FMSynth | null>(null)
  const lfoRef      = useRef<Tone.LFO | null>(null)
  const droneGainRef = useRef<Tone.Gain | null>(null)

  const chimeRef    = useRef<Tone.PolySynth | null>(null)
  const masterGainRef = useRef<Tone.Gain | null>(null)

  const initializedRef = useRef(false)

  // ── Initialize (called once after user gesture) ──────────────────────────

  const init = useCallback(async () => {
    if (initializedRef.current) return
    await Tone.start()
    initializedRef.current = true

    // ── Master gain ──────────────────────────────────────────────────────
    const masterGain = new Tone.Gain(soundConfig.volume).toDestination()
    masterGainRef.current = masterGain

    // ── 1. Noise layer ────────────────────────────────────────────────────
    const noise     = new Tone.Noise(soundConfig.noiseType)
    const filter    = new Tone.Filter({ frequency: 2000, type: 'lowpass', rolloff: -24 })
    const noiseGain = new Tone.Gain(0.06)
    noise.chain(filter, noiseGain, masterGain)
    noiseRef.current    = noise
    filterRef.current   = filter
    noiseGainRef.current = noiseGain

    if (soundConfig.noiseEnabled && soundConfig.enabled) noise.start()

    // ── 2. Binaural beat ──────────────────────────────────────────────────
    // 200 Hz base (subliminal, not obviously audible), 8 Hz delta = alpha wave
    const BASE_FREQ = 200
    const leftOsc   = new Tone.Oscillator(BASE_FREQ, 'sine')
    const rightOsc  = new Tone.Oscillator(BASE_FREQ + soundConfig.binauralDelta, 'sine')
    const panL      = new Tone.Panner(-1)
    const panR      = new Tone.Panner(1)
    const bGain     = new Tone.Gain(0.04)

    leftOsc.connect(panL)
    rightOsc.connect(panR)
    panL.connect(bGain)
    panR.connect(bGain)
    bGain.connect(masterGain)

    leftOscRef.current       = leftOsc
    rightOscRef.current      = rightOsc
    panLRef.current          = panL
    panRRef.current          = panR
    binauralGainRef.current  = bGain

    if (soundConfig.binauralEnabled && soundConfig.enabled) {
      leftOsc.start(); rightOsc.start()
    }

    // ── 3. Drone ──────────────────────────────────────────────────────────
    const droneGain = new Tone.Gain(0.7)
    droneGain.connect(masterGain)
    droneGainRef.current = droneGain

    const drone = new Tone.FMSynth({
      harmonicity:      2,
      modulationIndex:  8,
      oscillator:       { type: 'sine' },
      envelope:         { attack: 6, decay: 2, sustain: 0.85, release: 10 },
      modulation:       { type: 'triangle' },
      modulationEnvelope: { attack: 8, decay: 2, sustain: 0.6, release: 10 },
      volume: -14,
    }).connect(droneGain)
    droneRef.current = drone

    // Slow LFO makes modulation index wander — creates living, evolving texture
    const lfo = new Tone.LFO({ frequency: 0.05, min: 2, max: 16 })
    lfo.connect(drone.modulationIndex)
    lfoRef.current = lfo
    lfo.start()

    if (soundConfig.droneEnabled && soundConfig.enabled) {
      drone.triggerAttack('A2')
    }

    // ── 4. Completion chime ───────────────────────────────────────────────
    const chime = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope:   { attack: 0.01, decay: 0.3, sustain: 0, release: 2.0 },
      volume:     -4,
    }).connect(masterGain)
    chimeRef.current = chime
  }, [])   // deps are all stable at init time

  // ── Respond to config changes ────────────────────────────────────────────

  useEffect(() => {
    if (!initializedRef.current) return

    // Master volume
    if (masterGainRef.current) {
      masterGainRef.current.gain.rampTo(soundConfig.volume, 0.3)
    }

    // Noise enable/disable
    if (noiseRef.current) {
      if (soundConfig.noiseEnabled && soundConfig.enabled) {
        noiseRef.current.start()
      } else {
        noiseRef.current.stop()
      }
    }

    // Noise type
    if (noiseRef.current && noiseRef.current.type !== soundConfig.noiseType) {
      const wasRunning = soundConfig.noiseEnabled && soundConfig.enabled
      noiseRef.current.stop()
      noiseRef.current.type = soundConfig.noiseType
      if (wasRunning) noiseRef.current.start()
    }

    // Binaural enable/disable
    const binauralShouldRun = soundConfig.binauralEnabled && soundConfig.enabled
    if (leftOscRef.current && rightOscRef.current) {
      if (binauralShouldRun) {
        leftOscRef.current.start()
        rightOscRef.current.start()
        rightOscRef.current.frequency.rampTo(200 + soundConfig.binauralDelta, 0.5)
      } else {
        leftOscRef.current.stop()
        rightOscRef.current.stop()
      }
    }

    // Drone enable/disable
    if (droneRef.current) {
      if (soundConfig.droneEnabled && soundConfig.enabled) {
        droneRef.current.triggerAttack('A2')
      } else {
        droneRef.current.triggerRelease()
      }
    }
  }, [soundConfig])

  // ── Cleanup on unmount ────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      noiseRef.current?.stop();    noiseRef.current?.dispose()
      filterRef.current?.dispose(); noiseGainRef.current?.dispose()
      leftOscRef.current?.stop();  leftOscRef.current?.dispose()
      rightOscRef.current?.stop(); rightOscRef.current?.dispose()
      panLRef.current?.dispose();  panRRef.current?.dispose()
      binauralGainRef.current?.dispose()
      lfoRef.current?.stop();      lfoRef.current?.dispose()
      droneRef.current?.dispose(); droneGainRef.current?.dispose()
      chimeRef.current?.dispose(); masterGainRef.current?.dispose()
    }
  }, [])

  // ── Completion chime (called externally) ──────────────────────────────────

  const playChime = useCallback((mode: TimerMode) => {
    if (!chimeRef.current || !soundConfig.enabled) return

    if (mode === 'focus') {
      // Ascending pentatonic — reward tone
      const now = Tone.now()
      chimeRef.current.triggerAttackRelease('C5', '8n', now)
      chimeRef.current.triggerAttackRelease('E5', '8n', now + 0.18)
      chimeRef.current.triggerAttackRelease('G5', '8n', now + 0.36)
      chimeRef.current.triggerAttackRelease('C6', '4n', now + 0.54)
    } else {
      // Single soft bell — break complete
      chimeRef.current.triggerAttackRelease('G4', '4n', Tone.now())
    }
  }, [soundConfig.enabled])

  return { init, playChime }
}
