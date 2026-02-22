<template>
  <div class="modal-overlay" @click="handleClose">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>预览成片</h2>
        <button class="btn-close" @click="handleClose">×</button>
      </div>
      
      <div class="modal-body">
        <h3 class="project-name">{{ project.name }}</h3>
        
        <div class="language-tabs">
          <button
            v-for="lang in availableLanguages"
            :key="lang.code"
            :class="['tab-btn', { active: currentLang === lang.code }]"
            @click="currentLang = lang.code"
          >
            {{ lang.name }}
          </button>
        </div>
        
        <div class="video-container">
          <video 
            ref="videoPlayer"
            controls
            :src="videoUrl"
            class="video-player"
          ></video>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { projectApi } from '../api'

export default {
  name: 'PreviewModal',
  props: {
    project: {
      type: Object,
      required: true
    }
  },
  emits: ['close'],
  setup(props, { emit }) {
    const currentLang = ref('en')
    const projectDetail = ref(null)
    
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
    
    const availableLanguages = computed(() => {
      if (!projectDetail.value) return []
      const langNames = projectDetail.value.languages || []
      return languages.filter(l => langNames.includes(l.name))
    })
    
    const videoUrl = computed(() => {
      if (!projectDetail.value) return ''
      const translations = projectDetail.value.translations || {}
      return translations[currentLang.value] || projectDetail.value.videoUrl
    })
    
    onMounted(async () => {
      try {
        const res = await projectApi.getPreview(props.project.id)
        if (res.data.code === 0) {
          projectDetail.value = res.data.data
          if (availableLanguages.value.length > 0) {
            currentLang.value = availableLanguages.value[0].code
          }
        }
      } catch (error) {
        console.error('Failed to load preview:', error)
      }
    })
    
    const handleClose = () => {
      emit('close')
    }
    
    return {
      currentLang,
      availableLanguages,
      videoUrl,
      handleClose
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
  background: rgba(0, 0, 0, 0.7);
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
  padding: 24px;
}

.project-name {
  font-size: 16px;
  color: #262626;
  margin-bottom: 16px;
}

.language-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 12px;
}

.tab-btn {
  padding: 8px 16px;
  border: none;
  background: transparent;
  color: #595959;
  cursor: pointer;
  font-size: 14px;
  border-radius: 4px;
  transition: all 0.3s;
}

.tab-btn:hover {
  color: #1890ff;
}

.tab-btn.active {
  background: #1890ff;
  color: #fff;
}

.video-container {
  background: #000;
  border-radius: 4px;
  overflow: hidden;
}

.video-player {
  width: 100%;
  height: 480px;
  display: block;
}
</style>
