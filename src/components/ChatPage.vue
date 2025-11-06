<template>
  <div class="chat-page" :class="{ 'has-messages': messages.length > 0 }">
    <!-- 头部 -->
    <header class="header">
      <div class="logo">
        <div class="logo-icon">
          <img :src="ui.header.logoUrl" />
        </div>
        <span class="logo-text">{{ ui.header.name }}</span>
      </div>
      <div class="header-actions" v-if="messages.length > 0">
        <button class="refresh-btn" @click="handleRefresh"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg></button>
      </div>
    </header>

    <!-- 主内容区 -->
    <main class="main-content">
      <!-- 默认状态 - 无消息时 -->
      <div v-if="messages.length == 0" class="welcome-section">
        <h1 class="welcome-title">{{ ui.main.title }}</h1>
        <p class="welcome-subtitle">{{ ui.main.subtitle }}</p>
        <div class="input-container">
          <div v-if="pendingFiles.length" class="pending-files">
            <div 
              v-for="(file, idx) in pendingFiles" 
              :key="file.content"
              class="pending-item"
            >
              <div class="pending-image">
                <img v-if="file.file_type === 'image'" :src="file.content" />
                <audio v-else-if="file.file_type === 'audio'" :src="file.content" controls class="pending-audio" />
              </div>
              <div class="pending-remove" @click="removePending(idx)">
                <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none" viewBox="0 0 24 24"><path fill="currentColor" fill-rule="evenodd" d="M1 12c0 6.075 4.925 11 11 11s11-4.925 11-11S18.075 1 12 1 1 5.925 1 12m9.586 0L7.465 8.878a1 1 0 0 1 1.414-1.414L12 10.586l3.121-3.122a1 1 0 1 1 1.415 1.414L13.414 12l3.122 3.121a1 1 0 0 1-1.415 1.414l-3.12-3.121-3.122 3.121a1 1 0 1 1-1.414-1.414z" clip-rule="evenodd"></path></svg>
              </div>
            </div>

          </div>
          <div class="input-tools">
          <textarea
            v-model="draft"
            class="message-input"
            :placeholder="ui.main.placeholder"
            rows="1"
            @keydown="handleKeyDown"
            @input="adjustHeight"
            ref="messageInput"
          ></textarea>
          <div class="input-actions">
            <button 
              class="attach-btn" 
              type="button"
              @click="triggerFileUpload"
              :disabled="sending"
            >
            <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none" viewBox="0 0 24 24"><path fill="currentColor" fill-rule="evenodd" d="M9.035 15.956a1.29 1.29 0 0 0 1.821-.004l6.911-6.911a3.15 3.15 0 0 0 0-4.457l-.034-.034a3.15 3.15 0 0 0-4.456 0l-7.235 7.234a5.031 5.031 0 0 0 7.115 7.115l6.577-6.577a1.035 1.035 0 0 1 1.463 1.464l-6.576 6.577A7.1 7.1 0 0 1 4.579 10.32l7.235-7.234a5.22 5.22 0 0 1 7.382 0l.034.034a5.22 5.22 0 0 1 0 7.383l-6.91 6.91a3.36 3.36 0 0 1-4.741.012l-.006-.005-.012-.011a3.346 3.346 0 0 1 0-4.732L12.76 7.48a1.035 1.035 0 0 1 1.464 1.463l-5.198 5.198a1.277 1.277 0 0 0 0 1.805z" clip-rule="evenodd"></path></svg>
            </button>

          <!-- 录音按钮 -->
          <button 
            v-if="!isRecording"
            class="record-btn" 
            type="button"
            @click="startRecording"
            :disabled="sending"
          >
          <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none" viewBox="0 0 24 24"><path fill="currentColor" fill-rule="evenodd" d="M12 2.5A2.5 2.5 0 0 1 14.5 5v6a2.5 2.5 0 0 1-5 0V5A2.5 2.5 0 0 1 12 2.5M7.5 5a4.5 4.5 0 0 1 9 0v6a4.5 4.5 0 1 1-9 0zm-2 4a1 1 0 0 0-2 0v2c0 4.213 3.26 7.928 7.5 8.44V21H7.3a1 1 0 1 0 0 2h9.4a1 1 0 1 0 0-2H13v-1.56c4.24-.512 7.5-4.227 7.5-8.44V9a1 1 0 1 0-2 0v2c0 3.46-2.915 6.5-6.5 6.5S5.5 14.46 5.5 11z" clip-rule="evenodd"></path></svg>
          </button>
          
          <!-- 停止录音按钮 -->
          <button 
            v-else
            class="stop-record-btn" 
            type="button"
            @click="stopRecording"
          >
            <div class="stop-icon"></div>
          </button>
          
          <!-- 录音时长显示 -->
          <span v-if="isRecording" class="recording-duration">
            {{ formatDuration(recordingDuration) }}
          </span>
          <!-- 拍照按钮 -->
          <button 
            class="camera-btn" 
            type="button"
            @click="startCamera"
            :disabled="sending || isRecording || isCapturing"
            style="display: none;"
          >
          <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="12" rx="2" ry="2"/><circle cx="12" cy="13" r="3"/><path d="m7 7 2-2h6l2 2"/></svg>
         
          </button>
          <div class="line"></div>
            <button 
              class="send-btn" 
              type="button"
              @click="handleSend"
              :disabled="(!draft.trim()&&!pendingFiles.length) || sending || isRecording || isCapturing"
            >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><path d="m22 2-7 20-4-9-9-4Z"></path><path d="M22 2 11 13"></path></svg>
            </button>
          </div>

        </div>
        </div>
        <div v-if="ui.main.power.image && ui.main.power.href" class="power-container">
          <a :href="ui.main.power.href">Power by<img :src="ui.main.power.image" /></a>
        </div>
      </div>

      <!-- 聊天消息区 -->
      <div v-else class="messages-container">
        <div 
          v-for="message in messages" 
          :key="message.id" 
          class="message-item"
          :class="message.role"
        >
          <!-- <div v-if="message.role === 'assistant'" class="avatar">AI</div> -->
          <div  v-if="message.role === 'assistant'" class="message-content" :style="messageStyle">
            <div v-if="message.files && message.files.length" class="message-files">
              <div v-for="file in message.files" :key="file.content" class="file-item">
                <img v-if="file.file_type === 'image'" :src="file.content" :alt="'Image'" class="file-image" />
                <audio v-else-if="file.file_type === 'audio'" :src="file.content" controls class="file-audio" />
                <video v-else-if="file.file_type === 'video'" :src="file.content" controls class="file-video" />
                <div class="file-document" v-else><a :href="file.content"><svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none" viewBox="0 0 24 24"><path fill="currentColor" fill-rule="evenodd" d="M3.75 7h16.563c0 .48-.007 1.933-.016 3.685.703.172 1.36.458 1.953.837V5.937a2 2 0 0 0-2-2h-6.227a3 3 0 0 1-1.015-.176L9.992 2.677A3 3 0 0 0 8.979 2.5h-5.23a2 2 0 0 0-1.999 2v14.548a2 2 0 0 0 2 2h10.31a6.5 6.5 0 0 1-1.312-2H3.75S3.742 8.5 3.75 7m15.002 14.5a.514.514 0 0 0 .512-.454c.24-1.433.451-2.169.907-2.625.454-.455 1.186-.666 2.611-.907a.513.513 0 0 0-.002-1.026c-1.423-.241-2.155-.453-2.61-.908-.455-.457-.666-1.191-.906-2.622a.514.514 0 0 0-.512-.458.52.52 0 0 0-.515.456c-.24 1.432-.452 2.167-.907 2.624-.454.455-1.185.667-2.607.909a.514.514 0 0 0-.473.513.52.52 0 0 0 .47.512c1.425.24 2.157.447 2.61.9.455.454.666 1.19.907 2.634a.52.52 0 0 0 .515.452" clip-rule="evenodd"></path></svg><span>Document</span></a></div>
              </div>
            </div>
            <div class="message-text" v-html="renderMarkdown(message.text)"></div>
            <!-- <div class="message-time">{{ formatTime(message.time) }}</div> -->
          </div>
          <div v-else class="message-content" :style="messageStyleUser">
            <div v-if="message.files && message.files.length" class="message-files">
              <div v-for="file in message.files" :key="file.content" class="file-item">
                <img v-if="file.file_type === 'image'" :src="file.content" :alt="'Image'" class="file-image" />
                <audio v-else-if="file.file_type === 'audio'" :src="file.content" controls class="file-audio" />
              </div>
            </div>
            <div class="message-text" v-html="renderMarkdown(message.text)"></div>
            <!-- <div class="message-time">{{ formatTime(message.time) }}</div> -->
          </div>
        </div>

        <!-- 等待回复状态 -->
        <div v-if="sending" class="message-item assistant">
          <!-- <div class="avatar">AI</div> -->
          <div class="loading-dot-container">
            <div class="loading-dot"></div>
          </div>
        </div>
      </div>
    </main>

    <!-- 底部输入区 -->
    <footer v-if="messages.length >= 1"  class="input-footer">
      <div class="input-container">
        <div v-if="pendingFiles.length" class="pending-files">
          <div 
            v-for="(file, idx) in pendingFiles" 
            :key="file.content"
            class="pending-item"
          >
            <div class="pending-image">
              <img v-if="file.file_type === 'image'" :src="file.content" />
              <audio v-else-if="file.file_type === 'audio'" :src="file.content" controls class="pending-audio" />
            </div>
            <div class="pending-remove" @click="removePending(idx)">
              <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none" viewBox="0 0 24 24"><path fill="currentColor" fill-rule="evenodd" d="M1 12c0 6.075 4.925 11 11 11s11-4.925 11-11S18.075 1 12 1 1 5.925 1 12m9.586 0L7.465 8.878a1 1 0 0 1 1.414-1.414L12 10.586l3.121-3.122a1 1 0 1 1 1.415 1.414L13.414 12l3.122 3.121a1 1 0 0 1-1.415 1.414l-3.12-3.121-3.122 3.121a1 1 0 1 1-1.414-1.414z" clip-rule="evenodd"></path></svg>
            </div>
          </div>
        </div>
        <div class="input-tools">
          <textarea
            v-model="draft"
            class="message-input"
            :placeholder="ui.main.placeholder"
            rows="1"
            @keydown="handleKeyDown"
            @input="adjustHeight"
            ref="messageInput"
          ></textarea>
          <div class="input-actions">
            <button 
              class="attach-btn" 
              type="button"
              @click="triggerFileUpload"
              :disabled="sending || isRecording"
            >
            <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none" viewBox="0 0 24 24"><path fill="currentColor" fill-rule="evenodd" d="M9.035 15.956a1.29 1.29 0 0 0 1.821-.004l6.911-6.911a3.15 3.15 0 0 0 0-4.457l-.034-.034a3.15 3.15 0 0 0-4.456 0l-7.235 7.234a5.031 5.031 0 0 0 7.115 7.115l6.577-6.577a1.035 1.035 0 0 1 1.463 1.464l-6.576 6.577A7.1 7.1 0 0 1 4.579 10.32l7.235-7.234a5.22 5.22 0 0 1 7.382 0l.034.034a5.22 5.22 0 0 1 0 7.383l-6.91 6.91a3.36 3.36 0 0 1-4.741.012l-.006-.005-.012-.011a3.346 3.346 0 0 1 0-4.732L12.76 7.48a1.035 1.035 0 0 1 1.464 1.463l-5.198 5.198a1.277 1.277 0 0 0 0 1.805z" clip-rule="evenodd"></path></svg>
            </button>
            
            <!-- 录音按钮 -->
            <button 
              v-if="!isRecording"
              class="record-btn" 
              type="button"
              @click="startRecording"
              :disabled="sending"
            >
            <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none" viewBox="0 0 24 24"><path fill="currentColor" fill-rule="evenodd" d="M12 2.5A2.5 2.5 0 0 1 14.5 5v6a2.5 2.5 0 0 1-5 0V5A2.5 2.5 0 0 1 12 2.5M7.5 5a4.5 4.5 0 0 1 9 0v6a4.5 4.5 0 1 1-9 0zm-2 4a1 1 0 0 0-2 0v2c0 4.213 3.26 7.928 7.5 8.44V21H7.3a1 1 0 1 0 0 2h9.4a1 1 0 1 0 0-2H13v-1.56c4.24-.512 7.5-4.227 7.5-8.44V9a1 1 0 1 0-2 0v2c0 3.46-2.915 6.5-6.5 6.5S5.5 14.46 5.5 11z" clip-rule="evenodd"></path></svg>
            </button>
            
            <!-- 停止录音按钮 -->
            <button 
              v-else
              class="stop-record-btn" 
              type="button"
              @click="stopRecording"
            >
              <div class="stop-icon"></div>
            </button>
            
            <!-- 录音时长显示 -->
            <span v-if="isRecording" class="recording-duration">
              {{ formatDuration(recordingDuration) }}
            </span>
            
            <!-- 拍照按钮 -->
            <button 
              class="camera-btn" 
              type="button"
              @click="startCamera"
              :disabled="sending || isRecording || isCapturing"
              style="display: none;"
            >
            <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="12" rx="2" ry="2"/><circle cx="12" cy="13" r="3"/><path d="m7 7 2-2h6l2 2"/></svg>
            </button>
            <div class="line"></div>
            <button 
              class="send-btn" 
              type="button"
              @click="handleSend"
              :disabled="(!draft.trim()&&!pendingFiles.length) || sending || isRecording || isCapturing"
            >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><path d="m22 2-7 20-4-9-9-4Z"></path><path d="M22 2 11 13"></path></svg>
            </button>
          </div>
        </div>
      </div>
      
    </footer>


      <!-- 隐藏的文件输入 -->
      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        style="display: none"
        @change="handleFileSelect"
      />
  </div>

    <!-- 摄像头预览模态框 -->
    <div v-if="showCamera" class="camera-modal">
      <div class="camera-overlay" @click="cancelPhoto"></div>
      <div class="camera-container">
        <div class="camera-header">
          <h3>Take Photo</h3>
          <button class="close-btn" @click="cancelPhoto">×</button>
        </div>
        <div class="camera-preview">
          <video autoplay="true" ref="cameraPreview" playsinline="" style="width: 100%; height: auto;"></video>
        </div>
        <div class="camera-controls">
          <button class="capture-btn" @click="capturePhoto">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
          </button>
        </div>
      </div>
    </div>

    <!-- 拍照确认模态框 -->
    <div v-if="capturedPhoto" class="photo-modal">
      <div class="photo-overlay" @click="cancelPhoto"></div>
      <div class="photo-container">
        <div class="photo-header">
          <h3>Preview Photo</h3>
          <button class="close-btn" @click="cancelPhoto">×</button>
        </div>
        <div class="photo-preview">
          <img :src="capturedPhoto" alt="Captured photo" />
        </div>
        <div class="photo-controls">
          <button class="retake-btn" @click="retakePhoto">Retake</button>
          <button class="confirm-btn" @click="confirmPhoto">Confirm</button>
        </div>
      </div>
    </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted } from 'vue'
import markdownit from 'markdown-it'
import { sendChatMessage } from '../api/chat'
import { uploadFileToS3, getFileType, type UploadedFile } from '../api/s3'
import { AudioRecorder } from '../utils/audioRecorder'
import { CameraCapture } from '../utils/cameraCapture'
import { loadConfig, getConfig } from '../config'

type Msg = { 
  id: string
  role: 'user' | 'assistant'
  text: string
  time: number
  files?: UploadedFile[]
}
const messageQueue = ref([])
const currentIndex = ref(0)

const messages = ref<Msg[]>([
])
const draft = ref('')
const sending = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const messageInput = ref<HTMLTextAreaElement | null>(null)

const urlParams = ref({
  from_user_id: '',
  from_user_nickname: ''
});


const md = markdownit({
  html: true,
  breaks: true,
  linkify: true
})

// 录音相关状态
const audioRecorder = new AudioRecorder()
const isRecording = ref(false)
const recordingDuration = ref(0)
const recordingTimer = ref<number | null>(null)

// 拍照相关状态
const cameraCapture = new CameraCapture()
const showCamera = ref(false)
const capturedPhoto = ref<string | null>(null)
const isCapturing = ref(false)
const cameraPreview = ref<HTMLDivElement | null>(null)
// UI 配置
const ui = ref({
  header: { logoUrl: './assets/favicon-light.svg', name: 'ChatAI' },
  main: { title: 'Welcome to Chat AI', subtitle: 'Ask me anything to get started!', placeholder:'', power: { image: '', href: '' } },
})

const messageStyle = ref<Record<string, string, string>>({ 
  fontSize: '14px', 
  fontFamily: 'inherit',
  aiBackground: '#ececf0',
  aiColor: '#212529',
})

const messageStyleUser = ref<Record<string, string, string>>({ 
  fontSize: '14px', 
  fontFamily: 'inherit',
  userBackground: '#1e3a8a',
  userColor: '#ffffff',
})

// 待发送已上传文件队列
const pendingFiles = ref<UploadedFile[]>([])

function removePending(index: number) {
  pendingFiles.value.splice(index, 1)
}


function formatTime(ts: number) {
  const d = new Date(ts)
  const hh = `${d.getHours()}`.padStart(2, '0')
  const mm = `${d.getMinutes()}`.padStart(2, '0')
  return `${hh}:${mm}`
}

function getUrlParams() {
  const params = {};
  const search = window.location.search;
  if (search) {
    const queryString = search.slice(1);
    const paramArray = queryString.split('&');
    paramArray.forEach(item => {
      const [key, value] = item.split('=');
      if (key && value) {
        params[key] = decodeURIComponent(value);
      }
    });
  }
  return params;
};

// 替换后的markdown渲染方法
function renderMarkdown(text) {
  if (!text) return ''
  return md.render(text)
}


function scrollToBottom() {
  nextTick(() => {
    const container = document.querySelector('.main-content')
    if (container) {
      container.scrollTop = container.scrollHeight
    }
  })
}

function triggerFileUpload() {
  fileInput.value?.click()
}

async function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  try {
    const fileType = getFileType(file)
    const uploadedFile = await uploadFileToS3(file, fileType)
    // Add to pending queue, don't send immediately
    pendingFiles.value.push(uploadedFile)
  } catch (error: any) {
    console.error('File upload failed:', error)
    alert(`File upload failed: ${error.message}`)
  } finally {
    // Clear file input
    if (target) target.value = ''
  }
}
function showMessage(){
  if (messageQueue.value.length > 0) {
    const nextMsg = messageQueue.value.shift();
    if(nextMsg.type=='text'){
      const userMsg: Msg = {
        id: crypto.randomUUID(),
        role: 'assistant',
        text: '',
        time: Date.now()
      }
      messages.value.push(userMsg)
      simulateStreamingDisplay(nextMsg.content)
    }else{
      const userMsg: Msg = {
        id: crypto.randomUUID(),
        role: 'assistant',
        text: '',
        time: Date.now(),
        files: [{
          content: nextMsg.content,
          file_type: nextMsg.type
        }]
      }
      messages.value.push(userMsg)
      scrollToBottom();
      setTimeout(()=>{showMessage()},1000)
      
    }
  } 
}
function simulateStreamingDisplay(fullText) {
  let currentText = '';
  let index = 0;
  const currentMessageIndex = messages.value.length - 1;
  
  // 设置打字状态
  messages.value[currentMessageIndex].typing = true;
  
  // ChatGPT风格的流畅打字效果参数
  const baseSpeed = 12; // 基础延迟时间(ms) - 更快更流畅
  const maxSpeed = 25; // 最大延迟时间(ms)
  const minSpeed = 5; // 最小延迟时间(ms)
  
  const typeWriter = () => {
    if (index < fullText.length) {
      // 根据字符类型调整速度，让打字更自然
      const char = fullText[index];
      let speed = baseSpeed;
      
      // 标点符号稍作停顿，模拟思考
      if (/[。！？]/.test(char)) {
        speed = baseSpeed * 2;
      }
      // 逗号等短停顿
      else if (/[，、；：]/.test(char)) {
        speed = baseSpeed * 1.5;
      }
      // 空格和换行很快
      else if (/[\s\n]/.test(char)) {
        speed = baseSpeed * 0.2;
      }
      // 中文字符正常速度，稍微随机化
      else if (/[\u4e00-\u9fa5]/.test(char)) {
        speed = baseSpeed + Math.random() * 5;
      }
      // 英文字符稍快
      else if (/[a-zA-Z0-9]/.test(char)) {
        speed = baseSpeed * 0.6;
      }
      
      // 添加微小的随机变化，让打字更自然流畅
      speed += Math.random() * 8 - 4;
      speed = Math.max(minSpeed, Math.min(maxSpeed, speed));
      
      // 添加字符
      currentText += char;
      index++;

      // 更新消息内容
      messages.value[currentMessageIndex].text = currentText;
      
      // 滚动到底部
      scrollToBottom();
      
      // 继续下一个字符
      setTimeout(typeWriter, speed);
    } else {
      // 打字完成，移除typing状态
      messages.value[currentMessageIndex].typing = false;
      
      // 等待1秒后显示下一条消息
      setTimeout(() => { showMessage() }, 1000);
    }
  };
  
  // 开始打字效果
  typeWriter();
}
async function sendToAI(userMsg: Msg) {
  sending.value = true
  try {
    const replyText = await sendChatMessage(
      urlParams.value,
      userMsg.text, 
      userMsg.files || []
    )
    
    
    if(replyText.length){
      messageQueue.value = replyText
      showMessage()
    }else{
      const reply: Msg = {
        id: crypto.randomUUID(),
        role: 'assistant',
        text: '(No response from AI)',
        time: Date.now()
      }
      messages.value.push(reply)
    }
    
  } catch (e: any) {
    const errMsg: Msg = {
      id: crypto.randomUUID(),
      role: 'assistant',
      text: `Request failed: ${e?.message || e}`,
      time: Date.now()
    }
    messages.value.push(errMsg)
  } finally {
    sending.value = false
    scrollToBottom()
  }
}

async function handleRefresh() {
  messages.value = []
  scrollToBottom()
  
  // Send reset command to server
  try {
    await sendChatMessage(
      urlParams.value,
      'reset', 
      [],
      'cmd_dialog'
    )
  } catch (error: any) {
    console.error('Reset request failed:', error)
  }
}

// 处理键盘事件
function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    handleSend()
  }
}

// 自动调整textarea高度
function adjustHeight() {
  const textarea = messageInput.value
  if (textarea) {
    textarea.style.height = 'auto'
    const scrollHeight = textarea.scrollHeight
    const maxHeight = 120 // 约5行的高度
    textarea.style.height = Math.min(scrollHeight, maxHeight) + 'px'
  }
}

async function handleSend() {
  const text = draft.value.trim()
  if ((!text && !pendingFiles.value.length) || sending.value) return

  const userMsg: Msg = {
    id: crypto.randomUUID(),
    role: 'user',
    text: text || '',
    time: Date.now(),
    files: pendingFiles.value.length ? [...pendingFiles.value] : []
  }
  
  messages.value.push(userMsg)
  draft.value = ''
  pendingFiles.value = []
  
  // 重置textarea高度
  if (messageInput.value) {
    messageInput.value.style.height = 'auto'
  }
  
  setTimeout(()=>{
    scrollToBottom()
  },100)
  
  
  await sendToAI(userMsg)
}

// Recording control functions
async function startRecording() {
  if (!AudioRecorder.isSupported()) {
    alert('If you want to use voice messages, please allow microphone access.')
    return
  }

  try {
    await audioRecorder.startRecording()
    isRecording.value = true
    recordingDuration.value = 0
    
    // Start timer
    recordingTimer.value = window.setInterval(() => {
      recordingDuration.value++
    }, 1000)
  } catch (error: any) {
    alert('If you want to use voice messages, please allow microphone access.')
  }
}

async function stopRecording() {
  try {
    const audioBlob = await audioRecorder.stopRecording()
    
    // Stop timer
    if (recordingTimer.value) {
      clearInterval(recordingTimer.value)
      recordingTimer.value = null
    }
    
    isRecording.value = false
    
    // Don't send if recording is too short
    if (recordingDuration.value < 1) {
      alert('Recording too short, please try again')
      return
    }
    
    // Convert to File object and upload
    const audioFile = audioRecorder.blobToFile(audioBlob, `recording_${Date.now()}.webm`)
    await handleAudioUpload(audioFile)
    
    recordingDuration.value = 0
  } catch (error: any) {
    alert(`Stop recording failed: ${error.message}`)
    isRecording.value = false
    recordingDuration.value = 0
  }
}

async function handleAudioUpload(audioFile: File) {
  try {
    const uploadedFile = await uploadFileToS3(audioFile, 'audio')

    // Create message with audio file
    const userMsg: Msg = {
      id: crypto.randomUUID(),
      role: 'user',
      text: '',
      time: Date.now(),
      files: [uploadedFile]
    }
    
    messages.value.push(userMsg)
    scrollToBottom()
    
    // Send to AI
    await sendToAI(userMsg)

    // Add audio to pending queue
    // pendingFiles.value.push(uploadedFile)
  } catch (error: any) {
    console.error('Audio upload failed:', error)
    alert(`Audio upload failed: ${error.message}`)
  }
}

// Format recording duration display
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// Camera control functions
async function startCamera() {
  if (!CameraCapture.isSupported()) {
    alert('Your browser does not support camera')
    return
  }

  try {
    isCapturing.value = true
    showCamera.value = true
    nextTick(() => {
      cameraCapture.initializeCamera(cameraPreview.value)
    })
    
    // Add video element to preview container
    // nextTick(() => {
    //   if (cameraPreview.value && videoElement) {
    //     cameraPreview.value.innerHTML = ''
    //     cameraPreview.value.appendChild(videoElement)
    //   }
    // })
  } catch (error: any) {
    alert(`Failed to start camera: ${error.message}`)
    isCapturing.value = false
  }
}

function capturePhoto() {
  try {
    const photoDataURL = cameraCapture.capturePhoto()
    if (photoDataURL) {
      capturedPhoto.value = photoDataURL
      showCamera.value = false
      cameraCapture.stopCamera()
    }
  } catch (error: any) {
    cameraCapture.stopCamera()
    alert(`Failed to capture photo: ${error.message}`)
  }
}

function retakePhoto() {
  capturedPhoto.value = null
  startCamera()
}

async function confirmPhoto() {
  if (!capturedPhoto.value) return

  try {
    // Convert to File object
    const photoFile = cameraCapture.dataURLToFile(capturedPhoto.value, `photo_${Date.now()}.jpg`)
    
    // Upload to S3 and add to pending queue
    const uploadedFile = await uploadFileToS3(photoFile, 'image')
    pendingFiles.value.push(uploadedFile)
    
    // Clean up state
    capturedPhoto.value = null
    isCapturing.value = false

    // Don't send immediately


  } catch (error: any) {
    console.error('Image upload failed:', error)
    alert(`Image upload failed: ${error.message}`)
  }
}

function cancelPhoto() {
  capturedPhoto.value = null
  showCamera.value = false
  isCapturing.value = false
  cameraCapture.stopCamera()
}

function escapeHtml(unsafe) {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

onMounted(() => {
  // Fix viewport height for mobile browsers with address bar
  const setVH = () => {
    const vh = window.innerHeight * 0.01
    document.documentElement.style.setProperty('--vh', `${vh}px`)
  }
  
  setVH()
  window.addEventListener('resize', setVH)
  window.addEventListener('orientationchange', setVH)
  
  // Prevent pull-to-refresh on mobile
  document.body.addEventListener('touchmove', (e) => {
    // Allow scrolling within the main-content area
    const target = e.target as HTMLElement
    const mainContent = document.querySelector('.main-content')
    
    if (mainContent && mainContent.contains(target)) {
      // Allow scrolling in main content
      return
    }
    
    // Prevent pull-to-refresh for other areas
    e.preventDefault()
  }, { passive: false })

  // Load runtime configuration
  loadConfig().then(() => {
    const cfg = getConfig()
    ui.value = {
      header: { logoUrl: cfg.header.logoUrl, name: cfg.header.name },
      main: { title: cfg.main.title, subtitle: cfg.main.subtitle,placeholder: cfg.main.placeholder, power: { ...cfg.main.power } },
    }
    messageStyle.value = {
      fontSize: cfg.message.fontSize,
      fontFamily: cfg.message.fontFamily,
      background: cfg.message.aiBackground,
      color: cfg.message.aiColor
    }
    messageStyleUser.value = {
      fontSize: cfg.message.fontSize,
      fontFamily: cfg.message.fontFamily,
      background: cfg.message.userBackground,
      color: cfg.message.userColor
    }
  })

  const params = getUrlParams();
  if(params.content){
    //sending.value = true
    messages.value.push({ 
        id: crypto.randomUUID(),
        role: 'assistant',
        text: '',
        time: Date.now()
      })
    setTimeout(()=>{
      //sending.value = false;
      simulateStreamingDisplay(escapeHtml(params.content))
    },200)
  }else{
    messages.value =[]
  }

  urlParams.value.from_user_id = params.from_user_id || crypto.randomUUID();
  urlParams.value.from_user_nickname = params.from_user_nickname || 'anonymous';

  // Initialize API call
  sendChatMessage(
    urlParams.value,
    'reset', 
    [],
    'cmd_dialog'
  )
})
</script>

<style scoped>
.chat-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: calc(var(--vh, 1vh) * 100);
  background: var(--bg);
  overflow: hidden;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
}

/* 头部样式 */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: var(--bg);
  border-bottom: 1px solid var(--border);
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo-icon {
  height: 24px;
  color: white;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}
.logo-icon img{
  height: 24px;
}

.logo-text {
  font-size: 14px;
  font-weight: 500;
  color: var(--fg);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.action-btn {
  background: var(--accent);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
}

.refresh-btn {
  background: transparent;
  color: var(--darkGray);
  border-radius: 50%;
  font-size: 18px;
}
.refresh-btn svg {
  width: 1rem;
  height: 1rem;
}

/* 主内容区 */
.main-content {
  flex: 1;
  overflow-y: auto;
  display: flex;
  justify-content: center;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  touch-action: pan-y;
}

.welcome-section {
  flex: 1;
  display: flex;
  justify-content: center;
  text-align: center;
  flex-direction: column;
  padding: 40px 20px;
  max-width: 42rem;
  width: 100%;
}

.welcome-title {
  font-size: 1.875rem;
  font-weight: 600;
  color: var(--fg);
  margin-bottom: 1rem;
  line-height: 1.2;
}

.welcome-subtitle {
  font-size: 1rem;
  color: var(--muted);
  margin-bottom: 4rem;
  line-height: 1.2;
}

.welcome-section .input-container {
  width: 100%;
  --tw-shadow: 0 10px 15px -3px #0000001a, 0 1px 2px -1px #0000001a;
}
.power-container a{
  margin-top: 2em;
  display: inline-block;
  text-align: center;
  font-weight: 600;
  line-height: 24px;
  text-decoration: none;
  color: inherit;
}
.power-container img{
  height: 64px;
  width: auto;
  vertical-align: middle;
}
.messages-container {
  flex: 1;
  padding: 1rem;
  margin-inline: auto;
  max-width: 56rem;
}

.message-item {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding-bottom: 20px;
}

.message-item.user {
  flex-direction: row-reverse;
}

.avatar {
  width: 32px;
  height: 32px;
  background: var(--lightGray);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 500;
  color: var(--muted);
  flex-shrink: 0;
}

.message-content {
  max-width: 70%;
  background: var(--panel);
  border-radius: 16px;
  padding: 12px 16px;
  position: relative;
}

.message-item.user .message-content {
  background: var(--accent);
  color: white;
}

.message-files {
  line-height: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.file-image {
  max-width: 200px;
  max-height: 200px;
  border-radius: 8px;
  object-fit: cover;
}
.file-video {
  max-width: 400px;
  max-height: 400px;
}
.file-audio {
  width: 200px;
  height: 40px;
}
.file-document a{
  display: flex;
  align-items: center;
    gap: 5px;
    height: 40px;
    font-weight: 600;
}
.message-text {
  margin: 0;
  line-height: 1.5;
  word-break: break-word;
}

.message-time {
  font-size: 12px;
  color: var(--muted);
  margin-top: 4px;
  text-align: right;
}

.message-item.user .message-time {
  color: rgba(255, 255, 255, 0.7);
}

.loading-message {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 底部输入区 */
.input-footer {
  padding: 1rem;
  background: var(--bg);
  border-top: 1px solid var(--border);
}

.input-container {
  border-radius: 24px;
  padding: 12px;
  margin-inline: auto;
  max-width: 56rem;
  border: 1px solid var(--border);
  --tw-shadow: 0 1px 3px 0  #0000001a, 0 1px 2px -1px #0000001a;
  box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
}
.input-tools{
  display: flex;
  align-items: center;
}

.pending-files {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.pending-item {
  position: relative;
  width: 52px;
  height: 52px;
}
.pending-image{
  border-radius: 8px;
  overflow: hidden;
  width: 52px;
  height: 52px;
  background: var(--panel);
  border: 1px solid var(--border);
}

.pending-image img{
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.pending-audio {
  width: 100%;
  height: 100%;
}

.pending-remove {
  position: absolute;
  top: -5px;
  right: -5px;
  width: 14px;
  height: 14px;
  padding: 0;
  border-radius: 50%;
  color: #000;
  border: none;
  line-height: 18px;
  text-align: center;
  cursor: pointer;
  display: none;
}

.pending-item:hover .pending-remove {
  display: block !important;
}
@property --tw-ring-offset-shadow {
    syntax: "*";
    inherits: false;
    initial-value: 0 0 #0000;
}
@property --tw-inset-ring-shadow {
    syntax: "*";
    inherits: false;
    initial-value: 0 0 #0000;
}
@property --tw-inset-shadow {
    syntax: "*";
    inherits: false;
    initial-value: 0 0 #0000;
}
@property --tw-ring-shadow {
    syntax: "*";
    inherits: false;
    initial-value: 0 0 #0000;
}

.message-input {
  flex: 1;
  background: transparent;
  padding: 8px 0;
  font-size: 14px;
  color: var(--fg);
  border: none;
  outline: none;
  resize: none;
  min-height: 20px;
  max-height: 120px; /* 约5行的高度 */
  line-height: 20px;
  overflow-y: auto;
  font-family: inherit;
}

.message-input::placeholder {
  color: var(--muted);
}

.input-actions {
  display: flex;
  align-items: center;
}

.attach-btn {
  background: transparent;
  color: var(--muted);
  padding: 8px;
  font-size: 16px;
  padding: 8px;
  border-radius: 8px;
  font-size: 16px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.attach-btn:hover{
  background-color: var(--panel);
}
.record-btn {
  background: transparent;
  color: var(--muted);
  padding: 8px;
  border-radius: 8px;
  font-size: 16px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  /*animation: pulse 2s infinite;*/
}

.record-btn:hover{
  background-color: var(--panel);
}

.camera-btn {
  background: transparent;
  color: var(--muted);
  padding: 8px;
  border-radius: 8px;
  font-size: 16px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.camera-btn:hover{
  background-color: var(--panel);
}

.stop-record-btn {
  background-color: var(--panel);
  color: white;
  padding: 8px;
  border-radius: 8px;
  font-size: 16px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stop-icon {
  width: 12px;
  height: 12px;
  background: #dc3545;
  border-radius: 50%;
}

.recording-duration {
  color: var(--accent);
  font-size: 12px;
  min-width: 40px;
  text-align: center;
}

.line{
  margin: 0px 12px 0px 4px;
  background-color: var(--border);
  width: 1px;
  height: 20px;
}

.send-btn {
  background: var(--accent);
  color: white;
  padding: 8px;
  border-radius: 50%;
  font-size: 16px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.send-btn svg {
  width: 1rem;
  height: 1rem;
}

/* 摄像头和拍照模态框样式 */
.camera-modal, .photo-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.camera-overlay, .photo-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
}

.camera-container, .photo-container {
  position: relative;
  background: var(--bg);
  border-radius: 12px;
  overflow: hidden;
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.camera-header, .photo-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
}

.camera-header h3, .photo-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: var(--muted);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
}

.close-btn:hover {
  background: var(--panel);
}

.camera-preview {
  width: 400px;
  height: 225px;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.camera-controls {
  padding: 20px;
  display: flex;
  justify-content: center;
}

.capture-btn {
  background: var(--accent);
  color: white;
  border: none;
  border-radius: 50%;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 24px;
}

.capture-btn:hover {
  background: var(--accentHover);
}

.photo-preview {
  padding: 20px;
  display: flex;
  justify-content: center;
  max-height: 400px;
  overflow: hidden;
}

.photo-preview img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 8px;
}

.photo-controls {
  padding: 20px;
  display: flex;
  gap: 12px;
  justify-content: center;
}

.retake-btn, .confirm-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
}

.retake-btn {
  background: var(--panel);
  color: var(--fg);
  border: 1px solid var(--border);
}

.retake-btn:hover {
  background: var(--lightGray);
}

.confirm-btn {
  background: var(--accent);
  color: white;
}

.confirm-btn:hover {
  background: var(--accentHover);
}

/* 响应式 */
@media (max-width: 768px) {
  .header {
    padding: 12px 16px;
  }
  
  .welcome-title {
    font-size: 24px;
  }
  
  .welcome-subtitle {
    font-size: 16px;
  }
  
  .messages-container {
    padding: 16px;
  }
  
  .input-footer {
    padding: 12px 16px;
  }
  
  .camera-container, .photo-container {
    max-width: 95vw;
    max-height: 95vh;
  }
}
</style>