import { createRouter, createWebHistory } from 'vue-router'
import PomodoroView from '../views/PomodoroView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'pomodoro',
      component: PomodoroView,
    },
  ],
})

export default router
