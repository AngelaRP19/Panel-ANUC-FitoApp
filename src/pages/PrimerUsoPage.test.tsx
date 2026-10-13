import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, Outlet, RouterProvider } from 'react-router'
import { describe, expect, it } from 'vitest'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { fijarEscenario } from '@/mocks/escenario'
import { ProtectedRoute } from '@/routes/ProtectedRoute'
import { PublicOnlyRoute } from '@/routes/PublicOnlyRoute'
import PrimerUsoPage from './PrimerUsoPage'

function Inicio() {
  const { usuario } = useAuth()
  return (
    <p>
      Inicio de {usuario?.nombre} ({usuario?.rol})
    </p>
  )
}

function renderPrimerUso() {
  const router = createMemoryRouter(
    [
      {
        element: <PublicOnlyRoute />,
        children: [
          { path: '/primer-uso', element: <PrimerUsoPage /> },
          { path: '/login', element: <p>Pantalla de login</p> },
        ],
      },
      {
        element: <ProtectedRoute />,
        children: [{ element: <Outlet />, children: [{ path: '/inicio', element: <Inicio /> }] }],
      },
    ],
    { initialEntries: ['/primer-uso'] },
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

type Usuario = ReturnType<typeof userEvent.setup>

async function llenar(
  user: Usuario,
  datos: { nombre?: string; correo?: string; celular?: string; clave?: string; conf?: string },
) {
  if (datos.nombre) await user.type(screen.getByLabelText(/^Nombre completo/), datos.nombre)
  if (datos.correo) await user.type(screen.getByLabelText(/^Correo electrónico/), datos.correo)
  if (datos.celular) await user.type(screen.getByLabelText(/^Celular/), datos.celular)
  if (datos.clave) await user.type(screen.getByLabelText(/^Contraseña/), datos.clave)
  if (datos.conf) await user.type(screen.getByLabelText(/^Confirmar contraseña/), datos.conf)
}

describe('PrimerUsoPage', () => {
  it('con un líder existente redirige al login', async () => {
    renderPrimerUso()
    expect(await screen.findByText('Pantalla de login')).toBeInTheDocument()
  })

  it('valida el formulario sin vaciarlo y marca los requisitos en vivo', async () => {
    fijarEscenario('sin-lider')
    const { user } = renderPrimerUso()
    expect(
      await screen.findByRole('heading', { name: 'Crea la cuenta del líder técnico' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Primer uso · 3 pasos')).toBeInTheDocument()

    await llenar(user, {
      nombre: 'Wilmar Torres',
      correo: 'wilmar.torres@anuc.org',
      celular: '213 402 7781',
      clave: 'Zetaquira2026',
      conf: 'Zetaquira202',
    })
    expect(screen.getByText('Mínimo 8 caracteres')).toHaveTextContent('cumple')
    await user.click(screen.getByRole('button', { name: 'Crear cuenta y entrar' }))

    expect(await screen.findByText('Las contraseñas no coinciden')).toBeInTheDocument()
    expect(screen.getByText(/Escribe un celular de 10 dígitos/)).toBeInTheDocument()
    expect(screen.getByLabelText(/^Nombre completo/)).toHaveValue('Wilmar Torres')
  })

  it('marca los datos duplicados que informa el backend', async () => {
    fijarEscenario('sin-lider')
    const { user } = renderPrimerUso()
    await screen.findByRole('heading', { name: 'Crea la cuenta del líder técnico' })
    await llenar(user, {
      nombre: 'Otra Persona',
      correo: 'tecnico@anuc.test',
      celular: '313 402 7781',
      clave: 'Zetaquira2026',
      conf: 'Zetaquira2026',
    })
    await user.click(screen.getByRole('button', { name: 'Crear cuenta y entrar' }))
    expect(await screen.findByText('Este correo ya está registrado')).toBeInTheDocument()
    expect(screen.getByText('Este número de celular ya está registrado')).toBeInTheDocument()
  })

  it('crea la cuenta y entra al panel como líder técnico', async () => {
    fijarEscenario('sin-lider')
    const { router, user } = renderPrimerUso()
    await screen.findByRole('heading', { name: 'Crea la cuenta del líder técnico' })
    await llenar(user, {
      nombre: 'Camila Rodríguez',
      correo: 'camila.rodriguez@anuc.org',
      celular: '312 345 6789',
      clave: 'Zetaquira2026',
      conf: 'Zetaquira2026',
    })
    await user.click(screen.getByRole('button', { name: 'Crear cuenta y entrar' }))
    expect(
      await screen.findByText('Inicio de Camila Rodríguez (LIDER_TECNICO)'),
    ).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/inicio')
  })
})
