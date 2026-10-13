import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, Outlet, RouterProvider } from 'react-router'
import { describe, expect, it } from 'vitest'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { CONTRASENA_DEMO } from '@/mocks/fixtures/usuarios'
import { ProtectedRoute } from './ProtectedRoute'
import { PublicOnlyRoute } from './PublicOnlyRoute'

/** Formulario mínimo para probar el AuthContext con el simulador de Cognito. */
function LoginDePrueba() {
  const { iniciarSesion, confirmarNuevaContrasena } = useAuth()
  return (
    <>
      <button onClick={() => iniciarSesion('lider@anuc.test', CONTRASENA_DEMO)}>
        Entrar líder
      </button>
      <button onClick={() => iniciarSesion('jhon.sanabria@anuc.test', CONTRASENA_DEMO)}>
        Entrar con temporal
      </button>
      <button onClick={() => confirmarNuevaContrasena('nueva1234')}>Cambiar contraseña</button>
    </>
  )
}

function Panel() {
  const { usuario } = useAuth()
  return <p>Panel de {usuario?.nombre}</p>
}

function renderApp(ruta: string) {
  const router = createMemoryRouter(
    [
      {
        element: <PublicOnlyRoute />,
        children: [{ path: '/login', element: <LoginDePrueba /> }],
      },
      {
        element: <ProtectedRoute />,
        children: [{ element: <Outlet />, children: [{ path: '/inicio', element: <Panel /> }] }],
      },
    ],
    { initialEntries: [ruta] },
  )
  render(
    <QueryClientProvider client={new QueryClient()}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>,
  )
  return { router, user: userEvent.setup() }
}

describe('sesión y rutas protegidas', () => {
  it('sin sesión lleva a /login y, al entrar, vuelve a la ruta pedida', async () => {
    const { router, user } = renderApp('/inicio')
    await user.click(await screen.findByRole('button', { name: 'Entrar líder' }))
    expect(await screen.findByText('Panel de Wilmar Torres')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/inicio')
  })

  it('con contraseña temporal no entra hasta cambiarla', async () => {
    const { user } = renderApp('/login')
    await user.click(await screen.findByRole('button', { name: 'Entrar con temporal' }))
    await new Promise((r) => setTimeout(r, 400))
    expect(screen.queryByText(/Panel de/)).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Cambiar contraseña' }))
    expect(await screen.findByText('Panel de Jhon Fredy Sanabria')).toBeInTheDocument()
  })
})
