import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, Outlet, RouterProvider } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '@/context/AuthContext'
import { CODIGO_RECUPERACION_DEMO } from '@/mocks/authSimulado'
import { usuarios } from '@/mocks/fixtures/usuarios'
import { InicioPorRol } from '@/routes/InicioPorRol'
import { ProtectedRoute } from '@/routes/ProtectedRoute'
import { PublicOnlyRoute } from '@/routes/PublicOnlyRoute'
import LoginPage from './LoginPage'
import RecuperarCuentaPage from './RecuperarCuentaPage'

const anaOriginal = { ...usuarios.find((u) => u.id === 'u-ana')! }

afterEach(() => {
  // El simulador cambia la contraseña de la cuenta: se restaura para las demás pruebas.
  Object.assign(
    usuarios.find((u) => u.id === 'u-ana')!,
    anaOriginal,
  )
  vi.useRealTimers()
})

function renderRecuperar() {
  const router = createMemoryRouter(
    [
      {
        element: <PublicOnlyRoute />,
        children: [
          { path: '/login', element: <LoginPage /> },
          { path: '/recuperar-cuenta', element: <RecuperarCuentaPage /> },
        ],
      },
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
    { initialEntries: ['/recuperar-cuenta'] },
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
  return { router }
}

describe('RecuperarCuentaPage', () => {
  it('no avanza si el correo no tiene cuenta (RQF06)', async () => {
    const user = userEvent.setup()
    renderRecuperar()
    const correo = await screen.findByLabelText(/^Correo electrónico/)
    expect(correo).toHaveFocus()
    await user.type(correo, 'carlos.perez@anuc.org')
    await user.click(screen.getByRole('button', { name: 'Enviar código' }))
    expect(
      await screen.findByText('No hay ninguna cuenta registrada con este correo'),
    ).toBeInTheDocument()
    expect(correo).toHaveAttribute('aria-invalid', 'true')
    expect(screen.queryByText('Paso 2 de 2')).not.toBeInTheDocument()
  })

  it('valida el código y la nueva contraseña, y vuelve al login con el aviso', async () => {
    const user = userEvent.setup()
    const { router } = renderRecuperar()
    await user.type(await screen.findByLabelText(/^Correo electrónico/), 'tecnico@anuc.test')
    await user.click(screen.getByRole('button', { name: 'Enviar código' }))

    expect(await screen.findByText('Paso 2 de 2')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(
      'Te enviamos un código de verificación a tecnico@anuc.test. Escríbelo aquí; vence en 10 minutos.',
    )
    const codigo = screen.getByLabelText(/^Código de verificación/)
    expect(codigo).toHaveFocus()
    expect(codigo).toHaveAttribute('autocomplete', 'one-time-code')
    expect(screen.getByRole('button', { name: /Reenviar código en 30 s/ })).toBeDisabled()

    // Código incorrecto
    await user.type(codigo, '000000')
    await user.type(screen.getByLabelText(/^Nueva contraseña/), 'Maracuya2026')
    await user.type(screen.getByLabelText(/^Confirma la nueva/), 'Maracuya2026')
    await user.click(screen.getByRole('button', { name: 'Cambiar contraseña' }))
    expect(
      await screen.findByText('El código no es correcto o ya venció. Pide uno nuevo.'),
    ).toBeInTheDocument()

    // Código correcto
    await user.clear(codigo)
    await user.type(codigo, CODIGO_RECUPERACION_DEMO)
    await user.click(screen.getByRole('button', { name: 'Cambiar contraseña' }))

    expect(await screen.findByText('Contraseña actualizada.')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/login')
    expect(screen.getByLabelText(/Correo electrónico/)).toHaveValue('tecnico@anuc.test')
    expect(screen.getByLabelText(/^Contraseña/)).toHaveValue('')

    // Entra con la contraseña nueva
    await user.type(screen.getByLabelText(/^Contraseña/), 'Maracuya2026')
    await user.click(screen.getByRole('button', { name: 'Ingresar' }))
    expect(await screen.findByText('Mis casos')).toBeInTheDocument()
  })

  it('valida el formato del código y que las contraseñas coincidan', async () => {
    const user = userEvent.setup()
    renderRecuperar()
    await user.type(await screen.findByLabelText(/^Correo electrónico/), 'lider@anuc.test')
    await user.click(screen.getByRole('button', { name: 'Enviar código' }))
    await screen.findByText('Paso 2 de 2')
    await user.type(screen.getByLabelText(/^Código de verificación/), '12a')
    await user.type(screen.getByLabelText(/^Nueva contraseña/), 'corta')
    await user.type(screen.getByLabelText(/^Confirma la nueva/), 'otra')
    await user.click(screen.getByRole('button', { name: 'Cambiar contraseña' }))
    expect(await screen.findByText('El código tiene 6 dígitos')).toBeInTheDocument()
    expect(screen.getByText(/Usa al menos 8 caracteres/)).toBeInTheDocument()
    expect(screen.getByText('Las contraseñas no coinciden')).toBeInTheDocument()
  })

  it('habilita el reenvío del código después de 30 s', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    renderRecuperar()
    await user.type(await screen.findByLabelText(/^Correo electrónico/), 'lider@anuc.test')
    await user.click(screen.getByRole('button', { name: 'Enviar código' }))
    await screen.findByText('Paso 2 de 2')

    for (let i = 0; i < 30; i++) {
      await act(() => vi.advanceTimersByTimeAsync(1000))
    }
    const reenviar = screen.getByRole('button', { name: 'Reenviar código' })
    expect(reenviar).toBeEnabled()
    expect(screen.getByText('Ya puedes pedir un código nuevo.')).toBeInTheDocument()
    await user.click(reenviar)
    expect(await screen.findByText(/Te enviamos un código nuevo a/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Reenviar código en 30 s/ })).toBeDisabled()
  })
})
