export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null
  private audioChunks: Blob[] = []
  private stream: MediaStream | null = null
  private isRecording = false
  private mimeType = ''

  // Get supported MIME type
  private getSupportedMimeType(): string {
    const types = [
      'audio/webm',
      'audio/webm;codecs=opus',
      'audio/ogg;codecs=opus',
      'audio/mp4',
      'audio/aac',
      'audio/mpeg',
      'audio/wav'
    ]
    
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type
      }
    }
    
    return '' // Use default
  }

  async startRecording(): Promise<void> {
    try {
      // Request microphone permission
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      })
      
      // Get supported MIME type
      this.mimeType = this.getSupportedMimeType()
      
      // Create MediaRecorder
      const options = this.mimeType ? { mimeType: this.mimeType } : {}
      this.mediaRecorder = new MediaRecorder(this.stream, options)
      
      this.audioChunks = []
      
      // Listen for data available event
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data)
        }
      }
      
      // Start recording
      this.mediaRecorder.start(100) // Collect data every 100ms
      this.isRecording = true
      
    } catch (error) {
      throw new Error(`Unable to access microphone: ${error}`)
    }
  }

  stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || !this.isRecording) {
        reject(new Error('Recording not started'))
        return
      }

      this.mediaRecorder.onstop = () => {
        const mimeType = this.mimeType || this.mediaRecorder?.mimeType || 'audio/webm'
        const audioBlob = new Blob(this.audioChunks, { type: mimeType })
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

  // Convert Blob to File object
  blobToFile(blob: Blob, fileName: string): File {
    return new File([blob], fileName, { type: blob.type })
  }

  // Check if browser supports recording
  static isSupported(): boolean {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder)
  }
}
