import { createRouter, createWebHistory } from 'vue-router'
import ProjectList from '../views/ProjectList.vue'
import Login from '../views/Login.vue'
import Transactions from '../views/Transactions.vue'

const routes = [
  {
    path: '/',
    name: 'ProjectList',
    component: ProjectList,
    meta: { requiresAuth: true }
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { requiresGuest: true }
  },
  {
    path: '/transactions',
    name: 'Transactions',
    component: Transactions,
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  
  // 需要登录的页面
  if (to.meta.requiresAuth && !token) {
    next('/login')
    return
  }
  
  // 游客页面（登录页），已登录用户跳转到首页
  if (to.meta.requiresGuest && token) {
    next('/')
    return
  }
  
  next()
})

export default router
