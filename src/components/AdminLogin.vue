<template>
  <div class="admin-login">
    <div v-if="!isAdmin" class="login-form">
      <div class="lock-icon-large">
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
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      </div>
      <p class="login-message">Admin access required to control the timer</p>
      <form @submit.prevent="handleLogin">
        <input
          v-model="password"
          type="password"
          placeholder="Enter admin password"
          class="password-input"
          :class="{ error: showError }"
        />
        <p v-if="showError" class="error-message">Incorrect password</p>
        <button type="submit" class="btn btn-login">Unlock Admin Controls</button>
      </form>
    </div>
    <div v-else class="admin-status">
      <div class="status-badge">
        <svg
          class="check-icon"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span>Admin Access</span>
      </div>
      <button @click="handleLogout" class="btn btn-logout">Logout</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAdminAuth } from '@/composables/useAdminAuth'

const { isAdmin, login, logout } = useAdminAuth()
const password = ref('')
const showError = ref(false)

const handleLogin = () => {
  showError.value = false
  const success = login(password.value)
  if (success) {
    password.value = ''
  } else {
    showError.value = true
    setTimeout(() => {
      showError.value = false
    }, 3000)
  }
}

const handleLogout = () => {
  logout()
  password.value = ''
}
</script>

<style scoped>
.admin-login {
  margin-bottom: 1rem;
}

.login-form {
  text-align: center;
  padding: 1rem;
}

.lock-icon-large {
  width: 48px;
  height: 48px;
  margin: 0 auto 1rem;
  color: rgba(255, 255, 255, 0.7);
}

.lock-icon-large svg {
  width: 100%;
  height: 100%;
}

.login-message {
  margin: 0 0 1.5rem 0;
  opacity: 0.9;
  font-size: 0.9375rem;
}

.login-form form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.password-input {
  padding: 0.875rem 1rem;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.75rem;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 1rem;
  outline: none;
  transition: all 0.2s;
}

.password-input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.password-input:focus {
  border-color: rgba(255, 255, 255, 0.4);
  background: rgba(255, 255, 255, 0.15);
}

.password-input.error {
  border-color: #ef4444;
  animation: shake 0.3s;
}

@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-10px);
  }
  75% {
    transform: translateX(10px);
  }
}

.error-message {
  margin: -0.5rem 0 0 0;
  color: #fca5a5;
  font-size: 0.875rem;
  text-align: left;
}

.btn-login {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  box-shadow: 0 4px 20px rgba(16, 185, 129, 0.4);
  padding: 0.875rem 1.5rem;
  border: none;
  border-radius: 0.75rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.btn-login:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(16, 185, 129, 0.5);
}

.admin-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: rgba(16, 185, 129, 0.1);
  border-radius: 0.75rem;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: #6ee7b7;
}

.check-icon {
  width: 24px;
  height: 24px;
}

.btn-logout {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-logout:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
}

@media (max-width: 374px) {
  .login-message {
    font-size: 0.875rem;
  }

  .password-input,
  .btn-login {
    font-size: 0.875rem;
    padding: 0.75rem 1rem;
  }

  .lock-icon-large {
    width: 40px;
    height: 40px;
  }
}
</style>
