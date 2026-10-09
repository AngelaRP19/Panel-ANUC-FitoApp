import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '@/context/AuthContext'
import { LIDER_DEMO } from '@/mocks/handlers'
import { LoginForm } from './LoginForm'

function renderForm(onSuccess = vi.fn()) {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <AuthProvider>
        <LoginForm onSuccess={onSuccess} />
      </AuthProvider>
    </QueryClientProvider>,
  )
  return { onSuccess, user: userEvent.setup() }
}

describe('LoginForm', () => {
  it('valida campos obligatorios y formato del correo', async () => {
    const { user } = renderForm()
    await user.click(screen.getByRole('button', { name: 'Ingresar' }))
    expect(await screen.findByText('Ingresa tu correo electrónico')).toBeInTheDocument()
    expect(screen.getByText('Ingresa tu contraseña')).toBeInTheDocument()

    await user.type(screen.getByLabelText(/Correo electrónico/), 'sin-arroba')
    await user.click(screen.getByRole('button', { name: 'Ingresar' }))
    expect(await screen.findByText(/Escribe un correo válido/)).toBeInTheDocument()
  })

  it('muestra un error genérico con credenciales incorrectas', async () => {
    const { user, onSuccess } = renderForm()
    await user.type(screen.getByLabelText(/Correo electrónico/), LIDER_DEMO.correo)
    await user.type(screen.getByLabelText(/^Contraseña/), 'incorrecta')
    await user.click(screen.getByRole('button', { name: 'Ingresar' }))
    expect(await screen.findByText('No pudimos iniciar sesión.')).toBeInTheDocument()
    expect(onSuccess).not.toHaveBeenCalled()
  })

  it('inicia sesión con credenciales válidas', async () => {
    const { user, onSuccess } = renderForm()
    await user.type(screen.getByLabelText(/Correo electrónico/), LIDER_DEMO.correo)
    await user.type(screen.getByLabelText(/^Contraseña/), LIDER_DEMO.password)
    await user.click(screen.getByRole('button', { name: 'Ingresar' }))
    await vi.waitFor(() => expect(onSuccess).toHaveBeenCalled())
  })

  it('permite mostrar y ocultar la contraseña', async () => {
    const { user } = renderForm()
    const input = screen.getByLabelText(/^Contraseña/)
    expect(input).toHaveAttribute('type', 'password')
    await user.click(screen.getByRole('button', { name: 'Mostrar contraseña' }))
    expect(input).toHaveAttribute('type', 'text')
  })
})
