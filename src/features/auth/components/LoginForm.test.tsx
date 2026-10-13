import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '@/context/AuthContext'
import { CONTRASENA_DEMO } from '@/mocks/fixtures/usuarios'
import { LoginForm, type AvisoLogin } from './LoginForm'

function renderForm({
  aviso = null,
  correoInicial,
}: { aviso?: AvisoLogin | null; correoInicial?: string } = {}) {
  const onSuccess = vi.fn()
  const onNuevaContrasena = vi.fn()
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <AuthProvider>
        <MemoryRouter>
          <LoginForm
            aviso={aviso}
            correoInicial={correoInicial}
            onSuccess={onSuccess}
            onNuevaContrasena={onNuevaContrasena}
          />
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  )
  return { onSuccess, onNuevaContrasena, user: userEvent.setup() }
}

async function ingresar(user: ReturnType<typeof userEvent.setup>, correo: string, clave: string) {
  await user.type(screen.getByLabelText(/Correo electrónico/), correo)
  await user.type(screen.getByLabelText(/^Contraseña/), clave)
  await user.click(screen.getByRole('button', { name: 'Ingresar' }))
}

describe('LoginForm', () => {
  it('valida campos obligatorios y formato del correo', async () => {
    const { user } = renderForm()
    await user.click(screen.getByRole('button', { name: 'Ingresar' }))
    expect(await screen.findByText('Escribe tu correo electrónico')).toBeInTheDocument()
    expect(screen.getByText('Escribe tu contraseña')).toBeInTheDocument()

    await user.type(screen.getByLabelText(/Correo electrónico/), 'sin-arroba')
    await user.click(screen.getByRole('button', { name: 'Ingresar' }))
    expect(
      await screen.findByText('Escribe un correo válido, por ejemplo nombre@anuc.org'),
    ).toBeInTheDocument()
  })

  it('muestra el error genérico y conserva los valores', async () => {
    const { user, onSuccess } = renderForm()
    await ingresar(user, 'lider@anuc.test', 'incorrecta')
    const alerta = await screen.findByRole('alert')
    expect(alerta).toHaveTextContent(
      'No pudimos iniciar sesión. El correo o la contraseña no son correctos. Revisa los datos e intenta de nuevo.',
    )
    expect(screen.getByLabelText(/Correo electrónico/)).toHaveValue('lider@anuc.test')
    expect(screen.getByLabelText(/^Contraseña/)).toHaveValue('incorrecta')
    expect(onSuccess).not.toHaveBeenCalled()
  })

  it('da el mismo mensaje genérico si la cuenta está deshabilitada', async () => {
    const { user } = renderForm()
    await ingresar(user, 'diana.rincon@anuc.test', CONTRASENA_DEMO)
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'El correo o la contraseña no son correctos',
    )
  })

  it('avisa de demasiados intentos', async () => {
    const { user } = renderForm()
    for (let i = 0; i < 6; i++) {
      await user.clear(screen.getByLabelText(/Correo electrónico/))
      await user.clear(screen.getByLabelText(/^Contraseña/))
      await ingresar(user, 'lider@anuc.test', 'mal')
      await screen.findByRole('alert')
    }
    expect(await screen.findByText('Demasiados intentos.')).toBeInTheDocument()
  }, 20_000)

  it('inicia sesión con credenciales válidas', async () => {
    const { user, onSuccess } = renderForm()
    await ingresar(user, 'lider@anuc.test', CONTRASENA_DEMO)
    await vi.waitFor(() => expect(onSuccess).toHaveBeenCalled())
  })

  it('pide la nueva contraseña si la cuenta tiene contraseña temporal', async () => {
    const { user, onNuevaContrasena, onSuccess } = renderForm()
    await ingresar(user, 'jhon.sanabria@anuc.test', CONTRASENA_DEMO)
    await vi.waitFor(() => expect(onNuevaContrasena).toHaveBeenCalled())
    expect(onSuccess).not.toHaveBeenCalled()
  })

  it('permite mostrar y ocultar la contraseña', async () => {
    const { user } = renderForm()
    const input = screen.getByLabelText(/^Contraseña/)
    expect(input).toHaveAttribute('type', 'password')
    await user.click(screen.getByRole('button', { name: 'Mostrar contraseña' }))
    expect(input).toHaveAttribute('type', 'text')
    expect(screen.getByRole('button', { name: 'Ocultar contraseña' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('muestra el aviso de contraseña actualizada con el correo escrito', () => {
    renderForm({
      aviso: { tono: 'ok', titulo: 'Contraseña actualizada.', texto: 'Inicia sesión.' },
      correoInicial: 'tecnico@anuc.test',
    })
    expect(screen.getByRole('status')).toHaveTextContent('Contraseña actualizada. Inicia sesión.')
    expect(screen.getByLabelText(/Correo electrónico/)).toHaveValue('tecnico@anuc.test')
    expect(screen.getByLabelText(/^Contraseña/)).toHaveValue('')
  })

  it('enlaza a recuperar la cuenta', () => {
    renderForm()
    expect(screen.getByRole('link', { name: 'Recupérala' })).toHaveAttribute(
      'href',
      '/recuperar-cuenta',
    )
  })
})
