import type { Buffer as NodeBuffer } from 'buffer'

declare global {
  interface Window {
    Buffer: typeof NodeBuffer
  }
}

declare module 'arabic-reshaper' {
  const ArabicReshaper: { convertArabic(text: string): string }
  export default ArabicReshaper
}

export {}
