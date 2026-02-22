<template>
  <div class="transactions-page">
    <header class="header">
      <div class="header-left">
        <span class="logo-line"></span>
        <h1>消费明细</h1>
      </div>
      <div class="header-right">
        <button class="btn-recharge" @click="showRechargeModal = true">充值</button>
        <button class="btn-back" @click="goBack">返回</button>
      </div>
    </header>

    <!-- 充值弹窗 -->
    <div v-if="showRechargeModal" class="modal-overlay" @click="showRechargeModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>充值积分</h3>
          <button class="btn-close" @click="showRechargeModal = false">×</button>
        </div>
        <div class="modal-body">
          <p class="rate-info">充值比率：1元 = {{ rate }}积分</p>
          
          <!-- 支付渠道选择 -->
          <div class="form-group">
            <label>选择支付方式</label>
            <div class="payment-channels">
              <div 
                class="payment-channel" 
                :class="{ active: paymentChannel === 'alipay' }"
                @click="paymentChannel = 'alipay'"
              >
                <div class="channel-icon alipay">支</div>
                <div class="channel-name">支付宝</div>
                <div v-if="paymentChannel === 'alipay'" class="channel-check">✓</div>
              </div>
              <div 
                class="payment-channel" 
                :class="{ active: paymentChannel === 'wechat' }"
                @click="paymentChannel = 'wechat'"
              >
                <div class="channel-icon wechat">微</div>
                <div class="channel-name">微信支付</div>
                <div v-if="paymentChannel === 'wechat'" class="channel-check">✓</div>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label>充值金额（元）</label>
            <input 
              v-model.number="rechargeAmount" 
              type="number" 
              min="1" 
              placeholder="请输入充值金额"
            />
          </div>
          <div class="preview">
            将获得 <strong>{{ rechargePoints }}</strong> 积分
          </div>
          <p class="channel-tip">
            当前支付方式：{{ paymentChannel === 'alipay' ? '支付宝' : '微信支付' }}（演示环境会自动完成支付）
          </p>
          <div v-if="rechargeError" class="error-message">{{ rechargeError }}</div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="showRechargeModal = false">取消</button>
          <button 
            class="btn-confirm" 
            @click="handleRecharge" 
            :disabled="rechargeLoading || rechargeAmount <= 0"
          >
            {{
              rechargeLoading
                ? paymentChannel === 'alipay'
                  ? '正在使用支付宝支付...'
                  : '正在使用微信支付...'
                : '确认充值'
            }}
          </button>
        </div>
      </div>
    </div>

    <main class="main-content">
      <!-- 余额概览 -->
      <div class="balance-overview">
        <div class="balance-card">
          <div class="balance-label">当前余额</div>
          <div class="balance-amount">{{ userBalance }}</div>
        </div>
        <div class="stats-cards">
          <div class="stat-card">
            <div class="stat-label">总消费</div>
            <div class="stat-value expense">-{{ totalExpense }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">总充值</div>
            <div class="stat-value income">+{{ totalIncome }}</div>
          </div>
        </div>
      </div>

      <!-- 筛选 -->
      <div class="filter-bar">
        <select v-model="filterType" @change="handleFilter">
          <option value="">全部类型</option>
          <option value="consume">消费</option>
          <option value="recharge">充值</option>
        </select>
      </div>

      <!-- 交易列表 -->
      <div class="transactions-list">
        <div v-if="loading" class="loading">加载中...</div>
        <div v-else-if="transactions.length === 0" class="empty">
          暂无交易记录
        </div>
        <div v-else>
          <div 
            v-for="item in transactions" 
            :key="item.id" 
            class="transaction-item"
            :class="item.type"
          >
            <div class="transaction-info">
              <div class="transaction-type">
                {{ item.type === 'consume' ? '消费' : '充值' }}
              </div>
              <div class="transaction-desc">{{ item.description }}</div>
              <div class="transaction-time">{{ formatTime(item.createdAt) }}</div>
            </div>
            <div class="transaction-amount">
              <div class="amount" :class="item.type">
                {{ item.type === 'consume' ? '-' : '+' }}{{ Math.abs(item.amount) }}
              </div>
              <div class="balance-after">余额: {{ item.balanceAfter }}</div>
            </div>
          </div>

          <!-- 分页 -->
          <div class="pagination" v-if="pagination.totalPages > 1">
            <button 
              :disabled="pagination.page === 1" 
              @click="changePage(pagination.page - 1)"
            >
              上一页
            </button>
            <span>{{ pagination.page }} / {{ pagination.totalPages }}</span>
            <button 
              :disabled="pagination.page === pagination.totalPages" 
              @click="changePage(pagination.page + 1)"
            >
              下一页
            </button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { transactionApi, rechargeApi } from '../api'

export default {
  name: 'Transactions',
  setup() {
    const router = useRouter()
    const transactions = ref([])
    const loading = ref(false)
    const filterType = ref('')
    const pagination = ref({
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0
    })
    
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    const userBalance = ref(user.balance || 0)
    const totalExpense = ref(0)
    const totalIncome = ref(0)

    // 充值相关
    const showRechargeModal = ref(false)
    const rechargeAmount = ref(10)
    const rechargeLoading = ref(false)
    const rechargeError = ref('')
    const paymentChannel = ref('alipay')
    const rate = ref(100)

    const rechargePoints = computed(() => {
      return Math.floor(rechargeAmount.value * rate.value)
    })

    const fetchTransactions = async () => {
      loading.value = true
      try {
        const res = await transactionApi.getList({
          page: pagination.value.page,
          limit: pagination.value.limit,
          type: filterType.value
        })
        
        if (res.data.code === 0) {
          transactions.value = res.data.data.list
          pagination.value = res.data.data.pagination
        }
      } catch (error) {
        console.error('Failed to fetch transactions:', error)
      } finally {
        loading.value = false
      }
    }

    const fetchStatistics = async () => {
      try {
        const res = await transactionApi.getStatistics()
        if (res.data.code === 0) {
          const stats = res.data.data
          const consume = stats.find(s => s.type === 'consume')
          const recharge = stats.find(s => s.type === 'recharge')
          totalExpense.value = consume ? consume.expense : 0
          totalIncome.value = recharge ? recharge.income : 0
        }
      } catch (error) {
        console.error('Failed to fetch statistics:', error)
      }
    }

    const handleFilter = () => {
      pagination.value.page = 1
      fetchTransactions()
    }

    const changePage = (page) => {
      pagination.value.page = page
      fetchTransactions()
    }

    const formatTime = (time) => {
      return new Date(time).toLocaleString('zh-CN')
    }

    const goBack = () => {
      router.push('/')
    }

    const fetchRate = async () => {
      try {
        const res = await rechargeApi.getRate()
        if (res.data.code === 0 && res.data.data && res.data.data.rate) {
          rate.value = res.data.data.rate
        }
      } catch (error) {
        console.error('Failed to fetch recharge rate:', error)
      }
    }

    const handleRecharge = async () => {
      if (rechargeAmount.value <= 0) {
        rechargeError.value = '请输入有效的充值金额'
        return
      }

      rechargeLoading.value = true
      rechargeError.value = ''

      try {
        const res = await rechargeApi.recharge({ 
          amount: rechargeAmount.value,
          channel: paymentChannel.value
        })
        if (res.data.code === 0) {
          // 更新余额
          userBalance.value = res.data.data.balance
          const user = JSON.parse(localStorage.getItem('user') || '{}')
          user.balance = res.data.data.balance
          localStorage.setItem('user', JSON.stringify(user))

          // 关闭弹窗并刷新列表
          showRechargeModal.value = false
          rechargeAmount.value = 10
          paymentChannel.value = 'alipay'
          fetchTransactions()
          fetchStatistics()
          
          const channelName = res.data.data.channelName || '支付'
          const orderNo = res.data.data.orderNo
          alert(`${channelName}充值成功！订单号：${orderNo}，获得 ${res.data.data.points} 积分`)
        } else {
          rechargeError.value = res.data.message
        }
      } catch (error) {
        rechargeError.value = error.response?.data?.message || '充值失败'
      } finally {
        rechargeLoading.value = false
      }
    }

    onMounted(() => {
      fetchTransactions()
      fetchStatistics()
      fetchRate()
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      if (user.balance !== undefined) {
        userBalance.value = user.balance
      }
    })

    return {
      transactions,
      loading,
      filterType,
      pagination,
      userBalance,
      totalExpense,
      totalIncome,
      showRechargeModal,
      rechargeAmount,
      rechargeLoading,
      rechargeError,
      rechargePoints,
      paymentChannel,
      rate,
      handleFilter,
      changePage,
      formatTime,
      goBack,
      handleRecharge
    }
  }
}
</script>

<style scoped>
.transactions-page {
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

.header h1 {
  font-size: 20px;
  font-weight: 600;
  color: #262626;
}

.btn-back {
  padding: 8px 16px;
  background: #fff;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.main-content {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.balance-overview {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 24px;
  margin-bottom: 24px;
}

.balance-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 24px;
  border-radius: 8px;
  text-align: center;
}

.balance-label {
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 8px;
}

.balance-amount {
  font-size: 36px;
  font-weight: 600;
}

.stats-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.stat-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

.stat-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
}

.stat-value.expense {
  color: #ff4d4f;
}

.stat-value.income {
  color: #52c41a;
}

.filter-bar {
  margin-bottom: 16px;
}

.filter-bar select {
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
}

.transactions-list {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

.loading,
.empty {
  padding: 48px;
  text-align: center;
  color: #999;
}

.transaction-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.transaction-item:last-child {
  border-bottom: none;
}

.transaction-type {
  font-size: 14px;
  font-weight: 500;
  color: #262626;
  margin-bottom: 4px;
}

.transaction-desc {
  font-size: 13px;
  color: #666;
  margin-bottom: 4px;
}

.transaction-time {
  font-size: 12px;
  color: #999;
}

.transaction-amount {
  text-align: right;
}

.amount {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 4px;
}

.amount.consume {
  color: #ff4d4f;
}

.amount.recharge {
  color: #52c41a;
}

.balance-after {
  font-size: 12px;
  color: #999;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border-top: 1px solid #f0f0f0;
}

.pagination button {
  padding: 6px 12px;
  background: #fff;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  cursor: pointer;
}

.pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-recharge {
  padding: 8px 16px;
  background: #52c41a;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  margin-right: 12px;
}

.btn-recharge:hover {
  background: #73d13d;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  width: 400px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.modal-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #262626;
}

.btn-close {
  background: none;
  border: none;
  font-size: 24px;
  color: #999;
  cursor: pointer;
}

.rate-info {
  color: #666;
  font-size: 14px;
  margin-bottom: 16px;
  padding: 12px;
  background: #f6ffed;
  border-radius: 4px;
  text-align: center;
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
  box-sizing: border-box;
}

.preview {
  text-align: center;
  padding: 12px;
  background: #f0f5ff;
  border-radius: 4px;
  margin-bottom: 16px;
  color: #666;
}

.preview strong {
  color: #1890ff;
  font-size: 18px;
}

.channel-tip {
  margin-top: 8px;
  font-size: 13px;
  color: #999;
  text-align: center;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
}

.btn-cancel {
  padding: 8px 16px;
  border: 1px solid #d9d9d9;
  background: #fff;
  border-radius: 4px;
  cursor: pointer;
}

.btn-confirm {
  padding: 8px 16px;
  background: #52c41a;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-confirm:disabled {
  background: #b7eb8f;
  cursor: not-allowed;
}

.error-message {
  color: #ff4d4f;
  font-size: 13px;
  text-align: center;
}

/* 支付渠道选择样式 */
.payment-channels {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.payment-channel {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 12px;
  border: 2px solid #e8e8e8;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.payment-channel:hover {
  border-color: #d9d9d9;
  background-color: #fafafa;
}

.payment-channel.active {
  border-color: #1890ff;
  background-color: #e6f7ff;
}

.channel-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: bold;
  color: white;
  margin-bottom: 8px;
}

.channel-icon.alipay {
  background: linear-gradient(135deg, #1677ff 0%, #0958d9 100%);
}

.channel-icon.wechat {
  background: linear-gradient(135deg, #07c160 0%, #059845 100%);
}

.channel-name {
  font-size: 14px;
  color: #262626;
  font-weight: 500;
}

.channel-check {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 18px;
  height: 18px;
  background: #1890ff;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}
</style>
