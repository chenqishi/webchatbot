export type AppConfig = {
  header?: {
    logoUrl?: string
    name?: string
  }
  main?: {
    title?: string
    subtitle?: string
    placeholder?: string
    power?: {
      image?: string
      href?: string
    }
  }
  message?: {
    fontSize?: string
    fontFamily?: string
    userBackground?: string
    userColor?: string
    aiBackground?: string
    aiColor?: string
  }
  chat?: {
    endpoint?: string
    client?: string
    secret?: string
  }
  s3?: {
    endpoint?: string
    accessKeyId?: string
    secretAccessKey?: string
    region?: string
    bucketName?: string
    s3ForcePathStyle?: boolean
    signatureVersion?: string
  }
}

const defaultConfig: Required<AppConfig> = {
  header: {
    logoUrl: './assets/favicon-light.svg',
    name: 'ChatAI'
  },
  main: {
    title: 'Welcome to Chat AI',
    subtitle: 'Ask me anything to get started!',
    placeholder: '',
    power: {
      image: '',
      href: ''
    }
  },
  message: {
    fontSize: '14px',
    fontFamily: 'inherit',
    userBackground: '#1e3a8a',
    userColor: '#ffffff',
    aiBackground: '#ececf0',
    aiColor: '#212529'
  },
  chat: {
    endpoint: '/custom-im/chat-messages',
    client: 'test_custom_channel',
    secret: 'test_123'
  },
  s3: {
    endpoint: '',
    accessKeyId: '',
    secretAccessKey: '',
    region: 'us-east-1',
    bucketName: '',
    s3ForcePathStyle: true,
    signatureVersion: 'v4'
  }
}

let cachedConfig: AppConfig | null = null

export async function loadConfig(): Promise<AppConfig> {
  if (cachedConfig) return cachedConfig
  try {
    const currentPath = window.location.pathname;
    const dirPath = currentPath.substring(0, currentPath.lastIndexOf('/'))||'';
    const url = `${dirPath}/assets/@config.json?_=${Date.now()}`
    const res = await fetch(url)
    if (res.ok) {
      const data = (await res.json()) as AppConfig
      cachedConfig = mergeConfig(defaultConfig, data || {})
    } else {
      cachedConfig = { ...defaultConfig }
    }
  } catch (_e) {
    cachedConfig = { ...defaultConfig }
  }
  return cachedConfig
}

export function getConfig(): Required<AppConfig> {
  return mergeConfig(defaultConfig, cachedConfig || {})
}

function mergeConfig<T extends Record<string, any>>(defaults: T, overrides: Record<string, any>): T {
  const result: any = Array.isArray(defaults) ? [] : { ...defaults }
  for (const key in overrides) {
    const dv = (defaults as any)[key]
    const ov = overrides[key]
    if (dv && typeof dv === 'object' && !Array.isArray(dv)) {
      result[key] = mergeConfig(dv, ov || {})
    } else if (typeof ov !== 'undefined') {
      result[key] = ov
    }
  }
  return result
}


