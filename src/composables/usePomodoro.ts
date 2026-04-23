import { ref, computed, onMounted, onUnmounted } from 'vue'

export type Phase = 'work' | 'break' | 'off-hours'

// Schedule config — Mon–Fri 10:00–17:00 IST, 50 min work + 10 min break, 7 blocks/day.
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000 // IST is UTC+5:30, no DST
const WINDOW_START_SEC = 10 * 3600 // 10:00 IST
const WINDOW_END_SEC = 17 * 3600 // 17:00 IST
const BLOCK_SEC = 60 * 60 // 60 min
const WORK_SEC = 50 * 60 // 50 min
const BREAK_SEC = 10 * 60 // 10 min
export const BLOCKS_PER_DAY = Math.floor((WINDOW_END_SEC - WINDOW_START_SEC) / BLOCK_SEC) // 7

export interface PomodoroState {
  phase: Phase
  phaseLabel: string
  remainingSeconds: number
  totalSeconds: number
  progress: number
  blockIndex: number // 0..5 within today's session; -1 when off-hours
  nextSessionStart: number | null
}

const currentTime = ref(Date.now())
let intervalId: number | undefined

const istParts = (epochMs: number) => {
  const shifted = new Date(epochMs + IST_OFFSET_MS)
  return {
    weekday: shifted.getUTCDay(), // 0=Sun, 1=Mon, ..., 6=Sat
    hour: shifted.getUTCHours(),
    minute: shifted.getUTCMinutes(),
    second: shifted.getUTCSeconds(),
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth(),
    date: shifted.getUTCDate(),
    secondOfDay:
      shifted.getUTCHours() * 3600 + shifted.getUTCMinutes() * 60 + shifted.getUTCSeconds()
  }
}

const istElevenAmMs = (year: number, month: number, date: number) =>
  Date.UTC(year, month, date, 11, 0) - IST_OFFSET_MS

const nextSessionStartMs = (nowMs: number): number | null => {
  for (let offset = 0; offset < 8; offset++) {
    const cand = istParts(nowMs + offset * 86400000)
    if (cand.weekday < 1 || cand.weekday > 5) continue
    const startMs = istElevenAmMs(cand.year, cand.month, cand.date)
    if (startMs > nowMs) return startMs
  }
  return null
}

const computeState = (nowMs: number): PomodoroState => {
  const { weekday, secondOfDay } = istParts(nowMs)
  const inScheduleDay = weekday >= 1 && weekday <= 5
  const inWindow =
    inScheduleDay && secondOfDay >= WINDOW_START_SEC && secondOfDay < WINDOW_END_SEC

  if (!inWindow) {
    return {
      phase: 'off-hours',
      phaseLabel: 'Off-hours',
      remainingSeconds: 0,
      totalSeconds: 0,
      progress: 0,
      blockIndex: -1,
      nextSessionStart: nextSessionStartMs(nowMs)
    }
  }

  const secSinceStart = secondOfDay - WINDOW_START_SEC
  const blockIndex = Math.floor(secSinceStart / BLOCK_SEC)
  const withinBlock = secSinceStart % BLOCK_SEC

  if (withinBlock < WORK_SEC) {
    const remaining = WORK_SEC - withinBlock
    return {
      phase: 'work',
      phaseLabel: `Work ${blockIndex + 1} / ${BLOCKS_PER_DAY}`,
      remainingSeconds: remaining,
      totalSeconds: WORK_SEC,
      progress: ((WORK_SEC - remaining) / WORK_SEC) * 100,
      blockIndex,
      nextSessionStart: null
    }
  }

  const remaining = BLOCK_SEC - withinBlock
  return {
    phase: 'break',
    phaseLabel: `Break ${blockIndex + 1} / ${BLOCKS_PER_DAY}`,
    remainingSeconds: remaining,
    totalSeconds: BREAK_SEC,
    progress: ((BREAK_SEC - remaining) / BREAK_SEC) * 100,
    blockIndex,
    nextSessionStart: null
  }
}

export function usePomodoro() {
  const state = computed<PomodoroState>(() => computeState(currentTime.value))

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const formatNextStart = (epochMs: number): string => {
    const p = istParts(epochMs)
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const hour12 = ((p.hour + 11) % 12) + 1
    const ampm = p.hour < 12 ? 'AM' : 'PM'
    return `${days[p.weekday]} ${hour12}:${p.minute.toString().padStart(2, '0')} ${ampm} IST`
  }

  onMounted(() => {
    if (!intervalId) {
      intervalId = window.setInterval(() => {
        currentTime.value = Date.now()
      }, 1000)
    }
  })

  onUnmounted(() => {
    // Shared interval; leave running for app lifetime.
  })

  return {
    state,
    formatTime,
    formatNextStart
  }
}
