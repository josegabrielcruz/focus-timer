import { useEffect, useRef } from 'react'
import { TimerMode, TimerState, formatTime, modeLabel, modeDuration, DEFAULT_TIMER_CONFIG } from '../../types'
import './TimerArc.css'

// ── Drawing constants ─────────────────────────────────────────────────────────

const TAU         = Math.PI * 2
const START_ANGLE = -Math.PI / 2            // top centre
const SWEEP       = (359 / 360) * TAU       // 320° sweep, 40° gap at bottom
const STROKE_W    = 8                       // arc stroke width (px, CSS scale)
const TICK_COUNT  = 5                       // tick marks dividing the arc

const C = {
  BG:          '#06090f',
  TRACK:       'rgba(0, 229, 255, 0.12)',
  FILL:        '#00e5ff',
  FILL_BREAK:  'rgba(0, 229, 255, 0.55)',
  GLOW:        'rgba(0, 229, 255, 0.35)',
  TICK:        'rgba(0, 229, 255, 0.30)',
  TICK_ACTIVE: 'rgba(0, 229, 255, 0.70)',
  TIME_FOCUS:  '#e8f6ff',
  TIME_BREAK:  'rgba(180, 225, 255, 0.60)',
  MODE_LABEL:  'rgba(0, 229, 255, 0.55)',
  DOT:         '#00e5ff',
  IDLE_RING:   'rgba(0, 229, 255, 0.06)',
} as const

// ── Component ─────────────────────────────────────────────────────────────────

interface TimerArcProps {
  remaining:    number
  mode:         TimerMode
  state:        TimerState
}

export function TimerArc({ remaining, mode, state }: TimerArcProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef    = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const draw = () => {
      const W   = canvas.offsetWidth
      const H   = canvas.offsetHeight
      const size = Math.min(W, H)   // always square regardless of element shape
      const dpr  = Math.min(window.devicePixelRatio ?? 1, 2)

      if (canvas.width !== W * dpr || canvas.height !== H * dpr) {
        canvas.width  = W * dpr
        canvas.height = H * dpr
      }

      const ctx = canvas.getContext('2d')!
      ctx.save()
      ctx.scale(dpr, dpr)
      ctx.clearRect(0, 0, W, H)

      const cx      = W / 2
      const cy      = H / 2
      const r       = size / 2 - STROKE_W * 1.5
      const total   = modeDuration(mode, DEFAULT_TIMER_CONFIG)
      const elapsed  = total - remaining
      const progress = Math.min(1, elapsed / total)     // 0 = just started, 1 = done
      const isFocus  = mode === 'focus'
      const fillColor = isFocus ? C.FILL : C.FILL_BREAK

      // ── Track ring ────────────────────────────────────────────────────────
      ctx.strokeStyle = state === 'idle' ? C.IDLE_RING : C.TRACK
      ctx.lineWidth   = STROKE_W
      ctx.lineCap     = 'round'
      ctx.beginPath()
      ctx.arc(cx, cy, r, START_ANGLE, START_ANGLE + SWEEP)
      ctx.stroke()

      // ── Fill arc ──────────────────────────────────────────────────────────
      if (progress > 0 && state !== 'idle') {
        const endAngle = START_ANGLE + SWEEP * progress

        // Glow (wider, dimmer)
        ctx.strokeStyle = C.GLOW
        ctx.lineWidth   = STROKE_W + 6
        ctx.globalAlpha = 0.5
        ctx.beginPath()
        ctx.arc(cx, cy, r, START_ANGLE, endAngle)
        ctx.stroke()
        ctx.globalAlpha = 1

        // Fill arc
        ctx.strokeStyle = fillColor
        ctx.lineWidth   = STROKE_W
        ctx.beginPath()
        ctx.arc(cx, cy, r, START_ANGLE, endAngle)
        ctx.stroke()

        // Dot at the tip
        const tipX = cx + Math.cos(endAngle) * r
        const tipY = cy + Math.sin(endAngle) * r
        ctx.fillStyle = fillColor
        ctx.shadowColor = fillColor
        ctx.shadowBlur  = 12
        ctx.beginPath()
        ctx.arc(tipX, tipY, STROKE_W / 2 + 1, 0, TAU)
        ctx.fill()
        ctx.shadowBlur = 0
      }

      // ── Tick marks ────────────────────────────────────────────────────────
      for (let t = 0; t <= TICK_COUNT; t++) {
        const tickProgress = t / TICK_COUNT
        const tickAngle    = START_ANGLE + SWEEP * tickProgress
        const tickPassed   = progress >= tickProgress && state !== 'idle'
        const inner = r - STROKE_W
        const outer = r + STROKE_W / 2

        ctx.strokeStyle = tickPassed ? C.TICK_ACTIVE : C.TICK
        ctx.lineWidth   = 1
        ctx.beginPath()
        ctx.moveTo(cx + Math.cos(tickAngle) * inner, cy + Math.sin(tickAngle) * inner)
        ctx.lineTo(cx + Math.cos(tickAngle) * outer, cy + Math.sin(tickAngle) * outer)
        ctx.stroke()
      }

      // ── Centre text ───────────────────────────────────────────────────────
      const timeStr = formatTime(remaining)
      const fontSize = Math.floor(size * 0.19)

      ctx.textAlign    = 'center'
      ctx.textBaseline = 'middle'

      // Time
      ctx.font      = `500 ${fontSize}px 'IBM Plex Mono', monospace`
      ctx.fillStyle = isFocus ? C.TIME_FOCUS : C.TIME_BREAK
      ctx.fillText(timeStr, cx, cy - fontSize * 0.12)

      // Mode label
      const labelSize = Math.floor(size * 0.065)
      ctx.font      = `400 ${labelSize}px 'IBM Plex Mono', monospace`
      ctx.fillStyle = C.MODE_LABEL
      ctx.letterSpacing = '0.15em'
      ctx.fillText(modeLabel(mode), cx, cy + fontSize * 0.68)
      ctx.letterSpacing = '0'

      // State overlay (paused / idle hint)
      if (state === 'paused') {
        ctx.font      = `400 ${Math.floor(size * 0.055)}px 'IBM Plex Mono', monospace`
        ctx.fillStyle = 'rgba(0, 229, 255, 0.35)'
        ctx.fillText('PAUSED', cx, cy + fontSize * 1.2)
      }

      ctx.restore()
      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafRef.current)
  }, [remaining, mode, state])

  return (
    <div className="timer-arc-wrapper">
      <canvas
        ref={canvasRef}
        className="timer-arc"
        aria-label={`${formatTime(remaining)} remaining — ${modeLabel(mode)}`}
      />
    </div>
  )
}
