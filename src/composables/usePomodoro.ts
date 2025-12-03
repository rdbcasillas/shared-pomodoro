import { ref, computed, onMounted, onUnmounted } from 'vue'

export type Phase = 'work' | 'short-break' | 'long-break'

export interface PomodoroState {
  phase: Phase
  phaseLabel: string
  remainingSeconds: number
  totalSeconds: number
  progress: number
  cycleNumber: number
  isRunning: boolean
}

// Duration in milliseconds
const WORK_DURATION = 32 * 60 * 1000 // 32 minutes
const SHORT_BREAK_DURATION = 8 * 60 * 1000 // 8 minutes
const LONG_BREAK_DURATION = 30 * 60 * 1000 // 30 minutes
const CYCLE_DURATION = WORK_DURATION + SHORT_BREAK_DURATION // 40 minutes
const LONG_BREAK_BLOCK = 3 * CYCLE_DURATION + LONG_BREAK_DURATION // 150 minutes

export function usePomodoro() {
  // Global start timestamp - hardcoded for now
  // Set to null initially, will be set by admin
  const startTimestamp = ref<number | null>(null)
  const currentTime = ref(Date.now())
  let intervalId: number | undefined

  const state = computed<PomodoroState>(() => {
    if (startTimestamp.value === null) {
      return {
        phase: 'work',
        phaseLabel: 'Ready to Start',
        remainingSeconds: WORK_DURATION / 1000,
        totalSeconds: WORK_DURATION / 1000,
        progress: 0,
        cycleNumber: 0,
        isRunning: false
      }
    }

    const elapsed = currentTime.value - startTimestamp.value
    const positionInBlock = elapsed % LONG_BREAK_BLOCK

    // Determine which phase we're in
    let phase: Phase
    let phaseLabel: string
    let remainingMs: number
    let totalMs: number
    let cycleNumber: number

    if (positionInBlock < 3 * CYCLE_DURATION) {
      // We're in one of the first 3 cycles
      const positionInCycle = positionInBlock % CYCLE_DURATION
      cycleNumber = Math.floor(positionInBlock / CYCLE_DURATION) + 1

      if (positionInCycle < WORK_DURATION) {
        phase = 'work'
        phaseLabel = `Work Session ${cycleNumber}`
        remainingMs = WORK_DURATION - positionInCycle
        totalMs = WORK_DURATION
      } else {
        phase = 'short-break'
        phaseLabel = `Short Break ${cycleNumber}`
        remainingMs = CYCLE_DURATION - positionInCycle
        totalMs = SHORT_BREAK_DURATION
      }
    } else {
      // Long break
      phase = 'long-break'
      phaseLabel = 'Long Break'
      cycleNumber = 4
      const positionInLongBreak = positionInBlock - 3 * CYCLE_DURATION
      remainingMs = LONG_BREAK_DURATION - positionInLongBreak
      totalMs = LONG_BREAK_DURATION
    }

    const remainingSeconds = Math.ceil(remainingMs / 1000)
    const progress = ((totalMs - remainingMs) / totalMs) * 100

    return {
      phase,
      phaseLabel,
      remainingSeconds,
      totalSeconds: totalMs / 1000,
      progress,
      cycleNumber,
      isRunning: true
    }
  })

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const startTimer = () => {
    startTimestamp.value = Date.now()
    localStorage.setItem('pomodoroStartTime', startTimestamp.value.toString())
  }

  const stopTimer = () => {
    startTimestamp.value = null
    localStorage.removeItem('pomodoroStartTime')
  }

  const updateCurrentTime = () => {
    currentTime.value = Date.now()
  }

  onMounted(() => {
    // Load start timestamp from localStorage if it exists
    const saved = localStorage.getItem('pomodoroStartTime')
    if (saved) {
      startTimestamp.value = parseInt(saved, 10)
    }

    // Update every second
    intervalId = window.setInterval(updateCurrentTime, 1000)
  })

  onUnmounted(() => {
    if (intervalId) {
      clearInterval(intervalId)
    }
  })

  return {
    state,
    formatTime,
    startTimer,
    stopTimer
  }
}
