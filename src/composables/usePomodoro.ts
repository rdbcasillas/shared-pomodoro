import { ref, computed, onMounted, onUnmounted } from 'vue'
import { io, type Socket } from 'socket.io-client'

export type Phase = 'work' | 'short-break' | 'long-break'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001'

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
const LONG_BREAK_DURATION = 48 * 60 * 1000 // 48 minutes
const CYCLE_DURATION = WORK_DURATION + SHORT_BREAK_DURATION // One work + break cycle
// Correct structure: W+B, W+B, W, LB = 2 cycles + 1 work + long break
const FULL_BLOCK_DURATION = 2 * CYCLE_DURATION + WORK_DURATION + LONG_BREAK_DURATION

// Singleton socket instance
let socket: Socket | null = null

// Shared state across all instances
const startTimestamp = ref<number | null>(null)
const currentTime = ref(Date.now())
const isConnected = ref(false)
let intervalId: number | undefined

// Initialize socket connection once
const initSocket = () => {
  if (socket) return socket

  socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling']
  })

  // Listen for timer state updates from server
  socket.on('timer:state', (state: any) => {
    startTimestamp.value = state.startTimestamp
    isConnected.value = true
  })

  socket.on('timer:started', (state: any) => {
    startTimestamp.value = state.startTimestamp
  })

  socket.on('timer:stopped', () => {
    startTimestamp.value = null
  })

  socket.on('connect', () => {
    console.log('✅ Connected to The Loop server')
    // Don't set isConnected here - wait for timer:state
  })

  socket.on('disconnect', () => {
    console.log('❌ Disconnected from The Loop server')
    isConnected.value = false
  })

  return socket
}

export function usePomodoro() {
  // Initialize socket on first use
  if (!socket) {
    initSocket()
  }

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
    const positionInBlock = elapsed % FULL_BLOCK_DURATION

    // Determine which phase we're in
    // Structure: W1+B1 (cycle 1), W2+B2 (cycle 2), W3, Long Break
    let phase: Phase
    let phaseLabel: string
    let remainingMs: number
    let totalMs: number
    let cycleNumber: number

    const twoCompleteCycles = 2 * CYCLE_DURATION
    const threeWorkSessions = twoCompleteCycles + WORK_DURATION

    if (positionInBlock < twoCompleteCycles) {
      // We're in one of the first 2 cycles (W+B, W+B)
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
    } else if (positionInBlock < threeWorkSessions) {
      // Third work session (after 2nd break, before long break)
      phase = 'work'
      phaseLabel = 'Work Session 3'
      cycleNumber = 3
      const positionInWork3 = positionInBlock - twoCompleteCycles
      remainingMs = WORK_DURATION - positionInWork3
      totalMs = WORK_DURATION
    } else {
      // Long break (after 3rd work session)
      phase = 'long-break'
      phaseLabel = 'Long Break'
      cycleNumber = 4
      const positionInLongBreak = positionInBlock - threeWorkSessions
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
    // Send start command to server
    if (socket) {
      socket.emit('timer:start', { adminId: 'admin' })
    }
  }

  const stopTimer = () => {
    // Send stop command to server
    if (socket) {
      socket.emit('timer:stop')
    }
  }

  const updateCurrentTime = () => {
    currentTime.value = Date.now()
  }

  onMounted(() => {
    // Socket is already initialized at module level
    // Update every second
    intervalId = window.setInterval(updateCurrentTime, 1000)
  })

  onUnmounted(() => {
    if (intervalId) {
      clearInterval(intervalId)
    }
    // Note: We don't disconnect socket here as it's shared across components
  })

  return {
    state,
    formatTime,
    startTimer,
    stopTimer,
    isConnected
  }
}
