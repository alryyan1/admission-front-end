import type { ReactNode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext'
import { MuiThemeBridge } from '@/components/common/MuiThemeBridge'
import { queryClient } from '@/lib/queryClient'
import { router } from '@/router'

function AppProviders({ children }: { children: ReactNode }) {
  const { theme } = useTheme()
  return <MuiThemeBridge mode={theme}>{children}</MuiThemeBridge>
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AppProviders>
          <AuthProvider>
            <RouterProvider router={router} />
          </AuthProvider>
          <Toaster richColors position="top-center" dir="rtl" />
        </AppProviders>
      </QueryClientProvider>
    </ThemeProvider>
  )
}

export default App
