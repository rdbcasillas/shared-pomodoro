<template>
  <div class="pomodoro-container">
    <div class="header">
      <h1 class="title">The Loop</h1>
      <p class="subtitle">Global Focus Rhythm</p>
    </div>

    <div class="main-content">
      <div v-if="!isConnected" class="loading-state">
        <div class="spinner"></div>
        <p>Connecting to The Loop...</p>
      </div>

      <div v-else-if="!pomodoroState.isRunning" class="not-started">
        <div class="waiting-message">
          <div class="pulse-dot"></div>
          <h2>Waiting to Start</h2>
          <p>The global Pomodoro session hasn't started yet.</p>
          <p class="admin-note" v-if="isAdmin">Admin: Use the controls below to start the timer</p>
          <p class="admin-note" v-else>Waiting for admin to start the global timer...</p>
        </div>
      </div>

      <div v-else class="timer-active">
        <div class="phase-header">
          <div class="phase-badge" :class="`phase-${pomodoroState.phase}`">
            {{ pomodoroState.phaseLabel }}
          </div>
          <div class="cycle-indicator">
            Cycle {{ pomodoroState.cycleNumber }} of 4
          </div>
        </div>

        <PomodoroCircle
          :progress="pomodoroState.progress"
          :phase="pomodoroState.phase"
        />

        <div class="countdown">
          <div class="time-display">{{ formatTime(pomodoroState.remainingSeconds) }}</div>
          <div class="time-label">remaining</div>
        </div>

        <div class="phase-description">
          <p v-if="pomodoroState.phase === 'work'">
            Time to focus. Minimize distractions and dive deep into your work.
          </p>
          <p v-else-if="pomodoroState.phase === 'short-break'">
            Take a quick break. Stretch, breathe, or grab some water.
          </p>
          <p v-else>
            Long break time! Rest well before the next cycle begins.
          </p>
        </div>
      </div>
    </div>

    <div v-if="isAdmin || !pomodoroState.isRunning" class="admin-controls">
      <div class="admin-header">
        <svg
          class="lock-icon"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
        <span>Admin Controls</span>
      </div>

      <AdminLogin />

      <div v-if="isAdmin" class="button-group">
        <button
          v-if="!pomodoroState.isRunning"
          @click="startTimer"
          class="btn btn-start"
        >
          Start Global Timer
        </button>
        <button v-else @click="stopTimer" class="btn btn-stop">Stop Timer</button>
      </div>
      <div v-else class="viewer-message">
        <p>You are viewing the global timer. Only admins can control it.</p>
      </div>
    </div>

    <div class="info-section">
      <div class="info-card">
        <h3>Rhythm Pattern</h3>
        <ul>
          <li><span class="phase-dot work"></span> 32 min Work</li>
          <li><span class="phase-dot short-break"></span> 8 min Short Break</li>
          <li><span class="phase-dot long-break"></span> 30 min Long Break (every 3 cycles)</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { usePomodoro } from '@/composables/usePomodoro'
import { useAdminAuth } from '@/composables/useAdminAuth'
import PomodoroCircle from '@/components/PomodoroCircle.vue'
import AdminLogin from '@/components/AdminLogin.vue'

const { state: pomodoroState, formatTime, startTimer, stopTimer, isConnected } = usePomodoro()
const { isAdmin } = useAdminAuth()
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
  margin-bottom: 3rem;
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

.main-content {
  max-width: 600px;
  margin: 0 auto;
}

.loading-state {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 2rem;
  padding: 4rem 2rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid rgba(255, 255, 255, 0.2);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-state p {
  margin: 0;
  font-size: 1.125rem;
  opacity: 0.9;
}

.not-started {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 2rem;
  padding: 4rem 2rem;
  text-align: center;
}

.waiting-message {
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
  0%,
  100% {
    opacity: 0.5;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.2);
  }
}

.waiting-message h2 {
  margin: 0;
  font-size: 2rem;
}

.waiting-message p {
  margin: 0.5rem 0;
  opacity: 0.9;
}

.admin-note {
  font-size: 0.875rem;
  opacity: 0.7;
  font-style: italic;
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

.phase-badge.phase-short-break {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  box-shadow: 0 4px 20px rgba(59, 130, 246, 0.4);
}

.phase-badge.phase-long-break {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  box-shadow: 0 4px 20px rgba(139, 92, 246, 0.4);
}

.cycle-indicator {
  font-size: 1rem;
  opacity: 0.8;
  font-weight: 500;
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

.admin-controls {
  max-width: 600px;
  margin: 2rem auto;
  padding: 1.5rem;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(10px);
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.admin-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  opacity: 0.7;
}

.lock-icon {
  width: 16px;
  height: 16px;
}

.button-group {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.viewer-message {
  margin-top: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 0.75rem;
  text-align: center;
}

.viewer-message p {
  margin: 0;
  opacity: 0.8;
  font-size: 0.9375rem;
}

.btn {
  flex: 1;
  padding: 1rem 2rem;
  border: none;
  border-radius: 0.75rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.btn-start {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  box-shadow: 0 4px 20px rgba(16, 185, 129, 0.4);
}

.btn-start:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(16, 185, 129, 0.5);
}

.btn-stop {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  box-shadow: 0 4px 20px rgba(239, 68, 68, 0.4);
}

.btn-stop:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(239, 68, 68, 0.5);
}

.btn:active {
  transform: translateY(0);
}

.info-section {
  max-width: 600px;
  margin: 2rem auto;
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

.phase-dot.short-break {
  background: #3b82f6;
  box-shadow: 0 0 10px rgba(59, 130, 246, 0.6);
}

.phase-dot.long-break {
  background: #8b5cf6;
  box-shadow: 0 0 10px rgba(139, 92, 246, 0.6);
}

/* Extra small phones (< 375px) */
@media (max-width: 374px) {
  .pomodoro-container {
    padding: 0.75rem;
  }

  .header {
    margin-bottom: 1.5rem;
  }

  .title {
    font-size: 1.5rem;
  }

  .subtitle {
    font-size: 0.875rem;
  }

  .not-started,
  .timer-active {
    padding: 1.5rem 1rem;
  }

  .waiting-message h2 {
    font-size: 1.25rem;
  }

  .waiting-message p {
    font-size: 0.875rem;
  }

  .phase-badge {
    padding: 0.5rem 1rem;
    font-size: 0.75rem;
  }

  .cycle-indicator {
    font-size: 0.75rem;
  }

  .time-display {
    font-size: 2rem;
  }

  .time-label {
    font-size: 0.75rem;
  }

  .phase-description {
    padding: 1rem;
  }

  .phase-description p {
    font-size: 0.875rem;
  }

  .admin-controls {
    padding: 1rem;
  }

  .btn {
    padding: 0.75rem 1rem;
    font-size: 0.875rem;
  }

  .info-card {
    padding: 1rem;
  }

  .info-card h3 {
    font-size: 1rem;
  }

  .info-card li {
    font-size: 0.875rem;
  }

  .phase-header {
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-start;
  }
}

/* Small phones (375px - 479px) */
@media (min-width: 375px) and (max-width: 479px) {
  .pomodoro-container {
    padding: 1rem;
  }

  .header {
    margin-bottom: 2rem;
  }

  .title {
    font-size: 1.75rem;
  }

  .subtitle {
    font-size: 1rem;
  }

  .not-started,
  .timer-active {
    padding: 2rem 1.5rem;
  }

  .phase-badge {
    padding: 0.625rem 1.25rem;
    font-size: 0.875rem;
  }

  .cycle-indicator {
    font-size: 0.875rem;
  }

  .time-display {
    font-size: 2.5rem;
  }

  .phase-description p {
    font-size: 1rem;
  }

  .btn {
    padding: 0.875rem 1.5rem;
    font-size: 0.9375rem;
  }

  .phase-header {
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-start;
  }
}

/* Regular phones (480px - 639px) */
@media (min-width: 480px) and (max-width: 639px) {
  .pomodoro-container {
    padding: 1.25rem;
  }

  .header {
    margin-bottom: 2.5rem;
  }

  .title {
    font-size: 2rem;
  }

  .subtitle {
    font-size: 1.125rem;
  }

  .time-display {
    font-size: 3rem;
  }

  .phase-header {
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-start;
  }
}

/* Large phones / Small tablets (640px - 767px) */
@media (min-width: 640px) and (max-width: 767px) {
  .pomodoro-container {
    padding: 1.5rem;
  }

  .header {
    margin-bottom: 2.5rem;
  }

  .title {
    font-size: 2.25rem;
  }

  .subtitle {
    font-size: 1.25rem;
  }

  .time-display {
    font-size: 3.5rem;
  }

  .main-content,
  .admin-controls,
  .info-section {
    max-width: 550px;
  }
}

/* Tablets (768px - 1023px) */
@media (min-width: 768px) and (max-width: 1023px) {
  .pomodoro-container {
    padding: 2rem;
  }

  .header {
    margin-bottom: 3rem;
  }

  .title {
    font-size: 2.75rem;
  }

  .subtitle {
    font-size: 1.375rem;
  }

  .time-display {
    font-size: 3.75rem;
  }

  .main-content,
  .admin-controls,
  .info-section {
    max-width: 650px;
  }

  .not-started,
  .timer-active {
    padding: 3rem 2.5rem;
  }

  .phase-badge {
    padding: 0.875rem 1.75rem;
    font-size: 1.25rem;
  }
}

/* Desktop (1024px+) */
@media (min-width: 1024px) {
  .pomodoro-container {
    padding: 2.5rem;
  }

  .header {
    margin-bottom: 3.5rem;
  }

  .title {
    font-size: 3.5rem;
  }

  .subtitle {
    font-size: 1.5rem;
  }

  .main-content,
  .admin-controls,
  .info-section {
    max-width: 700px;
  }

  .not-started,
  .timer-active {
    padding: 3.5rem 3rem;
  }

  .time-display {
    font-size: 4.5rem;
  }

  .phase-description p {
    font-size: 1.25rem;
  }

  .info-card {
    padding: 2rem;
  }
}

/* Landscape orientation for phones */
@media (max-height: 600px) and (orientation: landscape) {
  .pomodoro-container {
    padding: 1rem;
  }

  .header {
    margin-bottom: 1rem;
  }

  .title {
    font-size: 1.75rem;
  }

  .subtitle {
    font-size: 1rem;
  }

  .not-started,
  .timer-active {
    padding: 1.5rem;
  }

  .countdown {
    margin: 1rem 0;
  }

  .time-display {
    font-size: 2.5rem;
  }

  .phase-description {
    margin-top: 1rem;
    padding: 1rem;
  }

  .admin-controls,
  .info-section {
    margin: 1rem auto;
  }
}
</style>
