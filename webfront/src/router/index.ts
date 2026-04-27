import {createRouter, createWebHistory} from 'vue-router'

import Home from '@/pages/home.vue'
import Message from '@/pages/message.vue'
import LoginBili from '@/pages/loginBili.vue'

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
    },
    {
      path: '/login',
      component: LoginBili
    }
  ]
})

export default router