import { ref, watch } from 'vue'
import type { Phase } from './usePomodoro'

export interface SessionHistory {
  id: string
  date: string // ISO date
  task: string
  duration: number // seconds
  phase: Phase
  completedAt: number // timestamp
}

const CURRENT_TASK_KEY = 'theloop_current_task'
const HISTORY_KEY = 'theloop_session_history'
const MAX_HISTORY = 10

// Load from localStorage
const loadCurrentTask = (): string => {
  return localStorage.getItem(CURRENT_TASK_KEY) || ''
}

const loadHistory = (): SessionHistory[] => {
  try {
    const stored = localStorage.getItem(HISTORY_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

// Reactive state
const currentTask = ref<string>(loadCurrentTask())
const sessionHistory = ref<SessionHistory[]>(loadHistory())

// Watch for changes and save to localStorage
watch(currentTask, (newTask) => {
  localStorage.setItem(CURRENT_TASK_KEY, newTask)
})

watch(
  sessionHistory,
  (newHistory) => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory))
  },
  { deep: true }
)

export function usePersonalTasks() {
  const updateCurrentTask = (task: string) => {
    currentTask.value = task
  }

  const completeSession = (phase: Phase, duration: number) => {
    if (!currentTask.value.trim()) return

    const session: SessionHistory = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      task: currentTask.value,
      duration,
      phase,
      completedAt: Date.now()
    }

    // Add to beginning of array
    sessionHistory.value.unshift(session)

    // Keep only last MAX_HISTORY items
    if (sessionHistory.value.length > MAX_HISTORY) {
      sessionHistory.value = sessionHistory.value.slice(0, MAX_HISTORY)
    }

    // Clear current task after completing
    currentTask.value = ''
  }

  const clearCurrentTask = () => {
    currentTask.value = ''
  }

  const clearHistory = () => {
    sessionHistory.value = []
  }

  const deleteSession = (id: string) => {
    sessionHistory.value = sessionHistory.value.filter((s) => s.id !== id)
  }

  return {
    currentTask,
    sessionHistory,
    updateCurrentTask,
    completeSession,
    clearCurrentTask,
    clearHistory,
    deleteSession
  }
}
