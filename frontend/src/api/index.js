import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000
})

// 请求拦截器 - 添加token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器 - 处理401错误
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
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
