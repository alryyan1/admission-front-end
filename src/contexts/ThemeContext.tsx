import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

type Theme = 'light' | 'dark'

export type AdmissionHeaderBg = 'none' | 'fillAlter' | 'primaryBg' | 'infoBg' | 'statusReactive'
export type AdmissionHeaderFontSize = 'sm' | 'md' | 'lg' | 'xl'

const STORAGE_KEY = 'theme'
const ADMISSION_HEADER_BG_STORAGE_KEY = 'admissionHeaderBg'
const ADMISSION_HEADER_FONT_SIZE_STORAGE_KEY = 'admissionHeaderFontSize'

export const ADMISSION_HEADER_BG_OPTIONS: { value: AdmissionHeaderBg; label: string }[] = [
  { value: 'none', label: 'بدون خلفية' },
  { value: 'fillAlter', label: 'رمادي خفيف' },
  { value: 'primaryBg', label: 'أزرق خفيف' },
  { value: 'infoBg', label: 'أزرق معلوماتي' },
  { value: 'statusReactive', label: 'حسب الحالة (أخضر عند التنويم)' },
]

export const ADMISSION_HEADER_FONT_SIZE_OPTIONS: { value: AdmissionHeaderFontSize; label: string }[] = [
  { value: 'sm', label: 'صغير' },
  { value: 'md', label: 'متوسط' },
  { value: 'lg', label: 'كبير' },
  { value: 'xl', label: 'كبير جداً' },
]

export const ADMISSION_HEADER_FONT_SIZE_PX: Record<AdmissionHeaderFontSize, { name: number; secondary: number }> = {
  sm: { name: 13, secondary: 11 },
  md: { name: 15, secondary: 12 },
  lg: { name: 17, secondary: 13 },
  xl: { name: 19, secondary: 14 },
}

interface ThemeContextValue {
  theme: Theme
  toggleTheme: () => void
  admissionHeaderBg: AdmissionHeaderBg
  setAdmissionHeaderBg: (value: AdmissionHeaderBg) => void
  admissionHeaderFontSize: AdmissionHeaderFontSize
  setAdmissionHeaderFontSize: (value: AdmissionHeaderFontSize) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function getInitialTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') {
    return stored
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function getInitialAdmissionHeaderBg(): AdmissionHeaderBg {
  const stored = localStorage.getItem(ADMISSION_HEADER_BG_STORAGE_KEY)
  if (ADMISSION_HEADER_BG_OPTIONS.some((o) => o.value === stored)) {
    return stored as AdmissionHeaderBg
  }
  return 'none'
}

function getInitialAdmissionHeaderFontSize(): AdmissionHeaderFontSize {
  const stored = localStorage.getItem(ADMISSION_HEADER_FONT_SIZE_STORAGE_KEY)
  if (ADMISSION_HEADER_FONT_SIZE_OPTIONS.some((o) => o.value === stored)) {
    return stored as AdmissionHeaderFontSize
  }
  return 'md'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)
  const [admissionHeaderBg, setAdmissionHeaderBg] = useState<AdmissionHeaderBg>(getInitialAdmissionHeaderBg)
  const [admissionHeaderFontSize, setAdmissionHeaderFontSize] = useState<AdmissionHeaderFontSize>(
    getInitialAdmissionHeaderFontSize,
  )

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  useEffect(() => {
    localStorage.setItem(ADMISSION_HEADER_BG_STORAGE_KEY, admissionHeaderBg)
  }, [admissionHeaderBg])

  useEffect(() => {
    localStorage.setItem(ADMISSION_HEADER_FONT_SIZE_STORAGE_KEY, admissionHeaderFontSize)
  }, [admissionHeaderFontSize])

  function toggleTheme() {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme,
        admissionHeaderBg,
        setAdmissionHeaderBg,
        admissionHeaderFontSize,
        setAdmissionHeaderFontSize,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
