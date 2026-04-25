import {createRouter, createWebHistory} from 'vue-router'

import Home from '@/pages/home.vue'
import Message from '@/pages/message.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: Home
    },
    {
      path: '/message',
      component: Message
    }
  ]
})

export default router