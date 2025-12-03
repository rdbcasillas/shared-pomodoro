<template>
  <div class="task-tracker">
    <div class="tracker-header">
      <h2>My Tasks</h2>
      <p class="subtitle">Personal tracking • Stored locally</p>
    </div>

    <div class="current-task-section">
      <label for="current-task">What are you working on?</label>
      <textarea
        id="current-task"
        v-model="currentTask"
        placeholder="e.g., Writing blog post about productivity..."
        rows="3"
        maxlength="200"
      ></textarea>
      <div class="char-count">{{ currentTask.length }}/200</div>
    </div>

    <div class="history-section">
      <div class="history-header">
        <h3>Recent Sessions</h3>
        <button v-if="sessionHistory.length > 0" @click="clearHistory" class="btn-clear">
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
import { usePersonalTasks } from '@/composables/usePersonalTasks'

const { currentTask, sessionHistory, updateCurrentTask, clearHistory, deleteSession } =
  usePersonalTasks()

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
  if (phase === 'short-break') return 'Short Break'
  if (phase === 'long-break') return 'Long Break'
  return phase
}
</script>

<style scoped>
.task-tracker {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-radius: 1.5rem;
  padding: 2rem;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.tracker-header h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
}

.tracker-header .subtitle {
  margin: 0.25rem 0 0 0;
  font-size: 0.875rem;
  opacity: 0.7;
}

.current-task-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.current-task-section label {
  font-size: 0.9375rem;
  font-weight: 500;
  opacity: 0.9;
}

.current-task-section textarea {
  width: 100%;
  padding: 0.875rem;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.75rem;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 0.9375rem;
  font-family: inherit;
  resize: none;
  outline: none;
  transition: all 0.2s;
}

.current-task-section textarea::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.current-task-section textarea:focus {
  border-color: rgba(255, 255, 255, 0.4);
  background: rgba(255, 255, 255, 0.15);
}

.char-count {
  text-align: right;
  font-size: 0.75rem;
  opacity: 0.6;
}

.history-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  overflow: hidden;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.history-header h3 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
}

.btn-clear {
  padding: 0.5rem 1rem;
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid rgba(239, 68, 68, 0.4);
  border-radius: 0.5rem;
  color: #fca5a5;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-clear:hover {
  background: rgba(239, 68, 68, 0.3);
  border-color: rgba(239, 68, 68, 0.6);
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  opacity: 0.7;
}

.empty-state p {
  margin: 0.5rem 0;
}

.empty-state .hint {
  font-size: 0.875rem;
  opacity: 0.8;
}

.history-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding-right: 0.5rem;
}

.history-list::-webkit-scrollbar {
  width: 6px;
}

.history-list::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 3px;
}

.history-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}

.history-list::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

.history-item {
  display: flex;
  gap: 0.75rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 0.75rem;
  border-left: 3px solid;
  transition: all 0.2s;
}

.history-item.phase-work {
  border-left-color: #ef4444;
}

.history-item.phase-short-break {
  border-left-color: #3b82f6;
}

.history-item.phase-long-break {
  border-left-color: #8b5cf6;
}

.history-item:hover {
  background: rgba(255, 255, 255, 0.12);
}

.session-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.session-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8125rem;
  opacity: 0.8;
}

.session-date {
  font-weight: 500;
}

.session-duration {
  opacity: 0.9;
}

.session-task {
  font-size: 0.9375rem;
  line-height: 1.4;
  word-break: break-word;
}

.session-phase {
  margin-top: 0.25rem;
}

.phase-label {
  display: inline-block;
  padding: 0.25rem 0.625rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.btn-delete {
  width: 32px;
  height: 32px;
  padding: 0;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 0.5rem;
  color: #fca5a5;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
  align-self: flex-start;
}

.btn-delete svg {
  width: 16px;
  height: 16px;
}

.btn-delete:hover {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.4);
}

@media (max-width: 1023px) {
  .task-tracker {
    padding: 1.5rem;
  }

  .history-list {
    max-height: 400px;
  }
}
</style>
