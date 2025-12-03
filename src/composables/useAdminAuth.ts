import { ref, computed } from 'vue'

const ADMIN_KEY = 'the_loop_admin'
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123'

// Reactive state
const isAuthenticated = ref<boolean>(false)

// Check localStorage on initialization
const checkStoredAuth = () => {
  const stored = localStorage.getItem(ADMIN_KEY)
  if (stored === 'true') {
    isAuthenticated.value = true
  }
}

// Initialize on module load
checkStoredAuth()

export function useAdminAuth() {
  const login = (password: string): boolean => {
    if (password === ADMIN_PASSWORD) {
      isAuthenticated.value = true
      localStorage.setItem(ADMIN_KEY, 'true')
      return true
    }
    return false
  }

  const logout = () => {
    isAuthenticated.value = false
    localStorage.removeItem(ADMIN_KEY)
  }

  const isAdmin = computed(() => isAuthenticated.value)

  return {
    isAdmin,
    login,
    logout
  }
}
