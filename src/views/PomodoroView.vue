<template>
  <div class="pomodoro-container">
    <div class="header">
      <h1 class="title font-hand">Cadence</h1>
      <p class="subtitle">Co-working · Mon–Fri · 11am–5pm IST</p>
      <a class="meet-link" :href="MEET_URL" target="_blank" rel="noopener">
        <span class="meet-dot"></span>
        Work with others →
      </a>
      <p class="ist-clock">{{ istClock }}</p>
    </div>

    <div class="content-wrapper">
      <div class="main-content">
        <div v-if="pomodoroState.phase === 'off-hours'" class="off-hours">
          <div class="pulse-dot"></div>
          <h2>Off-hours</h2>
          <p v-if="pomodoroState.nextSessionStart">
            Next session:
            <strong>{{ formatNextStart(pomodoroState.nextSessionStart) }}</strong>
          </p>
          <p v-if="pomodoroState.nextSessionStart" class="countdown-to-next">
            starts in {{ formatCountdown(pomodoroState.nextSessionStart - now) }}
          </p>
        </div>

        <div v-else class="timer-active">
          <div class="phase-header">
            <div class="phase-badge" :class="`phase-${pomodoroState.phase}`">
              {{ pomodoroState.phaseLabel }}
            </div>
            <div class="cycle-progress">
              <div class="progress-label">Today's Blocks</div>
              <div class="progress-dots">
                <div
                  v-for="i in BLOCKS_PER_DAY"
                  :key="i"
                  class="progress-dot"
                  :class="dotClass(i - 1)"
                  :title="`Block ${i}`"
                ></div>
              </div>
            </div>
          </div>

          <div class="circle-wrap">
            <PomodoroCircle
              :progress="pomodoroState.progress"
              :phase="circlePhase"
            />
            <div class="countdown">
              <div class="time-display">{{ formatTime(pomodoroState.remainingSeconds) }}</div>
              <div class="time-label">remaining</div>
            </div>
          </div>

          <div class="phase-description">
            <p v-if="pomodoroState.phase === 'work'">
              Focus mode. Camera optional — just work on your thing.
            </p>
            <p v-else>
              Quick break. Stretch, breathe, hydrate.
            </p>
          </div>
        </div>

        <div class="info-section">
          <div class="info-card">
            <h3>Schedule</h3>
            <ul>
              <li><span class="phase-dot work"></span> 50 min Work</li>
              <li><span class="phase-dot break"></span> 10 min Break</li>
              <li><span class="phase-dot off"></span> Mon–Fri · 11am–5pm IST · 6 blocks/day</li>
            </ul>
          </div>
        </div>
      </div>

      <div class="side-panel">
        <div class="rules-card">
          <h3>How to Participate</h3>
          <ol class="rules-list">
            <li>
              <strong>Pick one thing</strong> you want to complete or make real progress on in the next 50 minutes.
            </li>
            <li>
              <strong>Share in chat</strong> what you're working on. It may help with accountability.
            </li>
            <li>
              <strong>During breaks</strong>, share in chat how it went, any insights, or interesting links.
            </li>
            <li>
              <strong>Mics off</strong> throughout. Use the chatbox to talk during breaks.
            </li>
          </ol>
        </div>
        <PersonalTaskTracker :is-off-hours="pomodoroState.phase === 'off-hours'" />
      </div>
    </div>

    <details class="suggestions-section">
      <summary class="suggestions-toggle">Not sure what to work on?</summary>
      <div class="suggestions-content">
        <p class="suggestions-intro">Some reading for a meaningful session:</p>
        <ul class="suggestions-list">
          <li>
            <a href="https://claude.ai/public/artifacts/532cdf10-05dc-4ca3-9859-78694039f9d4" target="_blank" rel="noopener">
              Does co-working actually work?
            </a>
            — Evidence is all over the place
          </li>
          <li>
            <a href="https://civilizationemerging.com/dharma-inquiry-2/" target="_blank" rel="noopener">
              Dharma Inquiry
            </a>
            — Explore what you truly value
          </li>
          <li>
            <a href="https://www.lesswrong.com/highlights" target="_blank" rel="noopener">
              LessWrong Highlights
            </a>
            — Best posts on rationality
          </li>
          <li>
            <a href="https://donellameadows.org/archives/leverage-points-places-to-intervene-in-a-system/" target="_blank" rel="noopener">
              Leverage Points
            </a>
            — Donella Meadows on systems thinking
          </li>
          <li>
            <a href="https://consilienceproject.org/development-in-progress/" target="_blank" rel="noopener">
              Development in Progress
            </a>
            — Questioning traditional views of human progress
          </li>
          <li>
            <a href="https://systems-souls-society.com/tasting-the-pickle-ten-flavours-of-meta-crisis-and-the-appetite-for-a-new-civilisation/" target="_blank" rel="noopener">
              Tasting the Pickle
            </a>
            — Ten flavours of meta-crisis
          </li>
        </ul>
      </div>
    </details>
  </div>
</template>

<script setup lang="ts">
import { watch, ref, computed, onMounted, onUnmounted } from 'vue'
import { usePomodoro, BLOCKS_PER_DAY } from '@/composables/usePomodoro'
import { usePersonalTasks } from '@/composables/usePersonalTasks'
import PomodoroCircle from '@/components/PomodoroCircle.vue'
import PersonalTaskTracker from '@/components/PersonalTaskTracker.vue'

const MEET_URL = 'https://meet.google.com/sgs-iykc-ubr'
const MEET_HANDLE = 'meet.google.com/sgs-iykc-ubr'

const { state: pomodoroState, formatTime, formatNextStart } = usePomodoro()
const { completeSession, currentTasks } = usePersonalTasks()

const circlePhase = computed<'work' | 'break'>(() =>
  pomodoroState.value.phase === 'break' ? 'break' : 'work'
)

const dotClass = (i: number): string => {
  const cur = pomodoroState.value.blockIndex
  if (i < cur) return 'dot-done'
  if (i === cur) {
    return pomodoroState.value.phase === 'work' ? 'dot-work' : 'dot-break'
  }
  return 'dot-future'
}

const now = ref(Date.now())
let nowInterval: number | undefined
onMounted(() => {
  nowInterval = window.setInterval(() => (now.value = Date.now()), 1000)
  window.addEventListener('pointerdown', handleFirstGesture, { once: true })
  window.addEventListener('keydown', handleFirstGesture, { once: true })
  window.addEventListener('touchstart', handleFirstGesture, { once: true })
})
onUnmounted(() => {
  if (nowInterval) clearInterval(nowInterval)
  window.removeEventListener('pointerdown', handleFirstGesture)
  window.removeEventListener('keydown', handleFirstGesture)
  window.removeEventListener('touchstart', handleFirstGesture)
  document.title = 'Cadence'
})

// Update tab title with countdown
watch(
  () => [pomodoroState.value.phase, pomodoroState.value.remainingSeconds] as const,
  ([phase, remaining]) => {
    if (phase === 'off-hours') {
      document.title = 'Cadence'
    } else {
      const time = formatTime(remaining)
      const label = phase === 'work' ? 'Work' : 'Break'
      document.title = `${time} ${label} | Cadence`
    }
  },
  { immediate: true }
)

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000
const istClock = computed(() => {
  const shifted = new Date(now.value + IST_OFFSET_MS)
  const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][shifted.getUTCDay()]
  const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][shifted.getUTCMonth()]
  const date = shifted.getUTCDate()
  const h24 = shifted.getUTCHours()
  const hour = ((h24 + 11) % 12) + 1
  const minute = shifted.getUTCMinutes().toString().padStart(2, '0')
  const ampm = h24 < 12 ? 'AM' : 'PM'
  return `${weekday}, ${date} ${month} · ${hour}:${minute} ${ampm} IST`
})

const formatCountdown = (ms: number): string => {
  if (ms <= 0) return '0s'
  const totalSec = Math.floor(ms / 1000)
  const days = Math.floor(totalSec / 86400)
  const hours = Math.floor((totalSec % 86400) / 3600)
  const mins = Math.floor((totalSec % 3600) / 60)
  const secs = totalSec % 60
  if (days > 0) return `${days}d ${hours}h ${mins}m`
  if (hours > 0) return `${hours}h ${mins}m ${secs}s`
  if (mins > 0) return `${mins}m ${secs}s`
  return `${secs}s`
}

// ---- Audio ----
// Three cues, named by what's ending (matches the user's mental model):
//   pomo-over    → a work pomo just ended (→ entering a break)
//   break-over   → a break just ended (→ entering a work block)
//   day-complete → the final block of the day ended (→ off-hours)
// HTMLAudioElement needs a user gesture before `.play()` is allowed, so we
// silently prime each clip on the first pointerdown/keydown/touch.
const pomoOverSound = new Audio('/pomo-over.mp3')
const breakOverSound = new Audio('/break-over.mp3')
const dayCompleteSound = new Audio('/day-complete.mp3')
const allSounds = [pomoOverSound, breakOverSound, dayCompleteSound]
allSounds.forEach((a) => (a.preload = 'auto'))

const handleFirstGesture = () => {
  // Prime each clip: play muted + immediately pause so future autoplay is allowed.
  allSounds.forEach((a) => {
    const prevVolume = a.volume
    a.volume = 0
    a.play()
      .then(() => {
        a.pause()
        a.currentTime = 0
        a.volume = prevVolume
      })
      .catch(() => {
        a.volume = prevVolume
      })
  })
  window.removeEventListener('pointerdown', handleFirstGesture)
  window.removeEventListener('keydown', handleFirstGesture)
  window.removeEventListener('touchstart', handleFirstGesture)
}

const play = (audio: HTMLAudioElement) => {
  audio.currentTime = 0
  audio.play().catch(() => {
    // If the browser still refuses (no prior gesture), fail silently.
  })
}

// ---- Phase transitions ----
// The checklist stays live through the 10-min break so the user can strike,
// edit, or remove items. It auto-commits when the break ends (→ work or
// → off-hours). Users can also hit "Save to Recent Sessions" at any time.
const WORK_DURATION_SEC = 50 * 60
watch(
  () => pomodoroState.value.phase,
  (newPhase, oldPhase) => {
    if (!oldPhase || oldPhase === newPhase) return

    if (oldPhase === 'break' && currentTasks.value.length > 0) {
      completeSession('work', WORK_DURATION_SEC)
    }

    // Sound cues, named by what just ended.
    if (newPhase === 'off-hours') {
      play(dayCompleteSound)
    } else if (oldPhase === 'work' && newPhase === 'break') {
      play(pomoOverSound)
    } else if (oldPhase === 'break' && newPhase === 'work') {
      play(breakOverSound)
    }
  }
)
</script>

<style scoped>
.pomodoro-container {
  min-height: 100vh;
  padding: 2.5rem 2rem;
  color: var(--ink);
}

.header {
  text-align: center;
  margin-bottom: 2.5rem;
}

.content-wrapper {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
  max-width: 1280px;
  margin: 0 auto;
}

@media (min-width: 1024px) {
  .content-wrapper {
    grid-template-columns: 1fr 360px;
    gap: 2.5rem;
  }
}

.side-panel {
  min-height: 600px;
}

.title {
  font-size: 4rem;
  line-height: 1;
  margin: 0;
  color: var(--ink);
}

.subtitle {
  font-size: 0.9375rem;
  margin: 0.75rem 0 0 0;
  color: var(--ink-muted);
  letter-spacing: 0.02em;
}

.meet-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1.25rem;
  padding: 0.5rem 1rem;
  background: transparent;
  border: 1px solid var(--ink-hair);
  border-radius: 999px;
  color: var(--ink);
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;
}

.meet-link:hover {
  background: var(--paper-soft);
  border-color: var(--ink-soft);
}

.meet-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--break);
  animation: soft-pulse 2.4s ease-in-out infinite;
}

.ist-clock {
  margin: 0.875rem 0 0 0;
  font-size: 0.8125rem;
  color: var(--ink-muted);
  letter-spacing: 0.02em;
  font-variant-numeric: tabular-nums;
}

@keyframes soft-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.main-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Paper card — translucent cream sheet so the backdrop whispers through */
.off-hours,
.timer-active,
.info-card {
  background: var(--card-bg);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  border: 1px solid var(--ink-hair);
  border-radius: var(--radius-lg);
  padding: 2rem;
}

.off-hours {
  padding: 4rem 2rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.pulse-dot {
  width: 14px;
  height: 14px;
  background: var(--ink-soft);
  border-radius: 50%;
  animation: soft-pulse 2.4s ease-in-out infinite;
  margin-bottom: 0.5rem;
}

.off-hours h2 {
  margin: 0;
  font-family: 'Caveat', cursive;
  font-size: 2.75rem;
  font-weight: 700;
  color: var(--ink);
}

.off-hours p {
  margin: 0.125rem 0;
  color: var(--ink-soft);
}

.countdown-to-next {
  font-size: 0.9375rem;
  color: var(--ink-muted) !important;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.02em;
}

.phase-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.75rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.phase-badge {
  padding: 0.375rem 0.875rem;
  border-radius: 999px;
  font-weight: 500;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  border: 1px solid;
}

.phase-badge.phase-work {
  background: var(--work-soft);
  border-color: var(--work);
  color: #8b4a35;
}

.phase-badge.phase-break {
  background: var(--break-soft);
  border-color: var(--break);
  color: #5b6a44;
}

.cycle-progress {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: flex-end;
}

.progress-label {
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: var(--ink-muted);
  font-weight: 500;
}

.progress-dots {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.progress-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  transition: all 0.3s ease;
  border: 1px solid var(--ink-hair);
}

.progress-dot.dot-done {
  background: var(--ink-soft);
  border-color: var(--ink-soft);
}

.progress-dot.dot-work {
  background: var(--work);
  border-color: var(--work);
  animation: soft-pulse 2s ease-in-out infinite;
}

.progress-dot.dot-break {
  background: var(--break);
  border-color: var(--break);
  animation: soft-pulse 2s ease-in-out infinite;
}

.progress-dot.dot-future {
  background: transparent;
}

.circle-wrap {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
}

.countdown {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  pointer-events: none;
}

.time-display {
  font-family: 'Caveat', cursive;
  font-size: 4.5rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.02em;
  line-height: 1;
  color: var(--ink);
}

.time-label {
  font-size: 0.625rem;
  text-transform: uppercase;
  letter-spacing: 0.25em;
  color: var(--ink-muted);
  margin-top: 0.375rem;
}

.phase-description {
  text-align: center;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--ink-hair);
}

.phase-description p {
  margin: 0;
  font-size: 0.9375rem;
  line-height: 1.6;
  color: var(--ink-soft);
  font-style: italic;
}

.info-card h3,
.rules-card h3 {
  margin: 0 0 1rem 0;
  font-family: 'Caveat', cursive;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--ink);
}

.rules-card {
  background: var(--card-bg);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  border: 1px solid var(--ink-hair);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.rules-list {
  margin: 0;
  padding: 0 0 0 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.rules-list li {
  font-size: 0.9375rem;
  line-height: 1.5;
  color: var(--ink-soft);
}

.rules-list strong {
  color: var(--ink);
  font-weight: 600;
}

.info-card ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.info-card li {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.9375rem;
  color: var(--ink-soft);
}

.phase-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
  flex-shrink: 0;
}

.phase-dot.work {
  background: var(--work);
}

.phase-dot.break {
  background: var(--break);
}

.phase-dot.off {
  background: transparent;
  border: 1px solid var(--ink-hair);
}

@media (max-width: 1023px) {
  .content-wrapper {
    grid-template-columns: 1fr;
  }
  .side-panel {
    order: 2;
    min-height: auto;
  }
  .main-content {
    order: 1;
  }
}

@media (max-width: 639px) {
  .pomodoro-container { padding: 1.5rem 1.25rem; }
  .title { font-size: 2.75rem; }
  .subtitle { font-size: 0.875rem; }
  .meet-link { font-size: 0.8125rem; }
  .time-display { font-size: 3.25rem; }
  .timer-active,
  .off-hours,
  .info-card { padding: 1.5rem; }
  .off-hours { padding: 3rem 1.5rem; }
  .phase-header { flex-direction: column; align-items: flex-start; }
  .cycle-progress { align-items: flex-start; }
}

@media (max-height: 600px) and (orientation: landscape) {
  .pomodoro-container { padding: 1rem; }
  .header { margin-bottom: 1rem; }
  .title { font-size: 2.25rem; }
  .time-display { font-size: 2.75rem; }
}

/* Collapsible suggestions at the bottom */
.suggestions-section {
  max-width: 1280px;
  margin: 2.5rem auto 0;
  padding-top: 1.5rem;
  border-top: 1px dashed var(--ink-hair);
}

.suggestions-toggle {
  cursor: pointer;
  font-size: 0.875rem;
  color: var(--ink-muted);
  font-style: italic;
  list-style: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.suggestions-toggle::-webkit-details-marker {
  display: none;
}

.suggestions-toggle::before {
  content: '+';
  font-style: normal;
  font-weight: 500;
  font-size: 1rem;
  color: var(--ink-soft);
  transition: transform 0.2s;
}

details[open] .suggestions-toggle::before {
  content: '−';
}

.suggestions-content {
  margin-top: 1rem;
  padding: 1rem 1.25rem;
  background: var(--card-bg);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  border: 1px solid var(--ink-hair);
  border-radius: var(--radius);
}

.suggestions-intro {
  margin: 0 0 0.75rem;
  font-size: 0.8125rem;
  color: var(--ink-soft);
}

.suggestions-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.suggestions-list li {
  font-size: 0.875rem;
  color: var(--ink-soft);
  line-height: 1.5;
}

.suggestions-list a {
  color: var(--ink);
  font-weight: 500;
}
</style>
