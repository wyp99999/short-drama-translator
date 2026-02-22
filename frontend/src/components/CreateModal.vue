<template>
  <div class="modal-overlay" @click="handleClose">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>新建项目</h2>
        <button class="btn-close" @click="handleClose">×</button>
      </div>
      
      <div class="modal-body">
        <div class="form-section upload-section">
          <div class="upload-area" @click="triggerUpload" @drop.prevent="handleDrop" @dragover.prevent>
            <input 
              ref="fileInput"
              type="file" 
              accept=".mp4,.mkv" 
              style="display: none"
              @change="handleFileChange"
            />
            <div v-if="!selectedFile" class="upload-placeholder">
              <div class="upload-icon">📹</div>
              <p>点击或拖拽上传 <strong>视频文件</strong></p>
            </div>
            <div v-else class="file-info">
              <p>{{ selectedFile.name }}</p>
              <button class="btn-remove" @click.stop="removeFile">移除</button>
            </div>
          </div>
          
          <div class="video-requirements">
            <p><strong>视频要求：</strong></p>
            <ul>
              <li>格式支持：mp4/mkv</li>
              <li>最高分辨率：1080p</li>
              <li>时长限制：3分钟</li>
              <li>帧率限制：30帧以内</li>
            </ul>
          </div>
        </div>
        
        <div class="form-section form-fields">
          <div class="form-row">
            <label>项目名称</label>
            <div class="input-wrapper">
              <input 
                v-model="form.name" 
                placeholder="请输入项目名称"
                maxlength="30"
              />
              <span class="char-count">{{ form.name.length }} / 30</span>
            </div>
          </div>
          
          <div class="form-row">
            <label>译制语言 <span class="hint">支持多选</span></label>
            <div class="language-grid">
              <button
                v-for="lang in languages"
                :key="lang.code"
                :class="['lang-btn', { active: form.languages.includes(lang.code) }]"
                @click="toggleLanguage(lang.code)"
              >
                {{ lang.name }}
              </button>
            </div>
          </div>
          
          <div class="cost-section">
            <span>视频时长: <strong class="cost">{{ formattedDuration }}</strong></span>
            <span>消耗额度: <strong class="cost">{{ calculatedCost }}</strong></span>
            <span class="balance">剩余可用额度: <strong>{{ userBalance }}</strong></span>
          </div>
        </div>
      </div>
      
      <div class="modal-footer">
        <button class="btn-cancel" @click="handleClose">取消</button>
        <button class="btn-confirm" @click="handleSubmit" :disabled="!canSubmit">确定</button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed } from 'vue'

export default {
  props: {
    userBalance: {
      type: Number,
      default: 1000
    }
  },
  name: 'CreateModal',
  emits: ['close', 'submit'],
  setup(props, { emit }) {
    const fileInput = ref(null)
    const selectedFile = ref(null)
    const videoDurationSeconds = ref(0)
    
    const form = reactive({
      name: '',
      languages: []
    })
    
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
    
    const costPerMinute = 10
    
    const durationMinutes = computed(() => {
      if (!videoDurationSeconds.value) return 0
      return Math.ceil(videoDurationSeconds.value / 60)
    })
    
    const calculatedCost = computed(() => {
      if (!durationMinutes.value || !form.languages.length) return '0.0'
      return (durationMinutes.value * costPerMinute * form.languages.length).toFixed(1)
    })
    
    const formattedDuration = computed(() => {
      if (!videoDurationSeconds.value) return '未读取'
      const total = Math.floor(videoDurationSeconds.value)
      const minutes = Math.floor(total / 60)
      const seconds = total % 60
      if (!minutes && !seconds) return '0秒'
      if (!minutes) return `${seconds}秒`
      if (!seconds) return `${minutes}分钟`
      return `${minutes}分钟${seconds}秒`
    })
    
    const canSubmit = computed(() => {
      return form.name.trim() && selectedFile.value && form.languages.length > 0
    })
    
    const triggerUpload = () => {
      fileInput.value?.click()
    }
    
    const updateVideoDuration = (file) => {
      videoDurationSeconds.value = 0
      if (!file) return
      const url = URL.createObjectURL(file)
      const video = document.createElement('video')
      video.preload = 'metadata'
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(url)
        videoDurationSeconds.value = video.duration || 0
      }
      video.onerror = () => {
        window.URL.revokeObjectURL(url)
        videoDurationSeconds.value = 0
      }
      video.src = url
    }
    
    const handleFileChange = (e) => {
      const file = e.target.files[0]
      if (file) {
        selectedFile.value = file
        updateVideoDuration(file)
      }
    }
    
    const handleDrop = (e) => {
      const file = e.dataTransfer.files[0]
      if (file && (file.name.endsWith('.mp4') || file.name.endsWith('.mkv'))) {
        selectedFile.value = file
        updateVideoDuration(file)
      }
    }
    
    const removeFile = () => {
      selectedFile.value = null
      videoDurationSeconds.value = 0
      if (fileInput.value) {
        fileInput.value.value = ''
      }
    }
    
    const toggleLanguage = (code) => {
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
      const formData = new FormData()
      formData.append('name', form.name)
      formData.append('video', selectedFile.value)
      formData.append('languages', JSON.stringify(form.languages))
      emit('submit', formData)
    }
    
    return {
      fileInput,
      selectedFile,
      videoDurationSeconds,
      form,
      languages,
      calculatedCost,
      formattedDuration,
      canSubmit,
      triggerUpload,
      updateVideoDuration,
      handleFileChange,
      handleDrop,
      removeFile,
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
  width: 900px;
  max-height: 90vh;
  overflow-y: auto;
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
  display: flex;
  padding: 24px;
  gap: 24px;
}

.upload-section {
  flex: 0 0 360px;
}

.upload-area {
  height: 280px;
  border: 2px dashed #d9d9d9;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
}

.upload-area:hover {
  border-color: #1890ff;
}

.upload-placeholder {
  text-align: center;
  color: #999;
}

.upload-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.file-info {
  text-align: center;
}

.file-info p {
  color: #262626;
  margin-bottom: 16px;
  word-break: break-all;
}

.btn-remove {
  padding: 6px 16px;
  background: #ff4d4f;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.video-requirements {
  margin-top: 16px;
  padding: 12px;
  background: #f6ffed;
  border: 1px solid #b7eb8f;
  border-radius: 4px;
  font-size: 13px;
  color: #52c41a;
}

.video-requirements ul {
  margin-top: 8px;
  padding-left: 16px;
}

.video-requirements li {
  margin: 4px 0;
}

.form-fields {
  flex: 1;
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

.lang-btn:hover {
  border-color: #1890ff;
  color: #1890ff;
}

.lang-btn.active {
  background: #1890ff;
  color: #fff;
  border-color: #1890ff;
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

.balance strong

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

.btn-confirm:disabled {
  background: #bae7ff;
  cursor: not-allowed;
}
</style>
