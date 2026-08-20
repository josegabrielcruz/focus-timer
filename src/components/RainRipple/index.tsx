import { useEffect, useRef } from 'react'
import './RainRipple.css'

// ── Ripple physics ────────────────────────────────────────────────────────────
// Each "drop" spawns 1–2 concentric rings: a large primary ring and (60% chance)
// a smaller, faster secondary ring. The primary ring fades as it expands;
// the secondary gives the classic multi-ring water-drop silhouette.

interface Ripple {
  x:         number
  y:         number
  r:         number    // current radius (px)
  maxR:      number    // radius at which the ring disappears
  initAlpha: number    // starting opacity
  speed:     number    // radius growth per 60-fps frame
}

function spawnDrop(W: number, H: number): Ripple[] {
  const x = W * 0.1 + Math.random() * W * 0.8   // avoid very edge
  const y = H * 0.1 + Math.random() * H * 0.8
  const rings: Ripple[] = [
    {
      x, y, r: 0,
      maxR:      65 + Math.random() * 85,           // 65–150 px
      initAlpha: 0.09 + Math.random() * 0.09,       // 0.09–0.18
      speed:     0.28 + Math.random() * 0.32,       // 0.28–0.60 px/frame
    },
  ]
  // Secondary (inner) ring — tighter and faster
  if (Math.random() < 0.55) {
    rings.push({
      x, y, r: 0,
      maxR:      18 + Math.random() * 22,            // 18–40 px
      initAlpha: 0.05 + Math.random() * 0.06,        // 0.05–0.11
      speed:     0.65 + Math.random() * 0.55,        // 0.65–1.20 px/frame
    })
  }
  return rings
}

// ── Component ─────────────────────────────────────────────────────────────────

interface RainRippleProps {
  active: boolean
}

export function RainRipple({ active }: RainRippleProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Clear canvas when deactivated; don't start a loop
    if (!active) {
      const ctx = canvas.getContext('2d')
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
      return
    }

    // Respect reduced-motion preference — no animation
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const dpr = Math.min(window.devicePixelRatio ?? 1, 2)
    let W = window.innerWidth
    let H = window.innerHeight

    const resize = () => {
      W = window.innerWidth
      H = window.innerHeight
      canvas.width  = W * dpr
      canvas.height = H * dpr
      canvas.style.width  = `${W}px`
      canvas.style.height = `${H}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const ctx = canvas.getContext('2d')!
    resize()
    window.addEventListener('resize', resize)

    const ripples: Ripple[] = []
    let timeSinceSpawn = 0
    let nextSpawnDelay = 1000 + Math.random() * 2000   // first drop 1–3 s in
    let prevTs = performance.now()
    let rafId  = 0

    const loop = (ts: number) => {
      const dt = Math.min(ts - prevTs, 50)   // cap dt so tab-hidden spikes don't jump
      prevTs = ts

      ctx.clearRect(0, 0, W, H)

      // Maybe spawn a new drop
      timeSinceSpawn += dt
      if (timeSinceSpawn >= nextSpawnDelay) {
        timeSinceSpawn = 0
        nextSpawnDelay = 1200 + Math.random() * 2400   // 1.2–3.6 s between drops
        for (const r of spawnDrop(W, H)) ripples.push(r)
      }

      // Update and draw each ring
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rp    = ripples[i]
        rp.r        += rp.speed * (dt / 16.667)   // normalise to 60 fps
        const alpha = rp.initAlpha * (1 - rp.r / rp.maxR)

        if (rp.r >= rp.maxR || alpha < 0.003) {
          ripples.splice(i, 1)
          continue
        }

        ctx.beginPath()
        ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(0, 229, 255, ${alpha.toFixed(3)})`
        ctx.lineWidth   = 0.75
        ctx.stroke()
      }

      rafId = requestAnimationFrame(loop)
    }

    rafId = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', resize)
    }
  }, [active])

  return (
    <canvas
      ref={canvasRef}
      className="rain-ripple-canvas"
      aria-hidden="true"
    />
  )
}
