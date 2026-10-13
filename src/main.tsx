import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from '@/components/ui/Toast'
import { TooltipProvider } from '@/components/ui/Tooltip'
import { env } from '@/config/env'
import { AuthProvider } from '@/context/AuthContext'
import { queryClient } from '@/services/queryClient'
import App from './App'
import './styles/index.css'

/** Con VITE_USE_MOCKS=true, la API se simula con MSW (sin backend). */
async function prepararMocks() {
  if (!env.usarMocks) return
  try {
    const { worker } = await import('./mocks/browser')
    await worker.start({ onUnhandledRequest: 'bypass' })
  } catch (error) {
    // Sin Service Worker (p. ej. navegador que lo bloquea) la app igual carga; la API no responderá.
    console.error('[mocks] No se pudo iniciar MSW; la API simulada no está disponible.', error)
  }
}

prepararMocks().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <App />
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </StrictMode>,
  )
})
