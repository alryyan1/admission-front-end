import type { ThemeConfig } from 'antd'

/**
 * Matches the theme tokens used in the finance project (src/antdTheme.ts),
 * so this trial page looks consistent with that app's antd styling.
 */
export const antTheme: ThemeConfig = {
  token: {
    colorPrimary: '#173A66',
    colorInfo: '#173A66',
    colorSuccess: '#16a34a',
    colorWarning: '#d97706',
    colorError: '#dc2626',
    colorBgLayout: '#f1f5f9',
    colorBgContainer: '#ffffff',
    fontFamily: '"Tajawal", sans-serif',
    borderRadius: 10,
  },
}
