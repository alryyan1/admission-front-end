import { useMemo, type ReactNode } from 'react'
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material'
import { CacheProvider } from '@emotion/react'
import createCache from '@emotion/cache'
import rtlPlugin from 'stylis-plugin-rtl'

// MUI's `direction: 'rtl'` theme option only flips a handful of
// component-level behaviors (Popper placement, Select icon side, etc). The
// physical CSS MUI generates (padding/margin/left/right) stays LTR unless an
// emotion cache runs it through the stylis RTL plugin — without this, inputs
// like NewAdmissionDialog's Autocompletes render mirrored/broken in RTL.
const rtlCache = createCache({
  key: 'muirtl',
  stylisPlugins: [rtlPlugin],
})

/**
 * Keeps MUI components (e.g. NewAdmissionDialog) in sync with the app's
 * Tailwind light-dark mode. Intentionally skips CssBaseline so it
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

  return (
    <CacheProvider value={rtlCache}>
      <MuiThemeProvider theme={theme}>{children}</MuiThemeProvider>
    </CacheProvider>
  )
}
