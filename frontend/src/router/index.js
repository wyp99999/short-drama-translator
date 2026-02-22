import { createRouter, createWebHistory } from 'vue-router'
import ProjectList from '../views/ProjectList.vue'
import Login from '../views/Login.vue'
import Transactions from '../views/Transactions.vue'

const routes = [
  {
    path: '/',
    name: 'ProjectList',
    component: ProjectList
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/transactions',
    name: 'Transactions',
    component: Transactions
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Demo版本：移除路由守卫，直接访问
router.beforeEach((to, from, next) => {
  // 如果是登录页，重定向到首页（Demo不需要登录）
  if (to.path === '/login') {
    next('/')
    return
  }
  
  next()
})

export default router
