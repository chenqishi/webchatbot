export class CameraCapture {
  private stream: MediaStream | null = null
  private videoElement: HTMLVideoElement | null = null

  async initializeCamera(videoElement) {
    try {
      // 请求摄像头权限
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user' // 前置摄像头
        } 
      })

      this.videoElement = videoElement

      if(this.videoElement){
        this.videoElement.srcObject = this.stream
        this.videoElement.autoplay = true
        this.videoElement.playsInline = true
        this.videoElement.style.width = '100%'
        this.videoElement.style.height = 'auto'
      }
      
      // 创建video元素
      // this.videoElement = document.createElement('video')
      // this.videoElement.srcObject = this.stream
      // this.videoElement.autoplay = true
      // this.videoElement.playsInline = true
      // this.videoElement.style.width = '100%'
      // this.videoElement.style.height = 'auto'
      // return this.videoElement
    } catch (error) {
      throw new Error(`无法访问摄像头: ${error}`)
    }
  }

  capturePhoto(): string | null {
    if (!this.videoElement) {
      throw new Error('摄像头未初始化')
    }

    try {
      // 创建canvas元素
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      
      if (!context) {
        throw new Error('无法创建canvas上下文')
      }

      // 设置canvas尺寸
      canvas.width = this.videoElement.videoWidth
      canvas.height = this.videoElement.videoHeight
      
      // 绘制当前视频帧到canvas
      context.drawImage(this.videoElement, 0, 0, canvas.width, canvas.height)
      
      // 转换为base64图片
      return canvas.toDataURL('image/jpeg', 0.8)
    } catch (error) {
      throw new Error(`拍照失败: ${error}`)
    }
  }

  // 将base64转换为File对象
  dataURLToFile(dataURL: string, fileName: string): File {
    const arr = dataURL.split(',')
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg'
    const bstr = atob(arr[1])
    let n = bstr.length
    const u8arr = new Uint8Array(n)
    
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n)
    }
    
    return new File([u8arr], fileName, { type: mime })
  }

  stopCamera(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop())
      this.stream = null
    }
    this.videoElement = null
  }

  // 检查浏览器是否支持摄像头
  static isSupported(): boolean {
    return !!(
      navigator.mediaDevices && 
      navigator.mediaDevices.getUserMedia &&
      document.createElement('canvas').getContext
    )
  }
}

