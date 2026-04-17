# Cadence

A static Pomodoro timer for a drop-in co-working group. Runs **Mon–Fri, 11am–5pm IST**, cycling **50 min work / 10 min break** — 6 blocks per day. Everything is computed client-side from wall-clock IST, so anyone loading the page sees the current block's remaining time. No server, no host, no login.

Group meets over Google Meet: **meet.google.com/sgs-iykc-ubr**

## How it works

- **Schedule-driven:** the timer isn't started by anyone — it's derived from the current IST time-of-day. Outside the window (weekends, before 11am, after 5pm) the page shows an "Off-hours" card with a countdown to the next 11am session.
- **Drop-in friendly:** join anytime. A latecomer at 2:37pm immediately sees "Work 4/6 · 23 min remaining."
- **Zero infrastructure:** purely static, deployable to any CDN (Vercel / Netlify / Cloudflare Pages / GitHub Pages).
- **Personal task tracker:** each user can jot down what they're working on; completed sessions are kept in their own browser's localStorage.
- **Phase-change sounds:** audible beeps on work↔break transitions. Click "Enable sounds" once after loading so the browser allows audio. When screen-sharing on Meet, enable *Share tab audio* so everyone hears the chimes.

## Tech Stack

Vue 3 + TypeScript, Vite, D3.js for the progress ring.

## Setup

```bash
npm install
npm run dev     # http://localhost:5173
npm run build   # outputs static site to dist/
```

Node 20.19+ or 22.12+.

## Schedule

IST is UTC+5:30 (no DST). The client reads the device clock directly — modern OSes are NTP-synced within a second.

```
Mon–Fri, 11:00 – 17:00 IST
Block N (N=1..6): [11:00 + (N-1)*60min]
  ├── Work  (50 min)
  └── Break (10 min)
Last break ends at 17:00.
```

Outside the window or on weekends, the UI counts down to the next 11am session.

## Project structure

```
├── src/
│   ├── components/
│   │   ├── PersonalTaskTracker.vue — per-user task + session history (localStorage)
│   │   └── PomodoroCircle.vue      — D3 progress ring
│   ├── composables/
│   │   ├── usePomodoro.ts          — IST schedule state machine
│   │   └── usePersonalTasks.ts     — localStorage-backed task list
│   └── views/PomodoroView.vue      — main page
└── server/                         — [unused] prior Socket.io backend, kept for future re-use
```

The `server/` directory is preserved but not deployed. If the group later needs a shared admin pause (or any cross-device state), that code is the starting point — see git history around `6ff6a56` for context.

## Deploy

Any static host works. Build output is `dist/` after `npm run build`.

## License

MIT
