# Mission Timer

A focus timer that doubles as an ambient environment. It synthesizes sound — pink noise, binaural beats, an evolving FM drone — entirely in the browser while you work. Session history persists locally as a heatmap.

**[Live Demo](https://josegabrielcruz.github.io/focus-timer)**

---

## What Makes It Different

Most Pomodoro timers are countdown apps. This one is a **focus room**.

- **Synthesized ambient audio** — no audio files. Pink/white/brown noise, binaural beats, and a slow FM drone are generated with Tone.js and evolve over the session. The soundscape changes texture near the end of a session as a non-jarring warning.
- **Ambient mode** — press `F` and the interface fades away. Only the arc timer remains. The browser window becomes a focus environment, not a productivity dashboard.
- **Session history heatmap** — a 12-week contribution-style grid stored in localStorage shows your focus streak at a glance.
- **HUD aesthetic** — styled as a mission timer, not a to-do widget.

---

## Controls

| Action | Keyboard | UI |
|---|---|---|
| Start / Pause / Resume | `Space` | Primary button |
| Skip to next segment | `S` | SKIP button |
| Reset | `R` | RESET button |
| Toggle ambient mode | `F` | ◎ AMBIENT button |
| Toggle sound | `M` | ♪ SOUND button |

---

## Audio Layers

All synthesis happens in the browser via the Web Audio API. **Sound requires headphones to appreciate the binaural beat effect.**

| Layer | What it is |
|---|---|
| **Noise** | Pink/white/brown noise through a warm low-pass filter. Most effective for masking distractions. |
| **Binaural beat** | Two oscillators (200 Hz ± delta) panned to opposite ears. The beating rate matches brainwave frequencies: 8 Hz = alpha (relaxed focus), 14 Hz = beta (active focus). |
| **Drone** | FM synthesis with a slow LFO on modulation index. Creates an organic, living tone that never repeats exactly. |
| **Chime** | Ascending pentatonic arpeggio on focus session complete. Single bell tone on break complete. |

---

## Session Durations

| Mode | Default |
|---|---|
| Focus | 25 min |
| Short break | 5 min |
| Long break (every 4th session) | 15 min |

---

## Tech Stack

- **Vite** + **React 19** + **TypeScript**
- **Tone.js 14** — noise synthesis, FM drone, binaural beat generation, chime sequencing
- **Canvas API** — timer arc, session heatmap
- No external animation libraries, no audio files

---

## Running Locally

```bash
npm install
npm run dev
```

Requires Node 18+.
