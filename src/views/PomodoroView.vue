<template>
  <div class="pomodoro-container">
    <div class="header">
      <h1 class="title">Deep Work Room</h1>
      <p class="subtitle">Co-working · Mon–Fri · 11am–5pm IST</p>
      <a class="meet-link" :href="MEET_URL" target="_blank" rel="noopener">
        <span class="meet-dot"></span>
        Join Google Meet → {{ MEET_HANDLE }}
      </a>
    </div>

    <div v-if="!soundsEnabled" class="sound-banner">
      <button class="sound-enable-btn" @click="enableSounds">
        🔊 Click to enable phase-change sounds
      </button>
      <p class="sound-hint">
        If you're screen-sharing on Meet, turn on <strong>"Share tab audio"</strong> so the room hears the beeps too.
      </p>
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

          <PomodoroCircle
            :progress="pomodoroState.progress"
            :phase="circlePhase"
          />

          <div class="countdown">
            <div class="time-display">{{ formatTime(pomodoroState.remainingSeconds) }}</div>
            <div class="time-label">remaining</div>
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
        <PersonalTaskTracker />
      </div>
    </div>
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
const { completeSession, currentTask } = usePersonalTasks()

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
})
onUnmounted(() => {
  if (nowInterval) clearInterval(nowInterval)
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
// AudioContext must be created or resumed inside a user gesture, otherwise
// browsers keep it 'suspended' and beeps are silent. We surface an explicit
// "Enable sounds" button so a drop-in user can unlock audio deliberately.
let audioContext: AudioContext | null = null
const soundsEnabled = ref(false)

const enableSounds = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume()
  }
  soundsEnabled.value = true
  // Confirmation blip so the user knows it worked.
  generateBeep(880, 0.12)
}

const generateBeep = (frequency: number, duration: number) => {
  const ctx = audioContext
  if (!ctx || ctx.state !== 'running') return
  try {
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()
    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)
    oscillator.frequency.value = frequency
    oscillator.type = 'sine'
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration)
    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + duration)
  } catch (error) {
    console.error('Failed to play beep:', error)
  }
}

// Work block starting: ascending 3-note chord, repeated twice.
const playWorkStartSound = () => {
  generateBeep(440, 0.15)
  setTimeout(() => generateBeep(554, 0.15), 150)
  setTimeout(() => generateBeep(659, 0.3), 300)
  setTimeout(() => generateBeep(440, 0.15), 700)
  setTimeout(() => generateBeep(554, 0.15), 850)
  setTimeout(() => generateBeep(659, 0.3), 1000)
}

// Break starting: four gentle chimes.
const playBreakStartSound = () => {
  generateBeep(523, 0.2)
  setTimeout(() => generateBeep(523, 0.2), 250)
  setTimeout(() => generateBeep(523, 0.2), 500)
  setTimeout(() => generateBeep(523, 0.2), 750)
}

// ---- Phase transitions ----
const previousRemainingSeconds = ref(pomodoroState.value.remainingSeconds)
watch(
  () => pomodoroState.value.phase,
  (newPhase, oldPhase) => {
    if (!oldPhase || oldPhase === newPhase) return

    // Save task history when a work block completes with a task entered.
    if (oldPhase === 'work' && currentTask.value.trim()) {
      completeSession('work', previousRemainingSeconds.value)
    }

    // Play sound for the *arriving* phase so the cue lines up with "heads up, switch now."
    if (newPhase === 'work') playWorkStartSound()
    else if (newPhase === 'break') playBreakStartSound()
  }
)
watch(
  () => pomodoroState.value.remainingSeconds,
  (newSeconds) => {
    previousRemainingSeconds.value = newSeconds
  }
)
</script>

<style scoped>
.pomodoro-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
  color: white;
}

.header {
  text-align: center;
  margin-bottom: 2rem;
}

.content-wrapper {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

@media (min-width: 1024px) {
  .content-wrapper {
    grid-template-columns: 1fr 400px;
  }
}

.side-panel {
  min-height: 600px;
}

.title {
  font-size: 3rem;
  font-weight: 800;
  margin: 0;
  background: linear-gradient(135deg, #fff 0%, #e0e7ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  font-size: 1.25rem;
  margin: 0.5rem 0 0 0;
  opacity: 0.9;
  font-weight: 300;
}

.meet-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
  padding: 0.625rem 1.125rem;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 999px;
  color: white;
  text-decoration: none;
  font-size: 0.9375rem;
  font-weight: 500;
  transition: all 0.2s;
}

.meet-link:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: translateY(-1px);
}

.meet-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #34d399;
  box-shadow: 0 0 10px #34d399;
}

.sound-banner {
  max-width: 1400px;
  margin: 0 auto 1.5rem;
  padding: 1rem 1.25rem;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 1rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.sound-enable-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.75rem;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(16, 185, 129, 0.4);
  transition: all 0.2s;
}

.sound-enable-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(16, 185, 129, 0.5);
}

.sound-hint {
  margin: 0;
  font-size: 0.875rem;
  opacity: 0.85;
}

.main-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.off-hours {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 2rem;
  padding: 4rem 2rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.pulse-dot {
  width: 20px;
  height: 20px;
  background: #fff;
  border-radius: 50%;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.2); }
}

.off-hours h2 {
  margin: 0;
  font-size: 2rem;
}

.off-hours p {
  margin: 0.25rem 0;
  opacity: 0.9;
}

.countdown-to-next {
  font-size: 1.125rem;
  opacity: 0.75 !important;
  font-variant-numeric: tabular-nums;
}

.timer-active {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 2rem;
  padding: 2rem;
}

.phase-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.phase-badge {
  padding: 0.75rem 1.5rem;
  border-radius: 2rem;
  font-weight: 600;
  font-size: 1.125rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.phase-badge.phase-work {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  box-shadow: 0 4px 20px rgba(239, 68, 68, 0.4);
}

.phase-badge.phase-break {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  box-shadow: 0 4px 20px rgba(59, 130, 246, 0.4);
}

.cycle-progress {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: flex-end;
}

.progress-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  opacity: 0.7;
  font-weight: 500;
}

.progress-dots {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.progress-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.progress-dot.dot-done {
  background: rgba(255, 255, 255, 0.4);
}

.progress-dot.dot-work {
  background: #ef4444;
  box-shadow: 0 0 12px #ef4444;
  animation: pulse-dot 2s ease-in-out infinite;
}

.progress-dot.dot-break {
  background: #3b82f6;
  box-shadow: 0 0 12px #3b82f6;
  animation: pulse-dot 2s ease-in-out infinite;
}

.progress-dot.dot-future {
  background: rgba(255, 255, 255, 0.15);
}

@keyframes pulse-dot {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.3); }
}

.countdown {
  text-align: center;
  margin: 2rem 0;
}

.time-display {
  font-size: 4rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.05em;
  text-shadow: 0 2px 20px rgba(0, 0, 0, 0.2);
}

.time-label {
  font-size: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  opacity: 0.7;
  margin-top: 0.5rem;
}

.phase-description {
  text-align: center;
  margin-top: 2rem;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 1rem;
}

.phase-description p {
  margin: 0;
  font-size: 1.125rem;
  line-height: 1.6;
  opacity: 0.9;
}

.info-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 1rem;
  padding: 1.5rem;
}

.info-card h3 {
  margin: 0 0 1rem 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.info-card ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.info-card li {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1rem;
}

.phase-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  display: inline-block;
}

.phase-dot.work {
  background: #ef4444;
  box-shadow: 0 0 10px rgba(239, 68, 68, 0.6);
}

.phase-dot.break {
  background: #3b82f6;
  box-shadow: 0 0 10px rgba(59, 130, 246, 0.6);
}

.phase-dot.off {
  background: rgba(255, 255, 255, 0.4);
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
  .pomodoro-container { padding: 1.25rem; }
  .title { font-size: 2rem; }
  .subtitle { font-size: 1rem; }
  .meet-link { font-size: 0.8125rem; }
  .time-display { font-size: 2.75rem; }
  .timer-active { padding: 1.5rem; }
  .phase-header { flex-direction: column; align-items: flex-start; }
  .cycle-progress { align-items: flex-start; }
  .phase-badge { font-size: 0.875rem; padding: 0.5rem 1rem; }
}

@media (max-height: 600px) and (orientation: landscape) {
  .pomodoro-container { padding: 1rem; }
  .header { margin-bottom: 1rem; }
  .title { font-size: 1.75rem; }
  .time-display { font-size: 2.5rem; }
  .countdown { margin: 1rem 0; }
}
</style>
