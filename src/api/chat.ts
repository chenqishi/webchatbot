import { getConfig } from '../config'
const ENDPOINT = getConfig().chat.endpoint || '/custom-im/chat-messages'
import md5 from 'blueimp-md5'

type SendPayload = {
  client: string
  secret: string
  signature: string
  timestamp: number
  message_info: {
    version: string
    content: string
    message_type: number
    event_type: string
    from_user_id: string
    from_user_nickname: string
    from_user_type: number
    msg_id: string
    create_timestamp: number
    files_info: any[]
  }
}

export async function sendChatMessage(urlParams,content: string, files: any[] = [], event_type: string ='website_dialog') {
  const nowSec = Math.floor(Date.now() / 1000)
  const cfg = getConfig()
  const client: string = String(cfg.chat.client || '')
  const secret: string = String(cfg.chat.secret || '')
  const signature = md5(secret + String(nowSec) + client)
  const payload: SendPayload = {
    client,
    secret,
    signature,
    timestamp: nowSec,
    message_info: {
      ...urlParams,
      version: 'v2',
      content,
      message_type: 1,
      event_type: event_type,
      from_user_type: 2,
      msg_id: crypto.randomUUID(),
      create_timestamp: nowSec,
      files_info: files
    }
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 120000)

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    })
    clearTimeout(timeout)

    const contentType = res.headers.get('content-type') || ''
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(text || `HTTP ${res.status}`)
    }


      const data: any = JSON.parse(await res.text())

      if (data && typeof data === 'object') {
        if (Number(data.code) === 200 && data?.data?.content) {
          return data.data.content
        }
        return []
      }
      
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      throw new Error('请求超时，请稍后再试。')
    }
    throw new Error(err?.message || '发送失败')
  } finally {
    clearTimeout(timeout)
  }
}


