<template>
  <div class="auth-page">
    <div class="auth-container">
      <div class="auth-header">
        <h1>星幕—多语言短剧出海</h1>
        <p>短剧多语言智能翻译平台</p>
      </div>
      
      <div class="auth-box">
        <h2>{{ isLogin ? '登录' : '注册' }}</h2>
        
        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label>用户名</label>
            <input 
              v-model="form.username" 
              type="text" 
              placeholder="请输入用户名"
              required
            />
          </div>
          
          <div v-if="!isLogin" class="form-group">
            <label>邮箱</label>
            <input 
              v-model="form.email" 
              type="email" 
              placeholder="请输入邮箱"
              required
            />
          </div>
          
          <div class="form-group">
            <label>密码</label>
            <input 
              v-model="form.password" 
              type="password" 
              placeholder="请输入密码"
              required
            />
          </div>
          
          <div v-if="error" class="error-message">
            {{ error }}
          </div>
          
          <button type="submit" class="btn-submit" :disabled="loading">
            {{ loading ? '处理中...' : (isLogin ? '登录' : '注册') }}
          </button>
        </form>
        
        <div class="auth-switch">
          {{ isLogin ? '还没有账号？' : '已有账号？' }}
          <a href="#" @click.prevent="toggleMode">
            {{ isLogin ? '立即注册' : '立即登录' }}
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { authApi } from '../api'

export default {
  name: 'Login',
  setup() {
    const router = useRouter()
    const isLogin = ref(true)
    const loading = ref(false)
    const error = ref('')
    
    const form = reactive({
      username: '',
      email: '',
      password: ''
    })
    
    const toggleMode = () => {
      isLogin.value = !isLogin.value
      error.value = ''
      form.username = ''
      form.email = ''
      form.password = ''
    }
    
    const handleSubmit = async () => {
      loading.value = true
      // 不再在这里清空错误信息，错误信息会持续显示
      
      try {
        let res
        if (isLogin.value) {
          res = await authApi.login({
            username: form.username,
            password: form.password
          })
        } else {
          res = await authApi.register({
            username: form.username,
            email: form.email,
            password: form.password
          })
        }
        
        if (res.data.code === 0) {
          // 成功登录/注册后清除错误信息
          error.value = ''
          // 保存token和用户信息
          localStorage.setItem('token', res.data.data.token)
          localStorage.setItem('user', JSON.stringify(res.data.data.user))
          router.push('/')
        } else {
          error.value = res.data.message
        }
      } catch (err) {
        error.value = err.response?.data?.message || '操作失败，请重试'
      } finally {
        loading.value = false
      }
    }
    
    return {
      isLogin,
      form,
      loading,
      error,
      toggleMode,
      handleSubmit
    }
  }
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.auth-container {
  width: 100%;
  max-width: 420px;
  padding: 20px;
}

.auth-header {
  text-align: center;
  color: white;
  margin-bottom: 30px;
}

.auth-header h1 {
  font-size: 28px;
  margin-bottom: 8px;
}

.auth-header p {
  font-size: 14px;
  opacity: 0.9;
}

.auth-box {
  background: white;
  border-radius: 8px;
  padding: 32px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.auth-box h2 {
  text-align: center;
  margin-bottom: 24px;
  color: #333;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 14px;
  color: #555;
}

.form-group input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.3s;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
}

.error-message {
  color: #f56c6c;
  font-size: 13px;
  margin-bottom: 16px;
  padding: 8px;
  background: #fef0f0;
  border-radius: 4px;
}

.btn-submit {
  width: 100%;
  padding: 12px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.3s;
}

.btn-submit:hover {
  background: #5568d3;
}

.btn-submit:disabled {
  background: #a5b4fc;
  cursor: not-allowed;
}

.auth-switch {
  text-align: center;
  margin-top: 20px;
  font-size: 14px;
  color: #666;
}

.auth-switch a {
  color: #667eea;
  text-decoration: none;
  margin-left: 4px;
}

.auth-switch a:hover {
  text-decoration: underline;
}
</style>
