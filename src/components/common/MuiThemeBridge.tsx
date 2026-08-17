import { useMemo, type ReactNode } from 'react'
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material'

/**
 * Keeps MUI components (e.g. NewAdmissionDialog) in sync with the app's
 * Tailwind/shadcn light-dark mode. Intentionally skips CssBaseline so it
 * doesn't fight the Tailwind base styles that already own body/global resets.
 */
export function MuiThemeBridge({ mode, children }: { mode: 'light' | 'dark'; children: ReactNode }) {
  const theme = useMemo(
    () =>
      createTheme({
        direction: 'rtl',
        palette: {
          mode,
          primary: { main: '#3a8ca3' },
        },
        typography: {
          fontFamily: "'Tajawal', sans-serif",
        },
      }),
    [mode],
  )

  return <MuiThemeProvider theme={theme}>{children}</MuiThemeProvider>
}
