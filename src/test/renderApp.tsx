import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { Toaster } from '@/components/ui/Toast'
import { AuthProvider } from '@/context/AuthContext'
import { adaptadorSimulado } from '@/mocks/authSimulado'
import { CONTRASENA_DEMO } from '@/mocks/fixtures/usuarios'
import { rutas } from '@/routes/router'

/** Monta la app real (árbol de rutas completo) con la sesión de `correo` ya iniciada. */
export async function renderApp(correo: string | null, ruta: string) {
  if (correo) await adaptadorSimulado.iniciarSesion(correo, CONTRASENA_DEMO)
  const router = createMemoryRouter(rutas, { initialEntries: [ruta] })
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <AuthProvider>
        <RouterProvider router={router} />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>,
  )
  return { router, user: userEvent.setup() }
}
