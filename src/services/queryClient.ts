import { QueryClient } from '@tanstack/react-query'
import { esErrorApi } from './apiClient'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      // No reintentar errores 4xx (permisos, no existe, validación)
      retry: (failureCount, error) => {
        const status = esErrorApi(error) ? error.status : null
        if (status && status >= 400 && status < 500) return false
        return failureCount < 2
      },
    },
  },
})
