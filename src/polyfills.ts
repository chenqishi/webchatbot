// Polyfills for AWS SDK in browser environment
import { Buffer } from 'buffer'

// Make Buffer available globally
;(window as any).Buffer = Buffer
;(window as any).global = window
;(window as any).process = { env: {} }

// AWS SDK requires these globals
if (typeof (window as any).Buffer === 'undefined') {
  (window as any).Buffer = Buffer
}

if (typeof (window as any).process === 'undefined') {
  (window as any).process = { env: {} }
}

// Ensure window.crypto.randomUUID exists (fallback for older browsers/build envs)
;(function ensureRandomUUID() {
  const w = window as any
  if (!w.crypto) {
    w.crypto = {}
  }
  if (typeof w.crypto.getRandomValues !== 'function') {
    // minimal getRandomValues fallback using Math.random (lower entropy)
    w.crypto.getRandomValues = function (array: Uint8Array) {
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256)
      }
      return array
    }
  }
  if (typeof w.crypto.randomUUID !== 'function') {
    w.crypto.randomUUID = function (): string {
      const bytes = new Uint8Array(16)
      w.crypto.getRandomValues(bytes)
      // Per RFC 4122 v4
      bytes[6] = (bytes[6] & 0x0f) | 0x40 // version 4
      bytes[8] = (bytes[8] & 0x3f) | 0x80 // variant 10xx
      const byteToHex: string[] = []
      for (let i = 0; i < 256; ++i) {
        byteToHex.push((i + 0x100).toString(16).substring(1))
      }
      const bth = byteToHex
      return (
        bth[bytes[0]] + bth[bytes[1]] + bth[bytes[2]] + bth[bytes[3]] + '-' +
        bth[bytes[4]] + bth[bytes[5]] + '-' +
        bth[bytes[6]] + bth[bytes[7]] + '-' +
        bth[bytes[8]] + bth[bytes[9]] + '-' +
        bth[bytes[10]] + bth[bytes[11]] + bth[bytes[12]] + bth[bytes[13]] + bth[bytes[14]] + bth[bytes[15]]
      )
    }
  }
})()

