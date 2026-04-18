<template>
  <div class="task-tracker">
    <div class="tracker-header">
      <h2>My Tasks</h2>
      <p class="subtitle">Personal tracking · Stored locally</p>
    </div>

    <div v-if="!isOffHours" class="current-task-section">
      <div class="current-task-label">
        <span>This block</span>
        <span v-if="currentTasks.length > 0" class="task-counter">
          {{ doneCount }}/{{ currentTasks.length }}
        </span>
      </div>

      <ul v-if="currentTasks.length > 0" class="task-list">
        <li
          v-for="task in currentTasks"
          :key="task.id"
          class="task-row"
          :class="{ 'task-done': task.done }"
        >
          <button
            type="button"
            class="task-check"
            :aria-label="task.done ? 'Mark incomplete' : 'Mark done'"
            @click="toggleTask(task.id)"
          >
            <svg v-if="task.done" viewBox="0 0 16 16" aria-hidden="true">
              <path
                d="M3.5 8.5l3 3 6-6"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>

          <input
            v-if="editingId === task.id"
            ref="editInputRef"
            v-model="editingDraft"
            type="text"
            class="task-edit-input"
            maxlength="200"
            @keydown.enter.prevent="commitEdit"
            @keydown.esc.prevent="cancelEdit"
            @blur="commitEdit"
          />
          <span
            v-else
            class="task-text"
            :title="'Click to edit'"
            @click="startEdit(task)"
          >
            {{ task.text }}
          </span>

          <button
            type="button"
            class="task-delete"
            aria-label="Delete task"
            @click="removeTask(task.id)"
          >
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path
                d="M4 4l8 8M12 4l-8 8"
                fill="none"
                stroke="currentColor"
                stroke-width="1.75"
                stroke-linecap="round"
              />
            </svg>
          </button>
        </li>
      </ul>

      <form class="task-add" @submit.prevent="submitNewTask">
        <input
          v-model="newTaskText"
          type="text"
          class="task-add-input"
          placeholder="Add a task…"
          maxlength="200"
        />
        <button
          type="submit"
          class="btn-primary"
          :disabled="!newTaskText.trim()"
        >
          Add
        </button>
      </form>

      <div v-if="currentTasks.length > 0" class="finalize-row">
        <p class="finalize-hint">
          Auto-saves when your break ends. Finish strikethroughs, then:
        </p>
        <button type="button" class="btn-finalize" @click="finalizeBlock">
          Save to Recent Sessions →
        </button>
      </div>
    </div>

    <div class="history-section">
      <div class="history-header">
        <h3>Recent Sessions</h3>
        <button v-if="sessionHistory.length > 0" class="btn-ghost" @click="clearHistory">
          Clear All
        </button>
      </div>

      <div v-if="sessionHistory.length === 0" class="empty-state">
        <p>No completed sessions yet.</p>
        <p class="hint">Your completed work sessions will appear here.</p>
      </div>

      <div v-else class="history-list">
        <div
          v-for="session in sessionHistory"
          :key="session.id"
          class="history-item"
          :class="`phase-${session.phase}`"
        >
          <div class="session-info">
            <div class="session-header">
              <span class="session-date">{{ formatDate(session.date) }}</span>
              <span class="session-duration">{{ formatDuration(session.duration) }}</span>
            </div>
            <div class="session-task">{{ session.task }}</div>
            <div class="session-phase">
              <span class="phase-label">{{ formatPhase(session.phase) }}</span>
            </div>
          </div>
          <button @click="deleteSession(session.id)" class="btn-delete" title="Delete">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { usePersonalTasks, type Task } from '@/composables/usePersonalTasks'

interface Props {
  isOffHours?: boolean
}
withDefaults(defineProps<Props>(), { isOffHours: false })

const {
  currentTasks,
  sessionHistory,
  addTask,
  updateTask,
  toggleTask,
  removeTask,
  completeSession,
  clearHistory,
  deleteSession
} = usePersonalTasks()

const WORK_DURATION_SEC = 50 * 60
const finalizeBlock = () => {
  if (currentTasks.value.length === 0) return
  completeSession('work', WORK_DURATION_SEC)
}

const newTaskText = ref('')
const editingId = ref<string | null>(null)
const editingDraft = ref('')
const editInputRef = ref<HTMLInputElement | HTMLInputElement[] | null>(null)

const doneCount = computed(() => currentTasks.value.filter((t) => t.done).length)

const submitNewTask = () => {
  const text = newTaskText.value.trim()
  if (!text) return
  addTask(text)
  newTaskText.value = ''
}

const startEdit = async (task: Task) => {
  editingId.value = task.id
  editingDraft.value = task.text
  await nextTick()
  const el = Array.isArray(editInputRef.value) ? editInputRef.value[0] : editInputRef.value
  el?.focus()
  el?.select()
}

const commitEdit = () => {
  if (editingId.value === null) return
  updateTask(editingId.value, editingDraft.value)
  editingId.value = null
}

const cancelEdit = () => {
  editingId.value = null
}

const formatDate = (isoDate: string): string => {
  const date = new Date(isoDate)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  return `${mins} min`
}

const formatPhase = (phase: string): string => {
  if (phase === 'work') return 'Work Session'
  if (phase === 'break') return 'Break'
  // Legacy values from prior versions kept for backwards-compat with localStorage history
  if (phase === 'short-break') return 'Short Break'
  if (phase === 'long-break') return 'Long Break'
  return phase
}
</script>

<style scoped>
.task-tracker {
  background: var(--card-bg);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  border: 1px solid var(--ink-hair);
  border-radius: var(--radius-lg);
  padding: 1.75rem;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
  color: var(--ink);
}

.tracker-header h2 {
  margin: 0;
  font-family: 'Caveat', cursive;
  font-size: 2rem;
  font-weight: 700;
  line-height: 1;
  color: var(--ink);
}

.tracker-header .subtitle {
  margin: 0.375rem 0 0 0;
  font-size: 0.8125rem;
  color: var(--ink-muted);
  letter-spacing: 0.02em;
}

.current-task-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.current-task-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.6875rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: var(--ink-muted);
}

.task-counter {
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.05em;
}

.task-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.task-row {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.5rem 0.75rem;
  background: var(--paper);
  border: 1px solid var(--ink-hair);
  border-left: 3px solid var(--work);
  border-radius: var(--radius);
  transition: border-color 0.15s, opacity 0.15s;
}

.task-row:hover {
  border-color: var(--ink-soft);
}

.task-row.task-done {
  opacity: 0.6;
  border-left-color: var(--break);
}

.task-row.task-done .task-text {
  text-decoration: line-through;
  color: var(--ink-muted);
}

.task-check {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  padding: 0;
  border: 1px solid var(--ink-soft);
  border-radius: 4px;
  background: transparent;
  color: var(--ink);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.task-check:hover {
  background: var(--ink-faint);
}

.task-done .task-check {
  background: var(--break);
  border-color: var(--break);
  color: var(--paper);
}

.task-check svg {
  width: 14px;
  height: 14px;
}

.task-text {
  flex: 1;
  font-size: 0.9375rem;
  line-height: 1.4;
  color: var(--ink);
  word-break: break-word;
  cursor: text;
  min-width: 0;
}

.task-edit-input {
  flex: 1;
  min-width: 0;
  padding: 0.125rem 0.25rem;
  margin: -0.125rem -0.25rem;
  font-size: 0.9375rem;
  font-family: inherit;
  line-height: 1.4;
  color: var(--ink);
  background: transparent;
  border: 1px solid var(--ink-soft);
  border-radius: 4px;
  outline: none;
}

.task-delete {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  padding: 0;
  background: transparent;
  border: none;
  color: var(--ink-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  opacity: 0;
  transition: all 0.15s;
}

.task-row:hover .task-delete,
.task-delete:focus-visible {
  opacity: 1;
}

.task-delete:hover {
  color: var(--work);
  background: var(--ink-faint);
}

.task-delete svg {
  width: 14px;
  height: 14px;
}

.task-add {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.25rem;
}

.task-add-input {
  flex: 1;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--ink-hair);
  border-radius: var(--radius);
  background: var(--paper);
  color: var(--ink);
  font-size: 0.9375rem;
  font-family: inherit;
  outline: none;
  transition: border-color 0.15s;
  min-width: 0;
}

.task-add-input::placeholder {
  color: var(--ink-muted);
  font-style: italic;
}

.task-add-input:focus {
  border-color: var(--ink-soft);
}

.finalize-row {
  margin-top: 0.75rem;
  padding-top: 0.875rem;
  border-top: 1px dashed var(--ink-hair);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: stretch;
}

.finalize-hint {
  margin: 0;
  font-size: 0.75rem;
  color: var(--ink-muted);
  font-style: italic;
  line-height: 1.4;
}

.btn-finalize {
  padding: 0.5rem 0.875rem;
  font-size: 0.8125rem;
  font-weight: 500;
  font-family: inherit;
  color: var(--ink);
  background: transparent;
  border: 1px solid var(--ink-soft);
  border-radius: var(--radius);
  cursor: pointer;
  transition: all 0.15s;
  text-align: center;
}

.btn-finalize:hover {
  background: var(--ink);
  color: var(--paper);
  border-color: var(--ink);
}

.history-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
  overflow: hidden;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.history-header h3 {
  margin: 0;
  font-family: 'Caveat', cursive;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--ink);
}

.btn-ghost,
.btn-primary {
  padding: 0.375rem 0.875rem;
  font-size: 0.8125rem;
  font-weight: 500;
  font-family: inherit;
  border-radius: var(--radius);
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

.btn-ghost {
  background: transparent;
  border: 1px solid var(--ink-hair);
  color: var(--ink-soft);
}

.btn-ghost:hover {
  border-color: var(--ink-soft);
  color: var(--ink);
}

.btn-primary {
  background: var(--ink);
  border: 1px solid var(--ink);
  color: var(--paper);
}

.btn-primary:hover:not(:disabled) {
  background: var(--ink-soft);
  border-color: var(--ink-soft);
}

.btn-primary:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.empty-state {
  text-align: center;
  padding: 2.5rem 1rem;
  color: var(--ink-muted);
}

.empty-state p {
  margin: 0.5rem 0;
  font-size: 0.875rem;
}

.empty-state .hint {
  font-size: 0.8125rem;
  font-style: italic;
}

.history-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  padding-right: 0.25rem;
}

.history-list::-webkit-scrollbar {
  width: 6px;
}

.history-list::-webkit-scrollbar-track {
  background: transparent;
}

.history-list::-webkit-scrollbar-thumb {
  background: var(--ink-hair);
  border-radius: 3px;
}

.history-list::-webkit-scrollbar-thumb:hover {
  background: var(--ink-muted);
}

.history-item {
  display: flex;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  background: var(--paper);
  border: 1px solid var(--ink-hair);
  border-left: 3px solid;
  border-radius: var(--radius);
  transition: all 0.2s;
}

.history-item.phase-work {
  border-left-color: var(--work);
}

.history-item.phase-short-break,
.history-item.phase-break {
  border-left-color: var(--break);
}

.history-item.phase-long-break {
  border-left-color: var(--ink-soft);
}

.history-item:hover {
  border-color: var(--ink-soft);
}

.history-item.phase-work:hover {
  border-left-color: var(--work);
}

.history-item.phase-short-break:hover,
.history-item.phase-break:hover {
  border-left-color: var(--break);
}

.session-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  min-width: 0;
}

.session-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
  color: var(--ink-muted);
}

.session-date {
  font-weight: 500;
}

.session-duration {
  font-variant-numeric: tabular-nums;
}

.session-task {
  font-size: 0.9375rem;
  line-height: 1.45;
  color: var(--ink);
  word-break: break-word;
  white-space: pre-line;
}

.session-phase {
  margin-top: 0.125rem;
}

.phase-label {
  display: inline-block;
  padding: 0.1875rem 0.5rem;
  background: transparent;
  border: 1px solid var(--ink-hair);
  border-radius: 999px;
  font-size: 0.6875rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--ink-muted);
}

.btn-delete {
  width: 28px;
  height: 28px;
  padding: 0;
  background: transparent;
  border: 1px solid var(--ink-hair);
  border-radius: var(--radius);
  color: var(--ink-muted);
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
  align-self: flex-start;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-delete svg {
  width: 14px;
  height: 14px;
}

.btn-delete:hover {
  color: var(--work);
  border-color: var(--work);
}

@media (max-width: 1023px) {
  .task-tracker {
    padding: 1.5rem;
  }

  .history-list {
    max-height: 400px;
  }
}

/* Always-visible delete on touch */
@media (hover: none) {
  .task-delete {
    opacity: 1;
  }
}
</style>
