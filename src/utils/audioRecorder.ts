export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null
  private audioChunks: Blob[] = []
  private stream: MediaStream | null = null
  private isRecording = false

  async startRecording(): Promise<void> {
    try {
      // 请求麦克风权限
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      })
      
      // 创建 MediaRecorder
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: 'video/mp4'
      })
      
      this.audioChunks = []
      
      // 监听数据可用事件
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data)
        }
      }
      
      // 开始录音
      this.mediaRecorder.start(100) // 每100ms收集一次数据
      this.isRecording = true
      
    } catch (error) {
      throw new Error(`无法访问麦克风: ${error}`)
    }
  }

  stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || !this.isRecording) {
        reject(new Error('录音未开始'))
        return
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'video/mp4' })
        this.cleanup()
        resolve(audioBlob)
      }

      this.mediaRecorder.stop()
      this.isRecording = false
    })
  }

  getRecordingState(): boolean {
    return this.isRecording
  }

  private cleanup(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop())
      this.stream = null
    }
    this.mediaRecorder = null
    this.audioChunks = []
  }

  // 将 Blob 转换为 File 对象
  blobToFile(blob: Blob, fileName: string): File {
    return new File([blob], fileName, { type: blob.type })
  }

  // 检查浏览器是否支持录音
  static isSupported(): boolean {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
  }
}
