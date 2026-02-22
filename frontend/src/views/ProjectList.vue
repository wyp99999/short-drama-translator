<template>
  <div class="project-list">
    <header class="header">
      <div class="header-left">
        <span class="logo-line"></span>
        <h1>星幕—多语言短剧出海</h1>
      </div>
      <div class="header-right">
        <div class="balance" @click="goToTransactions" style="cursor: pointer;">
          剩余额度 <span class="amount">{{ userBalance }}</span>
          <i class="icon-help">?</i>
        </div>
        <div class="user-menu">
          <div class="user-info" @click="toggleUserMenu">
            <i class="icon-user"></i>
            <span>{{ userName }}</span>
            <i class="icon-arrow" :class="{ 'rotated': showUserMenu }">▼</i>
          </div>
          <div v-if="showUserMenu" class="user-dropdown">
            <div class="dropdown-item" @click="handleLogout">
              <span>退出登录</span>
            </div>
          </div>
        </div>
      </div>
    </header>

    <main class="main-content">
      <div class="toolbar">
        <div class="search-box">
          <input 
            v-model="searchKeyword" 
            placeholder="请输入项目名称" 
            @keyup.enter="handleSearch"
          />
          <button class="btn-search" @click="handleSearch">搜索</button>
        </div>
        <button class="btn-add" @click="showCreateModal = true">新增项目</button>
      </div>

      <table class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>项目名称</th>
            <th>原始素材数量</th>
            <th>译制语言</th>
            <th>创建时间 <span class="sort-icon">▼</span></th>
            <th>完成时间</th>
            <th>视频时长</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="project in projects" :key="project.id">
            <td>{{ project.id }}</td>
            <td>{{ project.name }}</td>
            <td>{{ project.materialCount }}</td>
            <td>{{ project.languages }}</td>
            <td>{{ formatDateTime(project.createdAt) }}</td>
            <td>{{ formatDateTime(project.completedAt) }}</td>
            <td>{{ project.videoDuration }}</td>
            <td>
              <span :class="['status', getStatusClass(project.status)]">
                {{ getStatusText(project.status) }}
              </span>
            </td>
            <td class="actions">
              <a href="#" @click.prevent="handleEdit(project)">编辑</a>
              <template v-if="project.status === 'completed'">
                <a href="#" @click.prevent="handleDownload(project)">下载 ▼</a>
                <a href="#" @click.prevent="handlePreview(project)">预览</a>
              </template>
              <a href="#" @click.prevent="handleDelete(project)" class="delete">删除</a>
            </td>
          </tr>
        </tbody>
      </table>

      <div class="pagination" v-if="pagination.totalPages > 1">
        <button 
          :disabled="pagination.page === 1" 
          @click="changePage(1)"
        >
          首页
        </button>
        <button 
          :disabled="pagination.page === 1" 
          @click="changePage(pagination.page - 1)"
        >
          上一页
        </button>
        <span>第 {{ pagination.page }} / {{ pagination.totalPages }} 页</span>
        <button 
          :disabled="pagination.page === pagination.totalPages" 
          @click="changePage(pagination.page + 1)"
        >
          下一页
        </button>
        <button 
          :disabled="pagination.page === pagination.totalPages" 
          @click="changePage(pagination.totalPages)"
        >
          末页
        </button>
        <span class="pagination-info">
          共 {{ pagination.total }} 条记录，每页 {{ pagination.limit }} 条
        </span>
      </div>
    </main>

    <!-- 创建项目弹窗 -->
    <CreateModal 
      v-if="showCreateModal" 
      @close="showCreateModal = false"
      :userBalance="userBalance"
      @submit="handleCreate"
    />

    <!-- 编辑项目弹窗 -->
    <EditModal 
      v-if="showEditModal" 
      :project="currentProject"
      @close="showEditModal = false"
      @submit="handleUpdate"
    />

    <!-- 预览弹窗 -->
    <PreviewModal
      v-if="showPreviewModal"
      :project="currentProject"
      @close="showPreviewModal = false"
    />
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { projectApi } from '../api'
import CreateModal from '../components/CreateModal.vue'
import EditModal from '../components/EditModal.vue'
import PreviewModal from '../components/PreviewModal.vue'

export default {
  name: 'ProjectList',
  components: {
    CreateModal,
    EditModal,
    PreviewModal
  },
  setup() {
    const router = useRouter()
    const projects = ref([])
    const pagination = ref({
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0
    })
    const searchKeyword = ref('')
    const showCreateModal = ref(false)
    const showEditModal = ref(false)
    const showPreviewModal = ref(false)
    const currentProject = ref(null)
    const showUserMenu = ref(false)
    let pollInterval = null
    
    // 获取用户信息
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    const userName = ref(user.username || '用户')
    const userBalance = ref(user.balance || 44184.4)
    
    const toggleUserMenu = () => {
      showUserMenu.value = !showUserMenu.value
    }
    
    const handleLogout = () => {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }

    const goToTransactions = () => {
      router.push('/transactions')
    }

    const fetchProjects = async () => {
      try {
        const res = await projectApi.getList({ 
          keyword: searchKeyword.value,
          page: pagination.value.page,
          limit: pagination.value.limit
        })
        if (res.data.code === 0) {
          projects.value = res.data.data.list
          pagination.value = res.data.data.pagination
        }
      } catch (error) {
        console.error('Failed to fetch projects:', error)
      }
    }

    const pollStatus = async () => {
      for (const project of projects.value) {
        if (project.status === 'processing' || project.status === 'pending') {
          try {
            const res = await projectApi.getStatus(project.id)
            if (res.data.code === 0) {
              const task = res.data.data
              if (task.status !== project.status) {
                fetchProjects()
                break
              }
            }
          } catch (error) {
            console.error('Poll status error:', error)
          }
        }
      }
    }

    const handleSearch = () => {
      pagination.value.page = 1
      fetchProjects()
    }

    const handleCreate = async (formData) => {
      try {
        const res = await projectApi.create(formData)
        if (res.data.code === 0) {
          showCreateModal.value = false
          fetchProjects()
          // 更新用户余额
          if (res.data.data.balance !== undefined) {
            userBalance.value = res.data.data.balance
            const user = JSON.parse(localStorage.getItem('user') || '{}')
            user.balance = res.data.data.balance
            localStorage.setItem('user', JSON.stringify(user))
          }
        }
      } catch (error) {
        console.error('Failed to create project:', error)
        alert(error.response?.data?.message || '创建项目失败')
      }
    }

    const handleEdit = (project) => {
      currentProject.value = project
      showEditModal.value = true
    }

    const handleUpdate = async (data) => {
      try {
        const res = await projectApi.update(currentProject.value.id, data)
        if (res.data.code === 0) {
          showEditModal.value = false
          fetchProjects()
        }
      } catch (error) {
        console.error('Failed to update project:', error)
        alert('更新项目失败')
      }
    }

    const handleDelete = async (project) => {
      if (!confirm(`确定要删除项目 "${project.name}" 吗？`)) return
      try {
        const res = await projectApi.delete(project.id)
        if (res.data.code === 0) {
          fetchProjects()
        }
      } catch (error) {
        console.error('Failed to delete project:', error)
        alert('删除项目失败')
      }
    }

    const handlePreview = (project) => {
      currentProject.value = project
      showPreviewModal.value = true
    }

    const handleDownload = (project) => {
      alert(`下载项目: ${project.name}`)
    }

    const getStatusClass = (status) => {
      const map = {
        'completed': 'success',
        'failed': 'error',
        'processing': 'processing',
        'pending': 'pending'
      }
      return map[status] || 'pending'
    }

    const getStatusText = (status) => {
      const map = {
        'completed': '已完成',
        'failed': '制作失败',
        'processing': '制作中',
        'pending': '待处理'
      }
      return map[status] || status
    }

    const changePage = (page) => {
      if (page < 1 || page > pagination.value.totalPages) return
      pagination.value.page = page
      fetchProjects()
    }

    const formatDateTime = (value) => {
      if (!value) return '-'
      const date = new Date(value)
      if (Number.isNaN(date.getTime())) return value
      const pad = (n) => n.toString().padStart(2, '0')
      const y = date.getFullYear()
      const m = pad(date.getMonth() + 1)
      const d = pad(date.getDate())
      const h = pad(date.getHours())
      const mi = pad(date.getMinutes())
      const s = pad(date.getSeconds())
      return `${y}-${m}-${d} ${h}:${mi}:${s}`
    }

    onMounted(() => {
      fetchProjects()
      pollInterval = setInterval(pollStatus, 5000)
    })

    onUnmounted(() => {
      if (pollInterval) clearInterval(pollInterval)
    })

    return {
      projects,
      searchKeyword,
      pagination,
      showCreateModal,
      showEditModal,
      showPreviewModal,
      currentProject,
      showUserMenu,
      userName,
      userBalance,
      toggleUserMenu,
      handleLogout,
      goToTransactions,
      handleSearch,
      handleCreate,
      handleEdit,
      handleUpdate,
      handleDelete,
      handlePreview,
      handleDownload,
      getStatusClass,
      getStatusText,
      changePage,
      formatDateTime
    }
  }
}
</script>

<style scoped>
.project-list {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-line {
  width: 4px;
  height: 24px;
  background: #1890ff;
  border-radius: 2px;
}

.header-left h1 {
  font-size: 20px;
  font-weight: 600;
  color: #262626;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 24px;
}

.balance {
  padding: 6px 12px;
  background: #f6ffed;
  border: 1px solid #b7eb8f;
  border-radius: 4px;
  font-size: 14px;
  color: #52c41a;
  cursor: pointer;
  transition: all 0.3s;
}

.balance:hover {
  background: #d9f7be;
  border-color: #95de64;
}

.balance .amount {
  font-weight: 600;
  margin: 0 4px;
}

.icon-help {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  background: #999;
  color: #fff;
  border-radius: 50%;
  font-size: 11px;
  cursor: help;
}

.user-menu {
  position: relative;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #595959;
  font-size: 14px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background 0.3s;
}

.user-info:hover {
  background: #f5f5f5;
}

.icon-arrow {
  font-size: 10px;
  transition: transform 0.3s;
}

.icon-arrow.rotated {
  transform: rotate(180deg);
}

.user-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  margin-top: 4px;
  min-width: 120px;
  z-index: 1000;
}

.dropdown-item {
  padding: 10px 16px;
  cursor: pointer;
  font-size: 14px;
  color: #595959;
  transition: background 0.3s;
}

.dropdown-item:hover {
  background: #f5f5f5;
}

.main-content {
  padding: 24px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.search-box {
  display: flex;
  gap: 8px;
}

.search-box input {
  width: 240px;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
}

.btn-search {
  padding: 8px 16px;
  background: #1890ff;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-add {
  padding: 8px 16px;
  background: #1890ff;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.data-table {
  width: 100%;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
}

.data-table th {
  font-weight: 600;
  color: #262626;
  background: #fafafa;
}

.data-table td {
  color: #595959;
  font-size: 14px;
}

.sort-icon {
  font-size: 12px;
  color: #1890ff;
}

.status {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.status.success {
  background: #f6ffed;
  color: #52c41a;
  border: 1px solid #b7eb8f;
}

.status.error {
  background: #fff2f0;
  color: #ff4d4f;
  border: 1px solid #ffa39e;
}

.status.processing {
  background: #e6f7ff;
  color: #1890ff;
  border: 1px solid #91d5ff;
}

.status.pending {
  background: #f5f5f5;
  color: #999;
  border: 1px solid #d9d9d9;
}

.actions {
  display: flex;
  gap: 12px;
}

.actions a {
  color: #1890ff;
  text-decoration: none;
  font-size: 14px;
}

.actions a:hover {
  text-decoration: underline;
}

.actions a.delete {
  color: #ff4d4f;
}

.pagination {
  margin-top: 16px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  font-size: 14px;
}

.pagination button {
  padding: 6px 12px;
  border-radius: 4px;
  border: 1px solid #d9d9d9;
  background: #fff;
  cursor: pointer;
}

.pagination button:disabled {
  cursor: not-allowed;
  color: #bfbfbf;
  border-color: #f0f0f0;
}

.pagination-info {
  margin-left: 16px;
  color: #595959;
}
</style>
