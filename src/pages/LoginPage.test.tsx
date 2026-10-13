import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { createMemoryRouter, Outlet, RouterProvider } from 'react-router'
import { describe, expect, it } from 'vitest'
import { AuthProvider } from '@/context/AuthContext'
import { CONTRASENA_DEMO } from '@/mocks/fixtures/usuarios'
import { server } from '@/mocks/server'
import { InicioPorRol } from '@/routes/InicioPorRol'
import { ProtectedRoute } from '@/routes/ProtectedRoute'
import { PublicOnlyRoute } from '@/routes/PublicOnlyRoute'
import LoginPage from './LoginPage'

function renderLogin(ruta = '/login') {
  const router = createMemoryRouter(
    [
      { element: <PublicOnlyRoute />, children: [{ path: '/login', element: <LoginPage /> }] },
      { path: '/primer-uso', element: <p>Primer uso</p> },
      {
        element: <ProtectedRoute />,
        children: [
          {
            element: <Outlet />,
            children: [
              { path: '/inicio', element: <InicioPorRol /> },
              { path: '/casos', element: <p>Mis casos</p> },
            ],
          },
        ],
      },
    ],
    { initialEntries: [ruta] },
  )
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>,
  )
  return { router, user: userEvent.setup() }
}

async function ingresar(user: ReturnType<typeof userEvent.setup>, correo: string) {
  await user.type(await screen.findByLabelText(/Correo electrónico/), correo)
  await user.type(screen.getByLabelText(/^Contraseña/), CONTRASENA_DEMO)
  await user.click(screen.getByRole('button', { name: 'Ingresar' }))
}

describe('LoginPage', () => {
  it('el técnico aterriza en sus casos', async () => {
    const { router, user } = renderLogin()
    await ingresar(user, 'tecnico@anuc.test')
    expect(await screen.findByText('Mis casos')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/casos')
  })

  it('avisa que la sesión expiró', async () => {
    renderLogin('/login?expirada=1')
    expect(await screen.findByText('Tu sesión expiró.')).toBeInTheDocument()
    expect(screen.getByText('Tu sesión expiró.').closest('[role="status"]')).not.toBeNull()
  })

  it('cambia la contraseña temporal y entra', async () => {
    const { router, user } = renderLogin()
    await ingresar(user, 'jhon.sanabria@anuc.test')
    const nueva = await screen.findByLabelText(/^Nueva contraseña/)
    expect(screen.getByRole('heading', { name: 'Crea tu nueva contraseña' })).toBeInTheDocument()
    expect(nueva).toHaveFocus()

    await user.type(nueva, 'abcdefgh')
    await user.type(screen.getByLabelText(/^Confirma la nueva/), 'otra1234')
    await user.click(screen.getByRole('button', { name: 'Guardar y entrar' }))
    expect(await screen.findByText(/Usa al menos 8 caracteres/)).toBeInTheDocument()
    expect(screen.getByText('Las contraseñas no coinciden')).toBeInTheDocument()

    await user.clear(nueva)
    await user.type(nueva, 'nueva1234')
    await user.clear(screen.getByLabelText(/^Confirma la nueva/))
    await user.type(screen.getByLabelText(/^Confirma la nueva/), 'nueva1234')
    await user.click(screen.getByRole('button', { name: 'Guardar y entrar' }))
    expect(await screen.findByText('Mis casos')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/casos')
  })

  it('lleva a primer uso si todavía no hay líder técnico', async () => {
    server.use(http.get('/api/v1/auth/estado', () => HttpResponse.json({ hay_lider: false })))
    renderLogin()
    expect(await screen.findByText('Primer uso')).toBeInTheDocument()
  })
})
