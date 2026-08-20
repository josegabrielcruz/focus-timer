import { useEffect, useRef } from 'react'
import { Session } from '../../types'
import './SessionLog.css'

// ── Heatmap constants ─────────────────────────────────────────────────────────

const WEEKS      = 12    // columns — how far back to show
const CELL       = 12    // px per cell
const GAP        = 3     // px between cells
const LABEL_W    = 24    // px left for day labels
const HEADER_H   = 18    // px top for month labels
const DAYS       = ['M','T','W','T','F','S','S']

const C = {
  BG:       '#0c1220',
  CELL_0:   'rgba(0, 229, 255, 0.05)',
  CELL_1:   'rgba(0, 229, 255, 0.22)',
  CELL_2:   'rgba(0, 229, 255, 0.42)',
  CELL_3:   'rgba(0, 229, 255, 0.62)',
  CELL_4:   'rgba(0, 229, 255, 0.82)',
  TODAY:    'rgba(0, 229, 255, 1.0)',
  LABEL:    'rgba(90, 150, 200, 0.45)',
  MONTH:    'rgba(0, 229, 255, 0.35)',
  FONT:     `${CELL}px 'IBM Plex Mono', monospace`,
} as const

function cellColor(count: number): string {
  if (count <= 0) return C.CELL_0
  if (count === 1) return C.CELL_1
  if (count === 2) return C.CELL_2
  if (count === 3) return C.CELL_3
  return C.CELL_4
}

// ── Component ─────────────────────────────────────────────────────────────────

interface SessionLogProps {
  sessions: Session[]
}

export function SessionLog({ sessions }: SessionLogProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // ── Build date grid ────────────────────────────────────────────────────
    // Work backwards from today to get 12 complete weeks aligned to Mon.
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Find most recent Monday (day 0 = Sunday in JS, so Mon = 1)
    const dayOfWeek = (today.getDay() + 6) % 7   // Mon = 0 … Sun = 6
    const monday    = new Date(today)
    monday.setDate(today.getDate() - dayOfWeek)

    // Build WEEKS columns of 7 days, oldest first
    const grid: Date[][] = []
    for (let w = WEEKS - 1; w >= 0; w--) {
      const col: Date[] = []
      for (let d = 0; d < 7; d++) {
        const date = new Date(monday)
        date.setDate(monday.getDate() - w * 7 + d)
        col.push(date)
      }
      grid.push(col)
    }

    // ── Count sessions per day ─────────────────────────────────────────────
    const countByDay = new Map<string, number>()
    sessions
      .filter(s => s.type === 'focus' && s.completed)
      .forEach(s => {
        const key = new Date(s.startTime).toDateString()
        countByDay.set(key, (countByDay.get(key) ?? 0) + 1)
      })

    // ── Canvas sizing ──────────────────────────────────────────────────────
    const step  = CELL + GAP
    const W     = LABEL_W + WEEKS * step - GAP
    const H     = HEADER_H + 7 * step - GAP
    const dpr   = Math.min(window.devicePixelRatio ?? 1, 2)

    canvas.width  = W * dpr
    canvas.height = H * dpr
    canvas.style.width  = `${W}px`
    canvas.style.height = `${H}px`

    const ctx = canvas.getContext('2d')!
    ctx.scale(dpr, dpr)

    ctx.fillStyle = C.BG
    ctx.fillRect(0, 0, W, H)

    // ── Day labels ─────────────────────────────────────────────────────────
    ctx.font      = C.FONT
    ctx.fillStyle = C.LABEL
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    for (let d = 0; d < 7; d++) {
      const y = HEADER_H + d * step + CELL / 2
      ctx.fillText(DAYS[d], LABEL_W / 2, y)
    }

    // ── Month labels ────────────────────────────────────────────────────────
    const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    let lastMonth = -1
    grid.forEach((col, w) => {
      const m = col[0].getMonth()
      if (m !== lastMonth) {
        lastMonth = m
        const x = LABEL_W + w * step
        ctx.font      = `${CELL - 1}px 'IBM Plex Mono', monospace`
        ctx.fillStyle = C.MONTH
        ctx.textAlign = 'left'
        ctx.fillText(MONTHS[m], x, HEADER_H / 2)
      }
    })

    // ── Cells ──────────────────────────────────────────────────────────────
    const todayStr = today.toDateString()
    grid.forEach((col, w) => {
      col.forEach((date, d) => {
        // Don't render future days
        if (date > today) return

        const count  = countByDay.get(date.toDateString()) ?? 0
        const isToday = date.toDateString() === todayStr
        const x = LABEL_W + w * step
        const y = HEADER_H + d * step

        ctx.fillStyle = isToday && count === 0 ? 'rgba(0, 229, 255, 0.12)' : cellColor(count)
        ctx.fillRect(x, y, CELL, CELL)

        // Today border
        if (isToday) {
          ctx.strokeStyle = 'rgba(0, 229, 255, 0.50)'
          ctx.lineWidth   = 0.75
          ctx.strokeRect(x + 0.375, y + 0.375, CELL - 0.75, CELL - 0.75)
        }
      })
    })
  }, [sessions])

  return (
    <div className="session-log">
      <div className="session-log__header">
        <span className="session-log__title">Mission Log</span>
        <span className="session-log__legend">
          <span className="legend-box legend-box--none" />
          <span className="legend-box legend-box--some" />
          <span className="legend-box legend-box--mid" />
          <span className="legend-box legend-box--many" />
          <span className="legend-label">fewer → more</span>
        </span>
      </div>
      <div className="session-log__canvas-wrap">
        <canvas ref={canvasRef} aria-label="Session history heatmap" />
      </div>
    </div>
  )
}
