import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000
})

// Demo版本：移除认证拦截器
api.interceptors.request.use(
  (config) => {
    // Demo不需要token，直接返回配置
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Demo版本：简化响应拦截器
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 只记录错误，不跳转登录页
    console.error('API Error:', error.response?.status, error.message)
    return Promise.reject(error)
  }
)

export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getCurrentUser: () => api.get('/auth/me')
}

export const projectApi = {
  getList: (params) => api.get('/projects', { params }),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
  getStatus: (id) => api.get(`/projects/${id}/status`),
  getPreview: (id) => api.get(`/projects/${id}/preview`)
}

export default api

export const transactionApi = {
  getList: (params) => api.get('/transactions', { params }),
  getStatistics: () => api.get('/transactions/statistics')
}


export const rechargeApi = {
  getRate: () => api.get("/recharge/rate"),
  recharge: (data) => api.post("/recharge", data),
  getOrderStatus: (orderNo) => api.get(`/recharge/order/${orderNo}`),
}
