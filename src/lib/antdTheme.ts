import { theme as antdTheme, type ThemeConfig } from 'antd'
import { useTheme } from '@/contexts/ThemeContext'

const sharedToken: ThemeConfig['token'] = {
  fontFamily: '"Tajawal", sans-serif',
}

export const lightAntTheme: ThemeConfig = {
  algorithm: antdTheme.defaultAlgorithm,
  token: {
    ...sharedToken,
    colorBgLayout: '#ffffff',
  },
}

export const darkAntTheme: ThemeConfig = {
  algorithm: antdTheme.darkAlgorithm,
  token: sharedToken,
}

/** @deprecated use `useAntTheme()` so the theme follows the app's dark-mode state */
export const antTheme = lightAntTheme

export function useAntTheme(): ThemeConfig {
  const { theme } = useTheme()
  return theme === 'dark' ? darkAntTheme : lightAntTheme
}
