import { theme as antdTheme, type ThemeConfig } from 'antd'
import { useTheme } from '@/contexts/ThemeContext'

/**
 * Matches the theme tokens used in the finance project (src/antdTheme.ts),
 * so this trial page looks consistent with that app's antd styling.
 */
const sharedToken: ThemeConfig['token'] = {
  colorPrimary: '#173A66',
  colorInfo: '#173A66',
  colorSuccess: '#16a34a',
  colorWarning: '#d97706',
  colorError: '#dc2626',
  fontFamily: '"Tajawal", sans-serif',
  borderRadius: 10,
}

export const lightAntTheme: ThemeConfig = {
  algorithm: antdTheme.defaultAlgorithm,
  token: {
    ...sharedToken,
    colorBgLayout: '#f1f5f9',
    colorBgContainer: '#ffffff',
  },
}

export const darkAntTheme: ThemeConfig = {
  algorithm: antdTheme.darkAlgorithm,
  token: {
    ...sharedToken,
    colorBgLayout: '#141414',
    colorBgContainer: '#1f1f1f',
  },
}

/** @deprecated use `useAntTheme()` so the theme follows the app's dark-mode state */
export const antTheme = lightAntTheme

export function useAntTheme(): ThemeConfig {
  const { theme } = useTheme()
  return theme === 'dark' ? darkAntTheme : lightAntTheme
}
