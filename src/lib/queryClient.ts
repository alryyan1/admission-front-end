import { QueryClient } from '@tanstack/react-query'
import type { AxiosError } from 'axios'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        const status = (error as AxiosError).response?.status
        if (status === 429) return false
        return failureCount < 1
      },
      refetchOnWindowFocus: false,
    },
  },
})
