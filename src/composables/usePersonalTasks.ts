import { ref, watch } from 'vue'
import type { Phase } from './usePomodoro'

export interface Task {
  id: string
  text: string
  done: boolean
}

export interface SessionHistory {
  id: string
  date: string // ISO date
  task: string // serialized checklist — may span multiple lines
  duration: number // seconds
  phase: Phase
  completedAt: number // timestamp
}

const CURRENT_TASKS_KEY = 'theloop_current_tasks'
const LEGACY_TASK_KEY = 'theloop_current_task' // pre-checklist single-string key
const HISTORY_KEY = 'theloop_session_history'
const MAX_HISTORY = 10

const newId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

const loadCurrentTasks = (): Task[] => {
  try {
    const stored = localStorage.getItem(CURRENT_TASKS_KEY)
    if (stored) return JSON.parse(stored)
  } catch {
    // fall through to legacy migration
  }
  const legacy = localStorage.getItem(LEGACY_TASK_KEY)
  if (legacy && legacy.trim()) {
    localStorage.removeItem(LEGACY_TASK_KEY)
    return [{ id: newId(), text: legacy, done: false }]
  }
  return []
}

const loadHistory = (): SessionHistory[] => {
  try {
    const stored = localStorage.getItem(HISTORY_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

const currentTasks = ref<Task[]>(loadCurrentTasks())
const sessionHistory = ref<SessionHistory[]>(loadHistory())

watch(
  currentTasks,
  (newTasks) => {
    localStorage.setItem(CURRENT_TASKS_KEY, JSON.stringify(newTasks))
  },
  { deep: true }
)

watch(
  sessionHistory,
  (newHistory) => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory))
  },
  { deep: true }
)

const serializeTasks = (tasks: Task[]): string =>
  tasks.map((t) => `${t.done ? '✓' : '◯'} ${t.text}`).join('\n')

export function usePersonalTasks() {
  const addTask = (text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return
    currentTasks.value.push({ id: newId(), text: trimmed, done: false })
  }

  const updateTask = (id: string, text: string) => {
    const trimmed = text.trim()
    const task = currentTasks.value.find((t) => t.id === id)
    if (!task) return
    if (!trimmed) {
      removeTask(id)
      return
    }
    task.text = trimmed
  }

  const toggleTask = (id: string) => {
    const task = currentTasks.value.find((t) => t.id === id)
    if (task) task.done = !task.done
  }

  const removeTask = (id: string) => {
    currentTasks.value = currentTasks.value.filter((t) => t.id !== id)
  }

  const clearCurrentTasks = () => {
    currentTasks.value = []
  }

  const completeSession = (phase: Phase, duration: number) => {
    if (currentTasks.value.length === 0) return

    const session: SessionHistory = {
      id: newId(),
      date: new Date().toISOString(),
      task: serializeTasks(currentTasks.value),
      duration,
      phase,
      completedAt: Date.now()
    }

    sessionHistory.value.unshift(session)
    if (sessionHistory.value.length > MAX_HISTORY) {
      sessionHistory.value = sessionHistory.value.slice(0, MAX_HISTORY)
    }

    currentTasks.value = []
  }

  const clearHistory = () => {
    sessionHistory.value = []
  }

  const deleteSession = (id: string) => {
    sessionHistory.value = sessionHistory.value.filter((s) => s.id !== id)
  }

  return {
    currentTasks,
    sessionHistory,
    addTask,
    updateTask,
    toggleTask,
    removeTask,
    clearCurrentTasks,
    completeSession,
    clearHistory,
    deleteSession
  }
}
