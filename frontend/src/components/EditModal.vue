<template>
  <div class="modal-overlay" @click="handleClose">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>编辑项目</h2>
        <button class="btn-close" @click="handleClose">×</button>
      </div>
      
      <div class="modal-body">
        <div class="form-row">
          <label>项目名称</label>
          <div class="input-wrapper">
            <input v-model="form.name" maxlength="30" />
            <span class="char-count">{{ form.name.length }} / 30</span>
          </div>
        </div>
        
        <div class="form-row">
          <label>译制语言 <span class="hint">已译制的语言不可选,可新增译制语言</span></label>
          <div class="language-grid">
            <button
              v-for="lang in languages"
              :key="lang.code"
              :class="['lang-btn', { 
                active: form.languages.includes(lang.code),
                disabled: existingLanguages.includes(lang.code)
              }]"
              :disabled="existingLanguages.includes(lang.code)"
              @click="toggleLanguage(lang.code)"
            >
              {{ lang.name }}
            </button>
          </div>
        </div>
        
        <div class="cost-section">
          <span>消耗额度: <strong class="cost">{{ calculatedCost }}</strong></span>
          <span class="balance">剩余可用额度: <strong>44028.4</strong></span>
        </div>
      </div>
      
      <div class="modal-footer">
        <button class="btn-cancel" @click="handleClose">取消</button>
        <button class="btn-confirm" @click="handleSubmit">确定</button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'

export default {
  name: 'EditModal',
  props: {
    project: {
      type: Object,
      required: true
    }
  },
  emits: ['close', 'submit'],
  setup(props, { emit }) {
    const form = reactive({
      name: '',
      languages: []
    })
    
    const existingLanguages = ref([])
    
    const languages = [
      { code: 'zh', name: '中文' },
      { code: 'en', name: '英文' },
      { code: 'es', name: '西班牙语' },
      { code: 'ru', name: '俄语' },
      { code: 'fr', name: '法语' },
      { code: 'de', name: '德语' },
      { code: 'it', name: '意大利语' },
      { code: 'pt', name: '葡萄牙语' },
      { code: 'id', name: '印度尼西亚语' },
      { code: 'vi', name: '越南语' }
    ]
    
    onMounted(() => {
      form.name = props.project.name
      const langList = props.project.languages.split('、').map(l => {
        const found = languages.find(lang => lang.name === l)
        return found ? found.code : ''
      }).filter(Boolean)
      existingLanguages.value = langList
      form.languages = [...langList]
    })
    
    const calculatedCost = computed(() => {
      const newLangs = form.languages.filter(l => !existingLanguages.value.includes(l))
      const durationMinutes = 3
      const costPerMinute = 10
      return (durationMinutes * costPerMinute * newLangs.length).toFixed(1)
    })
    
    const toggleLanguage = (code) => {
      if (existingLanguages.value.includes(code)) return
      const index = form.languages.indexOf(code)
      if (index > -1) {
        form.languages.splice(index, 1)
      } else {
        form.languages.push(code)
      }
    }
    
    const handleClose = () => {
      emit('close')
    }
    
    const handleSubmit = () => {
      const newLanguages = form.languages.filter(l => !existingLanguages.value.includes(l))
      emit('submit', {
        name: form.name,
        languages: newLanguages
      })
    }
    
    return {
      form,
      languages,
      existingLanguages,
      calculatedCost,
      toggleLanguage,
      handleClose,
      handleSubmit
    }
  }
}
</script>

<style scoped>
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
  background: #fff;
  border-radius: 8px;
  width: 600px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #f0f0f0;
}

.modal-header h2 {
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

.modal-body {
  padding: 24px;
}

.form-row {
  margin-bottom: 20px;
}

.form-row label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: #262626;
}

.hint {
  color: #999;
  font-size: 12px;
  margin-left: 8px;
}

.input-wrapper {
  position: relative;
}

.input-wrapper input {
  width: 100%;
  padding: 8px 12px;
  padding-right: 60px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
}

.char-count {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
  color: #999;
}

.language-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.lang-btn {
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.lang-btn:hover:not(:disabled) {
  border-color: #1890ff;
  color: #1890ff;
}

.lang-btn.active {
  background: #1890ff;
  color: #fff;
  border-color: #1890ff;
}

.lang-btn:disabled {
  background: #f5f5f5;
  color: #999;
  cursor: not-allowed;
}

.cost-section {
  display: flex;
  justify-content: space-between;
  padding: 16px;
  background: #fafafa;
  border-radius: 4px;
  margin-top: 24px;
}

.cost {
  color: #faad14;
  font-size: 18px;
}

.balance {
  color: #999;
}

.balance strong {
  color: #faad14;
  font-size: 18px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #f0f0f0;
}

.btn-cancel {
  padding: 8px 24px;
  border: 1px solid #d9d9d9;
  background: #fff;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-confirm {
  padding: 8px 24px;
  background: #1890ff;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}
</style>
